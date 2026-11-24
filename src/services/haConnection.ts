/**
 * Home Assistant WebSocket connection service.
 * Manages real-time entity state subscriptions, automatic reconnection,
 * and wake-from-sleep detection for continuous monitoring.
 * @module services/haConnection
 */

import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  Connection,
  HassEntities,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
  ERR_CONNECTION_LOST,
  ERR_HASS_HOST_REQUIRED,
  ERR_INVALID_HTTPS_TO_HTTP,
  ERR_INVALID_AUTH_CALLBACK,
} from "home-assistant-js-websocket";
import mitt, { type Emitter } from "mitt";
import normalizeUrl from "normalize-url";
import { TIMING, RECONNECT_DELAYS, createLogger, type HaEntityState, type HaConnectionStatus } from "@/shared";

/** Timeout error code (outside library's 1–6 range) */
const ERR_TIMEOUT = -1;

/** Maps HA WS error codes → user-facing messages */
const CONNECTION_ERRORS: Record<number, string> = {
  [ERR_CANNOT_CONNECT]: "Cannot connect to Home Assistant. Check URL and network.",
  [ERR_INVALID_AUTH]: "Invalid access token. Check your long-lived token.",
  [ERR_CONNECTION_LOST]: "Connection lost. Reconnecting...",
  [ERR_HASS_HOST_REQUIRED]: "Home Assistant URL is required.",
  [ERR_INVALID_HTTPS_TO_HTTP]: "Cannot connect: HTTPS to HTTP downgrade is not allowed.",
  [ERR_INVALID_AUTH_CALLBACK]: "Authentication callback is invalid.",
  [ERR_TIMEOUT]: "Connection timed out. The server may be unreachable.",
};

function connectionErrorMessage(code: number): string {
  return CONNECTION_ERRORS[code] ?? `Connection error (${code})`;
}

const logger = createLogger("[HA WS]");
const log = logger.info;
const logError = logger.error;

/** Event types for the HA connection emitter */
type HaConnectionEvents = {
  "state-update": HassEntities;
  "status-change": { status: HaConnectionStatus; error?: string };
};

// Connection state - consolidated into a single object, persisted on globalThis for HMR compatibility
/** Named connection event handlers for cleanup */
interface ConnectionListeners {
  disconnected: () => void;
}

interface HaConnectionState {
  connection: Connection | null;
  entities: HassEntities;
  status: HaConnectionStatus;
  lastError: string | null;
  unsubscribeEntities: (() => void) | null;
  unsubscribeRegistry: (() => void) | null;
  displayPrecision: Map<string, number>;
  emitter: Emitter<HaConnectionEvents>;
  /** Watchdog interval (heartbeat + wake detection), runs while credentials are stored */
  watchdogId: ReturnType<typeof setInterval> | null;
  /** Pending scheduled reconnect attempt */
  reconnectTimerId: ReturnType<typeof setTimeout> | null;
  /** Consecutive failed attempts, used to pick the backoff delay */
  reconnectAttempt: number;
  /** Incremented per attempt so stale (superseded) attempts can be ignored */
  attemptId: number;
  /** When the current attempt started, to detect stuck attempts */
  connectingSince: number;
  /** Last time anything was received from Home Assistant */
  lastActivityAt: number;
  heartbeatInFlight: boolean;
  credentials: { url: string; token: string } | null;
  connectionListeners: ConnectionListeners | null;
}

declare global {
  var __haState: HaConnectionState | undefined;
}

/** Get or initialize the global connection state (persisted on globalThis for HMR compatibility). */
function getState(): HaConnectionState {
  if (!globalThis.__haState) {
    globalThis.__haState = {
      connection: null,
      entities: {},
      status: "disconnected",
      lastError: null,
      unsubscribeEntities: null,
      unsubscribeRegistry: null,
      displayPrecision: new Map(),
      emitter: mitt<HaConnectionEvents>(),
      watchdogId: null,
      reconnectTimerId: null,
      reconnectAttempt: 0,
      attemptId: 0,
      connectingSince: 0,
      lastActivityAt: 0,
      heartbeatInFlight: false,
      credentials: null,
      connectionListeners: null,
    };
  }
  return globalThis.__haState;
}

/**
 * Convert library entities to our HaEntityState Map format.
 * When filterIds is provided, only those entities are included (much smaller allocation).
 *
 * @param hassEntities - Raw entity state object from home-assistant-js-websocket
 * @param filterIds - Optional list of entity IDs to include (omit for all)
 */
export function entitiesToMap(
  hassEntities: HassEntities,
  filterIds?: string[]
): Map<string, HaEntityState> {
  const precisionMap = getState().displayPrecision;
  const map = new Map<string, HaEntityState>();
  if (filterIds) {
    for (const id of filterIds) {
      const entity = hassEntities[id];
      if (entity) {
        map.set(id, {
          entity_id: entity.entity_id,
          state: entity.state,
          attributes: entity.attributes,
          last_changed: entity.last_changed,
          last_updated: entity.last_updated,
          displayPrecision: precisionMap.get(id),
        });
      }
    }
  } else {
    for (const [entityId, entity] of Object.entries(hassEntities)) {
      map.set(entityId, {
        entity_id: entity.entity_id,
        state: entity.state,
        attributes: entity.attributes,
        last_changed: entity.last_changed,
        last_updated: entity.last_updated,
        displayPrecision: precisionMap.get(entityId),
      });
    }
  }
  return map;
}

/**
 * Update the connection status and emit a status-change event.
 *
 * @param newStatus - New connection status to set
 * @param error - Optional error message associated with the status
 */
function setStatus(newStatus: HaConnectionStatus, error?: string) {
  const state = getState();
  state.status = newStatus;
  state.lastError = newStatus === "connected" ? null : (error ?? state.lastError);
  state.emitter.emit("status-change", { status: newStatus, error });
}

/** Emit a state-update event with the current entity states. */
function notifyStateUpdate() {
  const state = getState();
  state.emitter.emit("state-update", state.entities);
}

/**
 * Race a promise against a timeout. Rejects with `ERR_TIMEOUT` when the
 * timeout fires first.
 *
 * @param promise - Promise to race
 * @param ms - Timeout in milliseconds
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(ERR_TIMEOUT), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Close the current connection and drop its subscriptions and cached state.
 * Keeps credentials, the watchdog, and the reconnect schedule intact.
 */
function teardownConnection(): void {
  const state = getState();
  if (state.unsubscribeEntities) {
    state.unsubscribeEntities();
    state.unsubscribeEntities = null;
  }
  if (state.unsubscribeRegistry) {
    state.unsubscribeRegistry();
    state.unsubscribeRegistry = null;
  }
  removeConnectionListeners();
  if (state.connection) {
    // close() marks the connection as closed on purpose, which also stops the
    // library's own reconnect loop — reconnection is owned by this module.
    state.connection.close();
    state.connection = null;
  }
  state.entities = {};
  state.displayPrecision.clear();
}

/** Cancel a pending scheduled reconnect attempt. */
function clearReconnectTimer(): void {
  const state = getState();
  if (state.reconnectTimerId) {
    clearTimeout(state.reconnectTimerId);
    state.reconnectTimerId = null;
  }
}

/**
 * Schedule the next reconnect attempt using the backoff in `RECONNECT_DELAYS`.
 * Retries indefinitely while credentials are stored; the last delay is reused
 * once the list is exhausted.
 *
 * @param immediate - Retry right away instead of waiting for the backoff delay
 */
function scheduleReconnect(immediate = false): void {
  const state = getState();
  if (!state.credentials) return;
  clearReconnectTimer();

  const delay = immediate
    ? 0
    : RECONNECT_DELAYS[Math.min(state.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
  state.reconnectAttempt++;
  log(`Reconnecting in ${Math.round(delay / 1000)}s (attempt ${state.reconnectAttempt})`);

  state.reconnectTimerId = setTimeout(() => {
    state.reconnectTimerId = null;
    establishConnection().catch(() => {
      // Failure already logged; establishConnection schedules the next attempt
    });
  }, delay);
}

/**
 * Drop a connection that turned out to be dead and reconnect right away.
 *
 * @param reason - Log message describing why the connection was dropped
 */
function handleConnectionLost(reason: string): void {
  const state = getState();
  log(reason);
  state.attemptId++; // An attempt still finishing setup must not report "connected"
  teardownConnection();
  setStatus("disconnected", connectionErrorMessage(ERR_CONNECTION_LOST));
  state.reconnectAttempt = 0;
  scheduleReconnect(true);
}

/**
 * Ping Home Assistant to verify the socket is still alive. After sleep, a
 * network change, or Wi‑Fi power saving the socket can silently stop
 * delivering messages without ever firing a close event; an unanswered ping
 * is the only way to notice.
 */
async function verifyConnection(): Promise<void> {
  const state = getState();
  const connection = state.connection;
  if (!connection || state.heartbeatInFlight) return;

  state.heartbeatInFlight = true;
  try {
    await withTimeout(connection.ping(), TIMING.HEARTBEAT_TIMEOUT_MS);
    state.lastActivityAt = Date.now();
  } catch {
    if (state.connection === connection) {
      handleConnectionLost("Heartbeat failed, reconnecting");
    }
  } finally {
    state.heartbeatInFlight = false;
  }
}

/**
 * Something suggests connectivity may have changed (wake from sleep, network
 * came back online). Verify a live connection, or retry right away instead of
 * waiting out the backoff delay.
 *
 * @param reason - Log message describing the trigger
 */
function handleConnectivityHint(reason: string): void {
  const state = getState();
  if (!state.credentials) return;
  log(reason);
  if (state.status === "connected") {
    verifyConnection();
  } else if (state.status !== "connecting") {
    state.reconnectAttempt = 0;
    scheduleReconnect(true);
  }
}

/** Window `online` event handler (network interface came back). */
function onBrowserOnline(): void {
  handleConnectivityHint("Network came back online");
}

/**
 * Start the connection watchdog. Runs while credentials are stored and:
 * - detects wake from sleep (JS timers pause during sleep, leaving a gap)
 * - pings Home Assistant when the connection has been quiet for a while
 * - restarts attempts stuck in "connecting"
 * - re-arms reconnection if nothing is scheduled while disconnected
 */
function startWatchdog(): void {
  const state = getState();
  if (state.watchdogId) return;

  const wakeThresholdMs = TIMING.WAKE_CHECK_INTERVAL_MS + TIMING.WAKE_THRESHOLD_GRACE_MS;
  let lastTick = Date.now();

  state.watchdogId = setInterval(() => {
    const now = Date.now();
    const elapsed = now - lastTick;
    lastTick = now;
    if (!state.credentials) return;

    if (elapsed > wakeThresholdMs) {
      handleConnectivityHint(`Detected wake from sleep (gap: ${Math.round(elapsed / 1000)}s)`);
      return;
    }

    switch (state.status) {
      case "connected":
        if (now - state.lastActivityAt > TIMING.HEARTBEAT_IDLE_MS) verifyConnection();
        break;
      case "connecting":
        if (now - state.connectingSince > TIMING.CONNECTION_TIMEOUT_MS * 2) {
          log("Connection attempt stuck, restarting it");
          establishConnection().catch(() => { /* handled */ });
        }
        break;
      case "disconnected":
        if (!state.reconnectTimerId) scheduleReconnect();
        break;
    }
  }, TIMING.WAKE_CHECK_INTERVAL_MS);

  if (typeof window !== "undefined") {
    window.addEventListener("online", onBrowserOnline);
  }
}

/** Stop the connection watchdog and the online listener. */
function stopWatchdog(): void {
  const state = getState();
  if (state.watchdogId) {
    clearInterval(state.watchdogId);
    state.watchdogId = null;
  }
  if (typeof window !== "undefined") {
    window.removeEventListener("online", onBrowserOnline);
  }
}

/**
 * Remove connection event listeners stored in state.
 */
function removeConnectionListeners(): void {
  const state = getState();
  if (state.connectionListeners && state.connection) {
    state.connection.removeEventListener("disconnected", state.connectionListeners.disconnected);
  }
  state.connectionListeners = null;
}

/**
 * Listen for the socket closing. Instead of relying on the library's own
 * reconnect loop (which has no connect timeout and reports nothing but auth
 * failures), the connection is torn down and re-established by this module.
 *
 * @param connection - Active Home Assistant WebSocket connection
 */
function setupConnectionListeners(connection: Connection): void {
  const state = getState();
  const listeners: ConnectionListeners = {
    disconnected: () => {
      if (state.connection !== connection) return;
      handleConnectionLost("Connection disconnected");
    },
  };

  connection.addEventListener("disconnected", listeners.disconnected);
  state.connectionListeners = listeners;
}

/**
 * Set up entity subscription to receive state updates.
 *
 * @param connection - Active Home Assistant WebSocket connection
 */
function setupEntitySubscription(connection: Connection): void {
  const state = getState();
  state.unsubscribeEntities = subscribeEntities(connection, (newEntities) => {
    state.lastActivityAt = Date.now();
    state.entities = newEntities;
    notifyStateUpdate();
  });
}

/**
 * Entry in the response from `config/entity_registry/list_for_display`.
 * Only `ei` (entity_id) and `dp` (display precision) are relevant here.
 */
interface EntityRegistryDisplayEntry {
  ei: string;
  dp?: number;
}

interface EntityRegistryDisplayResult {
  entities: EntityRegistryDisplayEntry[];
}

/**
 * Rebuild the display-precision map from the HA entity registry.
 * HA resolves the user-set `display_precision` override first, then the
 * integration's `suggested_display_precision`, and sends the result as `dp`.
 * @param connection - Active HA websocket connection.
 */
async function refreshDisplayPrecision(connection: Connection): Promise<void> {
  const state = getState();
  try {
    const result = await connection.sendMessagePromise<EntityRegistryDisplayResult>({
      type: "config/entity_registry/list_for_display",
    });
    const map = new Map<string, number>();
    for (const entry of result.entities) {
      if (typeof entry.dp === "number") map.set(entry.ei, entry.dp);
    }
    state.displayPrecision = map;
    log(`Loaded display precision for ${map.size} entities`);
    notifyStateUpdate();
  } catch (err) {
    logError("Failed to load entity registry display:", err);
  }
}

/**
 * Subscribe to entity registry updates so precision changes propagate live.
 * @param connection - Active HA websocket connection.
 */
async function setupRegistrySubscription(connection: Connection): Promise<void> {
  const state = getState();
  try {
    await refreshDisplayPrecision(connection);
    const unsubscribe = await connection.subscribeEvents(() => {
      refreshDisplayPrecision(connection).catch(() => {
        // Error already logged in refreshDisplayPrecision
      });
    }, "entity_registry_updated");
    state.unsubscribeRegistry = () => {
      unsubscribe().catch(() => { /* ignore */ });
    };
  } catch (err) {
    logError("Entity registry subscription unavailable; precision disabled:", err);
  }
}

/**
 * Open a new connection using the stored credentials, replacing any existing
 * one. On a non-auth failure, the next attempt is scheduled automatically.
 * Superseded attempts (a newer attempt or disconnect() started meanwhile)
 * resolve silently and leave state untouched.
 *
 * @throws Connection error code when this attempt fails
 */
async function establishConnection(): Promise<void> {
  const state = getState();
  const credentials = state.credentials;
  if (!credentials) return;

  const attemptId = ++state.attemptId;
  clearReconnectTimer();
  teardownConnection();
  state.connectingSince = Date.now();
  setStatus("connecting");
  log("Connecting to", credentials.url);

  const auth = createLongLivedTokenAuth(credentials.url, credentials.token);
  const pending = createConnection({ auth });

  try {
    let connection: Connection;
    try {
      connection = await withTimeout(pending, TIMING.CONNECTION_TIMEOUT_MS);
    } catch (err) {
      // If the connection succeeds after the timeout, don't leak it
      pending.then((late) => late.close(), () => { /* already failed */ });
      throw err;
    }

    if (attemptId !== state.attemptId) {
      connection.close();
      return;
    }

    log("Connected, HA version:", connection.haVersion);
    state.connection = connection;
    state.lastActivityAt = Date.now();
    setupConnectionListeners(connection);
    setupEntitySubscription(connection);
    await setupRegistrySubscription(connection);

    // A newer attempt already replaced (and closed) this connection
    if (attemptId !== state.attemptId) return;

    state.reconnectAttempt = 0;
    setStatus("connected");
  } catch (err) {
    if (attemptId !== state.attemptId) return;

    teardownConnection();
    const errCode = typeof err === "number" ? err : undefined;
    const errMsg = connectionErrorMessage(errCode ?? 0);
    logError("Connection failed:", errMsg);

    if (errCode === ERR_INVALID_AUTH) {
      // Retrying won't help until the user enters a new token
      state.credentials = null;
      stopWatchdog();
      clearReconnectTimer();
      setStatus("auth_invalid", errMsg);
    } else {
      setStatus("disconnected", errMsg);
      scheduleReconnect();
    }
    throw err;
  }
}

/**
 * Connect to Home Assistant and keep the connection alive.
 *
 * Normalizes the URL and stores the credentials, then connects. Until
 * disconnect() is called (or the token is rejected), the connection is
 * monitored and re-established automatically: on socket close, failed
 * heartbeat, wake from sleep, network coming back online, or failed attempts
 * (with backoff).
 *
 * @param url - Home Assistant server URL (protocol optional, defaults to https)
 * @param token - Long-lived access token from HA Settings > Security
 * @throws Re-throws errors from the first connection attempt after updating status
 */
export async function connect(url: string, token: string): Promise<void> {
  const state = getState();
  const normalizedUrl = normalizeUrl(url.trim(), { defaultProtocol: "https" });

  // Store credentials early so reconnect is available if connection fails
  state.credentials = { url: normalizedUrl, token };
  state.reconnectAttempt = 0;
  startWatchdog();

  await establishConnection();
}

/**
 * Close the Home Assistant connection and stop automatic reconnection.
 *
 * Stops the watchdog, cancels pending reconnects, unsubscribes from entities,
 * closes the WebSocket, and clears cached entity state and credentials.
 */
export function disconnect(): void {
  const state = getState();
  log("Disconnecting");
  state.attemptId++; // Invalidate any in-flight attempt
  stopWatchdog();
  clearReconnectTimer();
  teardownConnection();
  state.credentials = null;
  state.reconnectAttempt = 0;
  setStatus("disconnected");
}

/**
 * Get the current connection status.
 */
export function getStatus(): HaConnectionStatus {
  return getState().status;
}

/**
 * Get current entity states as a Map.
 * When filterIds is provided, only those entities are included.
 *
 * @param filterIds - Optional list of entity IDs to include (omit for all)
 */
export function getStates(filterIds?: string[]): Map<string, HaEntityState> {
  return entitiesToMap(getState().entities, filterIds);
}

/**
 * Get the last connection error message, if any.
 */
export function getLastError(): string | null {
  return getState().lastError;
}

/**
 * Check if credentials are stored (for reconnection capability).
 */
export function hasCredentials(): boolean {
  return getState().credentials !== null;
}

/**
 * Retry connection now using stored credentials, skipping any backoff delay.
 * Does nothing if no credentials are stored.
 */
export async function retryConnection(): Promise<void> {
  const state = getState();
  if (!state.credentials) return;

  log("Retrying connection to", state.credentials.url);
  state.reconnectAttempt = 0;
  await establishConnection();
}

// Subscription API

/**
 * Subscribe to Home Assistant entity state changes.
 * Emits the raw HassEntities object reference (no allocation per update).
 * Consumers should extract only the entities they need.
 *
 * @param callback - Called with raw HassEntities on each change
 * @returns Unsubscribe function
 */
export function onStateUpdate(callback: (entities: HassEntities) => void): () => void {
  const state = getState();
  state.emitter.on("state-update", callback);
  return () => state.emitter.off("state-update", callback);
}

/**
 * Subscribe to connection status changes.
 *
 * @param callback - Called with new status and optional error message
 * @returns Unsubscribe function
 *
 * @example
 * const unsubscribe = onStatusChange((status, error) => {
 *   if (status === 'connected') console.log('Connected!');
 *   if (error) console.error(error);
 * });
 */
export function onStatusChange(callback: (status: HaConnectionStatus, error?: string) => void): () => void {
  const state = getState();
  const handler = (event: { status: HaConnectionStatus; error?: string }) => {
    callback(event.status, event.error);
  };
  state.emitter.on("status-change", handler);
  return () => state.emitter.off("status-change", handler);
}

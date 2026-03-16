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
  ERR_INVALID_AUTH,
} from "home-assistant-js-websocket";
import mitt, { type Emitter } from "mitt";
import normalizeUrl from "normalize-url";
import pRetry from "p-retry";
import { TIMING, WAKE_RETRY_DELAYS, normalizeConnectionError, hasErrorCode, createLogger, type HaEntityState, type HaConnectionStatus } from "@/shared";

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
  ready: () => void;
  disconnected: () => void;
  reconnectError: () => void;
}

interface HaConnectionState {
  connection: Connection | null;
  entities: HassEntities;
  status: HaConnectionStatus;
  lastError: string | null;
  unsubscribeEntities: (() => void) | null;
  emitter: Emitter<HaConnectionEvents>;
  wakeIntervalId: ReturnType<typeof setInterval> | null;
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
      emitter: mitt<HaConnectionEvents>(),
      wakeIntervalId: null,
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
 * Attempt connection with exponential backoff retry logic.
 * Used for wake-from-sleep reconnection to handle transient network issues.
 *
 * @param url - Normalized Home Assistant server URL
 * @param token - Long-lived access token
 */
async function connectWithRetry(url: string, token: string): Promise<void> {
  await pRetry(
    async (attemptNumber) => {
      log(`[Wake] Connection attempt ${attemptNumber}/${WAKE_RETRY_DELAYS.length + 1}...`);
      await connect(url, token);
    },
    {
      retries: WAKE_RETRY_DELAYS.length,
      // Custom retry delays matching the original WAKE_RETRY_DELAYS
      minTimeout: WAKE_RETRY_DELAYS[0],
      maxTimeout: WAKE_RETRY_DELAYS[WAKE_RETRY_DELAYS.length - 1],
      factor: 2,
      onFailedAttempt: (error) => {
        log(`[Wake] Attempt ${error.attemptNumber} failed, ${error.retriesLeft} retries left`);
      },
    }
  ).catch((err) => {
    logError("[Wake] All retry attempts failed");
    throw err;
  });
}

/**
 * Close the existing connection without clearing wake detection.
 * Used during wake reconnection to preserve the retry mechanism.
 */
function closeConnection(): void {
  const state = getState();
  log("Closing connection");
  if (state.unsubscribeEntities) {
    state.unsubscribeEntities();
    state.unsubscribeEntities = null;
  }
  removeConnectionListeners();
  if (state.connection) {
    state.connection.close();
    state.connection = null;
  }
  state.entities = {};
}

/**
 * Detect when the system wakes from sleep using timer gap detection.
 * When the computer sleeps, JS timers pause. On wake, we detect the gap
 * and trigger a reconnection to restore the WebSocket connection.
 */
function startWakeDetection(): void {
  const state = getState();
  // Only start once
  if (state.wakeIntervalId) return;

  const wakeThresholdMs = TIMING.WAKE_CHECK_INTERVAL_MS + TIMING.WAKE_THRESHOLD_GRACE_MS;
  let lastTime = Date.now();

  state.wakeIntervalId = setInterval(() => {
    const now = Date.now();
    const elapsed = now - lastTime;

    if (elapsed > wakeThresholdMs && state.credentials) {
      log(`[Wake] Detected wake from sleep (gap: ${Math.round(elapsed / 1000)}s), reconnecting...`);
      const { url, token } = state.credentials;
      // Close connection without clearing wake detection interval
      closeConnection();
      setStatus("connecting");
      // Use retry logic for wake reconnection
      connectWithRetry(url, token).catch(() => {
        // Error already logged in connectWithRetry
      });
    }

    lastTime = now;
  }, TIMING.WAKE_CHECK_INTERVAL_MS);
}

/**
 * Remove connection event listeners stored in state.
 */
function removeConnectionListeners(): void {
  const state = getState();
  if (state.connectionListeners && state.connection) {
    state.connection.removeEventListener("ready", state.connectionListeners.ready);
    state.connection.removeEventListener("disconnected", state.connectionListeners.disconnected);
    state.connection.removeEventListener("reconnect-error", state.connectionListeners.reconnectError);
  }
  state.connectionListeners = null;
}

/**
 * Set up connection event listeners for ready, disconnected, and reconnect-error events.
 *
 * @param connection - Active Home Assistant WebSocket connection
 */
function setupConnectionListeners(connection: Connection): void {
  const state = getState();
  const listeners: ConnectionListeners = {
    ready: () => {
      log("Connection ready");
      setStatus("connected");
    },
    disconnected: () => {
      log("Connection disconnected");
      setStatus("disconnected", "Connection lost");
    },
    reconnectError: () => {
      logError("Reconnection failed");
      setStatus("disconnected", "Reconnection failed");
    },
  };

  connection.addEventListener("ready", listeners.ready);
  connection.addEventListener("disconnected", listeners.disconnected);
  connection.addEventListener("reconnect-error", listeners.reconnectError);
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
    state.entities = newEntities;
    notifyStateUpdate();
  });
}

/**
 * Establish a WebSocket connection to Home Assistant.
 *
 * Normalizes the URL, authenticates with the provided token, sets up
 * entity subscriptions, and starts wake detection for automatic reconnection.
 *
 * @param url - Home Assistant server URL (protocol optional, defaults to https)
 * @param token - Long-lived access token from HA Settings > Security
 * @throws Re-throws connection errors after updating status state
 */
export async function connect(url: string, token: string): Promise<void> {
  const state = getState();
  // Disconnect existing connection first
  disconnect();

  setStatus("connecting");
  const normalizedUrl = normalizeUrl(url.trim(), { defaultProtocol: "https" });
  log("Connecting to", normalizedUrl);

  // Store credentials early so reconnect is available if connection fails
  state.credentials = { url: normalizedUrl, token };

  try {
    // Create auth with long-lived token
    const auth = createLongLivedTokenAuth(normalizedUrl, token);

    // Create connection with timeout to avoid hanging when server is unreachable
    state.connection = await Promise.race([
      createConnection({ auth }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timed out")), TIMING.CONNECTION_TIMEOUT_MS)
      ),
    ]);
    log("Connected, HA version:", state.connection.haVersion);

    setupConnectionListeners(state.connection);
    setupEntitySubscription(state.connection);

    // Start wake detection for automatic reconnection after sleep
    startWakeDetection();

    setStatus("connected");
  } catch (err) {
    const errCode = hasErrorCode(err) ? err.code : undefined;
    const errMsg = normalizeConnectionError(errCode ?? err);
    logError("Connection failed:", errMsg);

    if (errCode === ERR_INVALID_AUTH) {
      state.credentials = null;
      setStatus("auth_invalid", errMsg);
    } else {
      setStatus("disconnected", errMsg);
    }
    throw err;
  }
}

/**
 * Close the Home Assistant connection and clean up resources.
 *
 * Stops wake detection, unsubscribes from entities, closes WebSocket,
 * and clears cached entity state.
 */
export function disconnect(): void {
  const state = getState();
  log("Disconnecting");
  if (state.wakeIntervalId) {
    clearInterval(state.wakeIntervalId);
    state.wakeIntervalId = null;
  }
  if (state.unsubscribeEntities) {
    state.unsubscribeEntities();
    state.unsubscribeEntities = null;
  }
  removeConnectionListeners();
  if (state.connection) {
    state.connection.close();
    state.connection = null;
  }
  state.entities = {};
  state.credentials = null;
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
 * Retry connection using stored credentials.
 * Does nothing if no credentials are stored.
 */
export async function retryConnection(): Promise<void> {
  const state = getState();
  if (!state.credentials) return;

  const { url, token } = state.credentials;
  log("Retrying connection to", url);
  await connect(url, token);
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

/**
 * System tray service - main orchestrator.
 * Manages the menu bar display and dropdown menu for sensor data.
 * @module services/tray/trayService
 */

import { TrayIcon } from "@tauri-apps/api/tray";
import { buildMenu } from "./menuBuilder";
import { formatSensor } from "./sensorFormatter";
import { buildMenuBarTitle } from "./titleBuilder";
import { createInitialState, MAX_CONSECUTIVE_ERRORS, type TrayState } from "./trayState";
import { hasCredentials } from "@/services/haConnection";
import { isUpdateAvailable } from "@/services/updater";
import { formatConnectionStatus, createLogger, type Settings, type HaEntityState, type HaConnectionStatus } from "@/shared";

const logger = createLogger("[Tray]");

const TRAY_ID = "peek-icon";

// Module state
const state: TrayState = createInitialState();

/**
 * Queue current menu resources for deferred cleanup.
 * Resources are closed at the start of the next render, not immediately,
 * to avoid destroying Rust resources while the tray dropdown is still displayed.
 */
function queueMenuCleanup(): void {
  state.pendingCleanup.push(...state.currentMenuItems);
  if (state.currentMenu) {
    state.pendingCleanup.push(state.currentMenu);
  }
  state.currentMenu = null;
  state.currentMenuItems = [];
}

/**
 * Close all resources queued for deferred cleanup.
 */
async function flushPendingCleanup(): Promise<void> {
  if (state.pendingCleanup.length === 0) return;
  const toClose = state.pendingCleanup;
  state.pendingCleanup = [];
  await Promise.all(toClose.map((r) => r.close().catch(() => {})));
}

/**
 * Compute a fingerprint of all data that affects the dropdown menu content.
 * If unchanged between renders, we skip the setMenu() call entirely,
 * which prevents macOS from dismissing the open dropdown.
 *
 * @param states - Current entity states from Home Assistant
 * @param settings - Current app settings
 */
function computeMenuFingerprint(
  states: Map<string, HaEntityState>,
  settings: Settings,
): string {
  // Status header text
  const showReconnect =
    state.status === "disconnected" && hasCredentials() && !state.reconnectInProgress;
  const statusText = showReconnect
    ? "reconnect"
    : formatConnectionStatus(state.status, state.error);

  // Dropdown sensor display values
  const sensorTexts = settings.dropdownSensors.map((id) => {
    const entity = states.get(id);
    const customName = settings.dropdownSensorNames?.[id];
    return formatSensor(id, entity, customName, settings.dropdownFormat, {});
  });

  return [
    statusText,
    settings.haUrl ? "1" : "0",
    isUpdateAvailable() ? "update" : "",
    ...sensorTexts,
  ].join("\n");
}

/**
 * Initialize the tray. The icon is created by tauri.conf.json's trayIcon config,
 * so we grab the existing instance by ID and set up the initial menu from JS.
 */
export async function initTray(): Promise<void> {
  state.tray = await TrayIcon.getById(TRAY_ID);
  if (!state.tray) return;

  const { menu, items } = await buildMenu(new Map(), null, state);
  await state.tray.setMenu(menu);
  state.currentMenu = menu;
  state.currentMenuItems = items;
  await state.tray.setShowMenuOnLeftClick(true);
}

/**
 * Update the connection state and re-render the tray.
 *
 * @param status - Current connection status
 * @param states - Current entity states
 * @param settings - Current app settings
 * @param error - Optional error message for display
 */
export function setTrayConnectedState(
  status: HaConnectionStatus,
  states: Map<string, HaEntityState>,
  settings: Settings,
  error?: string | null
): void {
  state.status = status;
  if (error !== undefined) state.error = error;
  if (status === "connected") state.error = null;
  renderTray(states, settings);
}

/**
 * Update the menu bar title immediately (no debounce).
 * This is cheap and ensures values appear instantly.
 * Serializes updates to prevent racing async setTitle calls from causing flicker.
 *
 * @param states - Current entity states from Home Assistant
 * @param settings - Current app settings
 */
function updateTitleImmediate(
  states: Map<string, HaEntityState>,
  settings: Settings
): void {
  if (!state.tray) return;
  const titleToSet = buildMenuBarTitle(states, settings, state.status);

  // Skip if title hasn't changed
  if (titleToSet === state.latestTitle) return;
  state.latestTitle = titleToSet;

  // Chain title updates to ensure they execute in order
  state.pendingTitleUpdate = state.pendingTitleUpdate
    .then(() => {
      // Only set if this is still the latest title
      if (titleToSet === state.latestTitle) {
        return state.tray?.setTitle(titleToSet);
      }
    })
    .catch((err) => logger.error("Title update failed:", err));
}

/**
 * Update icon visibility immediately (no debounce).
 * This ensures icon appears/disappears instantly when sensors are added/removed.
 *
 * @param settings - Current app settings
 */
function updateIconImmediate(settings: Settings): void {
  if (!state.tray) return;

  const hasMenuBarSensors = settings.menuBarSensors.length > 0;
  const shouldHideIcon = hasMenuBarSensors;

  // Skip if icon state hasn't changed
  if (shouldHideIcon === state.iconHidden) return;
  state.iconHidden = shouldHideIcon;

  // Chain icon updates to ensure they execute in order
  state.pendingTitleUpdate = state.pendingTitleUpdate
    .then(() => {
      if (shouldHideIcon) {
        return state.tray?.setIcon(null);
      } else {
        return state.tray?.setIcon("icons/tray.png");
      }
    })
    .catch((err) => logger.error("Icon update failed:", err));
}

/**
 * Render sensor data into the tray menu.
 * Title and icon update immediately; menu rebuilding uses coalescing queue.
 *
 * @param states - Current entity states from Home Assistant
 * @param settings - Current app settings
 */
export function renderTray(
  states: Map<string, HaEntityState>,
  settings: Settings
): void {
  // Store latest inputs to prevent stale data from closure capture
  state.latestRenderInputs = { states, settings };

  // Update menu bar title and icon immediately (cheap, visible to user)
  updateTitleImmediate(states, settings);
  updateIconImmediate(settings);

  // Rebuild menu (coalescing queue handles rapid updates)
  doRenderTray().catch((err) => logger.error("Tray render failed:", err));
}

/**
 * Internal: Execute the actual tray render with coalescing queue pattern.
 */
async function doRenderTray(): Promise<void> {
  if (!state.tray || !state.latestRenderInputs) return;

  // If a rebuild is in progress, mark that we need another render (coalescing queue)
  if (state.menuRebuildInProgress) {
    state.renderRequested = true;
    return;
  }

  state.menuRebuildInProgress = true;
  state.renderRequested = false;

  try {
    const { states, settings } = state.latestRenderInputs;

    // Skip rebuild if menu content hasn't changed (avoids setMenu() dismissing open dropdown)
    const fingerprint = computeMenuFingerprint(states, settings);
    if (fingerprint === state.latestMenuFingerprint) return;
    state.latestMenuFingerprint = fingerprint;

    // Close resources from previous render (deferred to avoid destroying while dropdown is open)
    await flushPendingCleanup();

    const { menu, items } = await buildMenu(states, settings, state);
    await state.tray.setMenu(menu);

    // Queue old resources for cleanup on next render, then track the new ones
    queueMenuCleanup();
    state.currentMenu = menu;
    state.currentMenuItems = items;

    // Reset error counter on success
    state.consecutiveErrors = 0;
  } catch (err) {
    logger.error("Tray operation failed:", err);
    state.consecutiveErrors++;

    if (state.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      logger.error(`Disabling tray after ${MAX_CONSECUTIVE_ERRORS} consecutive errors`);
      queueMenuCleanup();
      await flushPendingCleanup();
      state.tray = null;
    }
  } finally {
    state.menuRebuildInProgress = false;

    // If another render was requested while we were building, schedule one more
    if (state.renderRequested && state.latestRenderInputs && state.tray) {
      state.renderRequested = false;
      setTimeout(
        () => doRenderTray().catch((err) => logger.error("Tray render failed:", err)),
        0
      );
    }
  }
}

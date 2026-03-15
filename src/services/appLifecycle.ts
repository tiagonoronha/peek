import { getCurrentWindow } from "@tauri-apps/api/window";
import { enable as enableAutostart, disable as disableAutostart } from "@tauri-apps/plugin-autostart";
import { loadSettings } from "./configStore";
import { connect, entitiesToMap, getStates, onStateUpdate, onStatusChange } from "./haConnection";
import { initTray, renderTray, setTrayConnectedState } from "./tray";
import { onUpdateFound, startPeriodicChecks } from "./updater";
import type { HassEntities } from "home-assistant-js-websocket";
import { createLogger, getTrackedSensorIds, type Settings } from "@/shared";

const logger = createLogger("[Lifecycle]");

let currentSettings: Settings | null = null;
let appInitialized = false;
let unsubscribeStatus: (() => void) | null = null;
let unsubscribeStates: (() => void) | null = null;
/** Cached tracked sensor IDs — recomputed only when settings change */
let trackedIds: string[] = [];

function updateTrackedIds(settings: Settings): void {
  trackedIds = getTrackedSensorIds(settings);
}

/**
 * Initialize the application: tray, window handling, and HA connection.
 * Safe to call multiple times (guards against HMR re-initialization).
 */
export async function initializeApp(): Promise<void> {
  if (appInitialized) return;
  appInitialized = true;

  // Set up the system tray
  await initTray();

  // Set up close event handler - hide instead of close
  const mainWindow = getCurrentWindow();
  await mainWindow.onCloseRequested(async (event) => {
    event.preventDefault();
    await mainWindow.hide();
  });

  // Load settings and attempt HA connection
  currentSettings = await loadSettings();
  updateTrackedIds(currentSettings);

  // Clean up previous subscriptions (e.g. HMR re-init)
  unsubscribeStatus?.();
  unsubscribeStates?.();

  // Wire connection status changes to tray renderer
  unsubscribeStatus = onStatusChange((status, error) => {
    if (currentSettings) {
      setTrayConnectedState(status, getStates(trackedIds), currentSettings, error);
    }
  });

  // Wire state updates to tray renderer
  unsubscribeStates = onStateUpdate((entities: HassEntities) => {
    if (currentSettings) {
      renderTray(entitiesToMap(entities, trackedIds), currentSettings);
    }
  });

  // Rebuild tray when a background update check finds a new version
  onUpdateFound(() => {
    if (currentSettings) {
      renderTray(getStates(trackedIds), currentSettings);
    }
  });

  // Connect if URL and token are available, otherwise show preferences
  if (currentSettings.haUrl && currentSettings.haToken) {
    connect(currentSettings.haUrl, currentSettings.haToken).catch((err) => {
      logger.error("Initial connection failed:", err);
    });
  } else {
    await mainWindow.show();
    await mainWindow.setFocus();
  }

  // Start periodic update checks (skips if checked recently)
  startPeriodicChecks(currentSettings.lastUpdateCheck);
}

/**
 * Called from the settings UI after saving to refresh tray and reconnect if needed.
 */
export async function onSettingsChanged(): Promise<void> {
  const previousSettings = currentSettings;
  currentSettings = await loadSettings();
  updateTrackedIds(currentSettings);

  // Re-render tray with new settings (filtered to tracked sensors)
  renderTray(getStates(trackedIds), currentSettings);

  // Only reconnect if connection settings (URL or token) changed
  const connectionChanged =
    previousSettings?.haUrl !== currentSettings.haUrl ||
    previousSettings?.haToken !== currentSettings.haToken;

  if (connectionChanged && currentSettings.haUrl && currentSettings.haToken) {
    connect(currentSettings.haUrl, currentSettings.haToken).catch((err) => {
      logger.error("Reconnection failed:", err);
    });
  }

  // Update autostart setting if it changed
  const autostartChanged = previousSettings?.autoStartOnLogin !== currentSettings.autoStartOnLogin;
  if (autostartChanged) {
    try {
      if (currentSettings.autoStartOnLogin) {
        await enableAutostart();
      } else {
        await disableAutostart();
      }
    } catch (error) {
      logger.error("Failed to update autostart setting:", error);
    }
  }
}

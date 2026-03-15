/**
 * Tray menu construction utilities.
 * @module services/tray/menuBuilder
 */

import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { exit } from "@tauri-apps/plugin-process";
import { formatSensor } from "./sensorFormatter";
import type { TrayState } from "./trayState";
import type { Resource } from "@tauri-apps/api/core";
import { hasCredentials, retryConnection } from "@/services/haConnection";
import { downloadAndInstall, getUpdateVersion, isUpdateAvailable } from "@/services/updater";
import { formatConnectionStatus, type HaEntityState, type Settings } from "@/shared";

/** Result from buildMenu containing the menu and all items for resource tracking */
interface BuildMenuResult {
  menu: Menu;
  items: Resource[];
}

const mainWindow = getCurrentWindow();

/**
 * Build status header items for the menu.
 * Returns a reconnect button when disconnected with credentials, otherwise a status line.
 *
 * @param state - Current tray state for status and reconnect handling
 */
async function buildStatusHeader(state: TrayState): Promise<MenuItem[]> {
  const items: MenuItem[] = [];

  // Show reconnect button when disconnected but credentials exist (and not already reconnecting)
  if (
    state.status === "disconnected" &&
    hasCredentials() &&
    !state.reconnectInProgress
  ) {
    items.push(
      await MenuItem.new({
        id: "reconnect",
        text: "Reconnect to Home Assistant",
        action: async () => {
          if (state.reconnectInProgress) return;
          state.reconnectInProgress = true;
          try {
            await retryConnection();
          } finally {
            state.reconnectInProgress = false;
          }
        },
      })
    );
  } else {
    items.push(
      await MenuItem.new({
        id: "conn-status",
        text: formatConnectionStatus(state.status, state.error),
        enabled: false,
      })
    );
  }

  return items;
}

/**
 * Build sensor menu items.
 *
 * @param states - Current entity states from Home Assistant
 * @param settings - Current app settings for sensor configuration
 */
async function buildSensorItems(
  states: Map<string, HaEntityState>,
  settings: Settings
): Promise<MenuItem[]> {
  if (settings.dropdownSensors.length === 0) {
    return [];
  }

  const items: MenuItem[] = [];
  for (let i = 0; i < settings.dropdownSensors.length; i++) {
    const entityId = settings.dropdownSensors[i];
    const entity = states.get(entityId);
    const customName = settings.dropdownSensorNames?.[entityId];
    const text = formatSensor(
      entityId,
      entity,
      customName,
      settings.dropdownFormat,
      {}
    );

    const menuItem = await MenuItem.new({
      id: `sensor-${i}`,
      text,
      enabled: false,
    });
    items.push(menuItem);
  }
  return items;
}

/**
 * Build action menu items (Open HA, Settings, Quit).
 *
 * @param settings - Current app settings (null for initial state)
 */
async function buildActionItems(
  settings: Settings | null
): Promise<MenuItem[]> {
  const items: MenuItem[] = [];

  if (settings?.haUrl) {
    items.push(
      await MenuItem.new({
        id: "open-ha",
        text: "Open Home Assistant",
        action: async () => {
          await openUrl(settings.haUrl);
        },
      })
    );
  }

  items.push(
    await MenuItem.new({
      id: "open-settings",
      text: "Preferences",
      accelerator: "CmdOrCtrl+,",
      action: async () => {
        await mainWindow.show();
        await mainWindow.setFocus();
      },
    })
  );

  if (isUpdateAvailable()) {
    const version = getUpdateVersion();
    items.push(
      await MenuItem.new({
        id: "update-available",
        text: version ? `Update to version ${version}` : "Update available",
        action: async () => {
          await downloadAndInstall();
        },
      })
    );
  }

  items.push(
    await MenuItem.new({
      id: "quit",
      text: "Quit",
      accelerator: "CmdOrCtrl+Q",
      action: async () => {
        await exit(0);
      },
    })
  );

  return items;
}

/**
 * Build the complete tray menu.
 * Used both for initial static menu and dynamic sensor updates.
 *
 * @param states - Current entity states (empty Map for initial state)
 * @param settings - Current app settings (null for initial state)
 * @param state - Current tray state (for status and reconnect handling)
 */
export async function buildMenu(
  states: Map<string, HaEntityState>,
  settings: Settings | null,
  state: TrayState
): Promise<BuildMenuResult> {
  const items: (MenuItem | PredefinedMenuItem)[] = [];

  items.push(...(await buildStatusHeader(state)));

  if (settings) {
    const sensorItems = await buildSensorItems(states, settings);
    if (sensorItems.length > 0) {
      items.push(await PredefinedMenuItem.new({ item: "Separator" }));
      items.push(...sensorItems);
    }
  }

  items.push(await PredefinedMenuItem.new({ item: "Separator" }));
  items.push(...(await buildActionItems(settings)));

  const menu = await Menu.new({ items });
  return { menu, items };
}

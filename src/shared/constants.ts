/**
 * Shared constants for the Home Assistant Tray application.
 * @module shared/constants
 */

import type { Settings } from './types';

/**
 * Timing constants for connection management.
 */
export const TIMING = {
  /** Interval of the connection watchdog (heartbeat ping + wake-from-sleep detection) */
  WAKE_CHECK_INTERVAL_MS: 15000,
  /** Grace period added to the watchdog interval to detect sleep gaps */
  WAKE_THRESHOLD_GRACE_MS: 5000,
  /** Timeout for WebSocket connection attempts */
  CONNECTION_TIMEOUT_MS: 10000,
  /** Send a heartbeat ping when no message has been received for this long */
  HEARTBEAT_IDLE_MS: 30000,
  /** Treat the socket as dead when a heartbeat ping isn't answered in time */
  HEARTBEAT_TIMEOUT_MS: 10000,
} as const;

/**
 * UI constraints for display formatting.
 */
export const UI_LIMITS = {
  /** Maximum length of menu bar title to prevent overflow */
  MAX_MENU_BAR_LENGTH: 50,
} as const;

/**
 * Backoff delays in milliseconds between automatic reconnection attempts.
 * The last value is reused indefinitely, so reconnection never gives up.
 */
export const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000, 60000] as const;

/**
 * Default application settings for new installations.
 */
export const DEFAULT_SETTINGS: Settings = {
  haUrl: '',
  haToken: '',
  menuBarSensors: [],
  dropdownSensors: [],
  menuBarSensorNames: {},
  dropdownSensorNames: {},
  menuBarFormat: '{name} {value}',
  dropdownFormat: '{name}: {value}',
  menuBarSeparator: '•',
  menuBarPaginationEnabled: false,
  menuBarSensorsPerPage: 3,
  menuBarCycleShortcut: 'CmdOrCtrl+Alt+P',
  menuBarAutoReturnEnabled: false,
  menuBarAutoReturnMinutes: 5,
  autoStartOnLogin: false,
  theme: 'system',
  lastUpdateCheck: '',
};

/**
 * Available separator options for menu bar sensors.
 */
/**
 * GitHub repository URL for the project.
 */
export const GITHUB_URL = "https://github.com/tiagonoronha/peek";

/**
 * Available separator options for menu bar sensors.
 */
export const SEPARATOR_OPTIONS = [
  { value: "•", label: "Bullet ( • )" },
  { value: "·", label: "Middle dot ( · )" },
  { value: "│", label: "Vertical line ( │ )" },
  { value: "-", label: "Dash ( - )" },
  { value: "◆", label: "Diamond ( ◆ )" },
  { value: "/", label: "Slash ( / )" },
  { value: "", label: "None (space only)" },
] as const;


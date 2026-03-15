/**
 * Shared constants for the Home Assistant Tray application.
 * @module shared/constants
 */

import type { Settings } from './types';

/**
 * Timing constants for connection management.
 */
export const TIMING = {
  /** Interval for wake-from-sleep detection */
  WAKE_CHECK_INTERVAL_MS: 15000,
  /** Grace period added to wake check interval to detect sleep gaps */
  WAKE_THRESHOLD_GRACE_MS: 5000,
} as const;

/**
 * UI constraints for display formatting.
 */
export const UI_LIMITS = {
  /** Maximum length of menu bar title to prevent overflow */
  MAX_MENU_BAR_LENGTH: 50,
} as const;

/**
 * Retry delays in milliseconds for wake-from-sleep reconnection.
 * Uses exponential backoff: 1s, 2s, 4s, 8s, 15s.
 */
export const WAKE_RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000] as const;

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
  autoStartOnLogin: false,
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


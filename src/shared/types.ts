/**
 * Shared types for the Home Assistant Tray application.
 * @module shared/types
 */

// --- Settings Types ---

/**
 * Application settings persisted to config.json.
 */
export interface Settings {
  /** Home Assistant server URL (e.g., "https://homeassistant.local:8123") */
  haUrl: string;
  /** Long-lived access token for Home Assistant authentication */
  haToken: string;
  /** Entity IDs displayed in the system menu bar (left to right) */
  menuBarSensors: string[];
  /** Entity IDs shown in the tray dropdown menu (top to bottom) */
  dropdownSensors: string[];
  /** Custom display names for menu bar sensors by entity ID */
  menuBarSensorNames: Record<string, string>;
  /** Custom display names for dropdown sensors by entity ID */
  dropdownSensorNames: Record<string, string>;
  /** Format template for menu bar display (supports {name} and {value}) */
  menuBarFormat: string;
  /** Format template for dropdown menu display (supports {name} and {value}) */
  dropdownFormat: string;
  /** Separator between sensors in the menu bar (empty string = space) */
  menuBarSeparator: string;
  /** Whether to automatically start the app when the user logs in */
  autoStartOnLogin: boolean;
  /** ISO timestamp of the last successful update check */
  lastUpdateCheck: string;
}

// --- Home Assistant WebSocket types ---

/**
 * Single entity state from Home Assistant.
 * Represents a device, sensor, or service with its current value and metadata.
 */
export interface HaEntityState {
  /** Unique identifier (e.g., "sensor.temperature", "light.living_room") */
  entity_id: string;
  /** Current state value as string (e.g., "21.5", "on", "unavailable") */
  state: string;
  /** Entity attributes including friendly_name, unit_of_measurement, etc. */
  attributes: Record<string, unknown>;
  /** ISO timestamp when state last changed */
  last_changed: string;
  /** ISO timestamp when entity was last updated (even if state unchanged) */
  last_updated: string;
}

/**
 * WebSocket connection status to Home Assistant.
 * - `disconnected`: No active connection
 * - `connecting`: Connection attempt in progress
 * - `connected`: Successfully connected and receiving updates
 * - `auth_invalid`: Connection failed due to invalid token
 */
export type HaConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'auth_invalid';


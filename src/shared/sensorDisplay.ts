/**
 * Utilities for extracting and formatting sensor display information.
 * @module shared/sensorDisplay
 */

import type { HaEntityState } from "./types";

/**
 * Display information extracted from a sensor entity.
 */
export interface SensorDisplayInfo {
  /** Display name (custom name or friendly name or entity ID) */
  displayName: string;
  /** Original name from Home Assistant (friendly name or entity ID) */
  originalName: string;
  /** Custom name if set, empty string otherwise */
  customName: string;
  /** Formatted sensor value with unit (or "—" if unavailable) */
  sensorValue: string;
  /** Unit of measurement if available */
  unit: string | undefined;
}

/**
 * Extract display information for a sensor entity.
 *
 * @param entityId - The entity ID (e.g., "sensor.temperature")
 * @param haState - The Home Assistant entity state (may be undefined)
 * @param sensorNames - Record of custom names by entity ID
 * @returns Display information for the sensor
 */
export function getSensorDisplayInfo(
  entityId: string,
  haState: HaEntityState | undefined,
  sensorNames: Record<string, string>
): SensorDisplayInfo {
  const haFriendlyName = haState?.attributes.friendly_name as string | undefined;
  const originalName = haFriendlyName || entityId;
  const customName = sensorNames[entityId] || "";
  const unit = haState?.attributes.unit_of_measurement as string | undefined;
  const sensorValue = haState
    ? `${haState.state}${unit ? ` ${unit}` : ""}`
    : "—";

  return {
    displayName: customName || originalName,
    originalName,
    customName,
    sensorValue,
    unit,
  };
}

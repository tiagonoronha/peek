/**
 * Sensor formatting utilities for tray display.
 * Pure functions for formatting sensor data.
 * @module services/tray/sensorFormatter
 */

import type { HaEntityState } from "@/shared";

/**
 * Options for formatting a sensor.
 */
export interface FormatSensorOptions {
  /** Return empty string instead of showing unavailable state (for menu bar) */
  hideUnavailable?: boolean;
  /** Use short entity ID (after the dot) as fallback instead of full ID */
  useShortId?: boolean;
}

/**
 * Apply a format template to sensor data.
 *
 * @param format - Template string with {name} and {value} placeholders
 * @param name - Sensor display name
 * @param value - Sensor value (including unit if applicable)
 * @returns Formatted string with placeholders replaced
 *
 * @example
 * applyFormat("{name}: {value}", "Temperature", "72°F") // "Temperature: 72°F"
 * applyFormat("{value}", "Temperature", "72°F") // "72°F"
 */
export function applyFormat(format: string, name: string, value: string): string {
  return format.replaceAll("{name}", name).replaceAll("{value}", value);
}

/**
 * Format a sensor for display.
 * Used for both dropdown menu items and menu bar title.
 *
 * @param entityId - Entity ID (e.g., "sensor.temperature")
 * @param entity - Entity state from Home Assistant (undefined if not found)
 * @param customName - Custom display name from settings (optional)
 * @param format - Format template (optional, defaults to "{name}: {value}")
 * @param options - Formatting options
 * @returns Formatted sensor string
 *
 * @example
 * formatSensor("sensor.temp", entity, undefined, "{value}") // "72°F"
 * formatSensor("sensor.temp", undefined, "Temp") // "Temp: N/A"
 */
export function formatSensor(
  entityId: string,
  entity: HaEntityState | undefined,
  customName?: string,
  format?: string,
  options: FormatSensorOptions = {}
): string {
  const { hideUnavailable = false, useShortId = false } = options;

  const friendlyName = entity?.attributes?.friendly_name as string | undefined;
  const fallbackId = useShortId ? entityId.split(".")[1] : entityId;
  const label = customName ?? friendlyName ?? fallbackId;

  if (!entity) {
    return hideUnavailable
      ? ""
      : format
        ? applyFormat(format, label, "N/A")
        : `${label}: N/A`;
  }

  const sensorState = entity.state;
  if (sensorState === "unavailable" || sensorState === "unknown") {
    return hideUnavailable
      ? ""
      : format
        ? applyFormat(format, label, sensorState)
        : `${label}: ${sensorState}`;
  }

  const unit = entity.attributes?.unit_of_measurement
    ? ` ${entity.attributes.unit_of_measurement}`
    : "";

  const value = `${sensorState}${unit}`;
  return format ? applyFormat(format, label, value) : `${label}: ${value}`;
}


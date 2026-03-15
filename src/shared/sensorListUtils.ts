/**
 * Utility functions for sensor list manipulation.
 * Used by SensorsTab for both menu bar and dropdown sensor lists.
 */

import type { Settings } from "./types";

/**
 * Get the combined list of tracked sensor entity IDs (menu bar + dropdown).
 *
 * @param settings - Current app settings
 */
export function getTrackedSensorIds(settings: Settings): string[] {
  return [...settings.menuBarSensors, ...settings.dropdownSensors];
}

/**
 * Add a sensor to the list if not already present.
 *
 * @param list - Current list of entity IDs
 * @param entityId - Entity ID to add
 * @returns New list with entity appended, or original if already present
 */
export function addSensor(list: string[], entityId: string): string[] {
  if (list.includes(entityId)) return list;
  return [...list, entityId];
}

/**
 * Remove a sensor from the list.
 *
 * @param list - Current list of entity IDs
 * @param entityId - Entity ID to remove
 * @returns New list with entity removed
 */
export function removeSensor(list: string[], entityId: string): string[] {
  return list.filter((id) => id !== entityId);
}

/**
 * Clean up sensor name from the names record.
 *
 * @param names - Current sensor names record
 * @param entityId - Entity ID being removed
 * @returns New names record with entry removed
 */
export function cleanupSensorName(
  names: Record<string, string>,
  entityId: string,
): Record<string, string> {
  if (!(entityId in names)) return names;
  const newNames = { ...names };
  delete newNames[entityId];
  return newNames;
}

/**
 * Move a sensor from one list to another at a specific index.
 *
 * @param sourceList - List to remove the sensor from
 * @param targetList - List to add the sensor to
 * @param entityId - Entity ID to move
 * @param targetIndex - Index in target list to insert at (defaults to end)
 * @returns Object with new source and target lists
 */
export function moveSensorBetweenLists(
  sourceList: string[],
  targetList: string[],
  entityId: string,
  targetIndex?: number
): { newSourceList: string[]; newTargetList: string[] } {
  const newSourceList = sourceList.filter((id) => id !== entityId);
  const insertIndex = targetIndex ?? targetList.length;
  const newTargetList = [
    ...targetList.slice(0, insertIndex),
    entityId,
    ...targetList.slice(insertIndex),
  ];
  return { newSourceList, newTargetList };
}

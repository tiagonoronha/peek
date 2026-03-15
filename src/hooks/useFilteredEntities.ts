import { useMemo } from "react";
import type { HaEntityState } from "@/shared";

/**
 * Entity option for the sensor picker dropdown.
 */
export interface EntityOption {
  /** Entity ID (e.g., "sensor.temperature") */
  entityId: string;
  /** Friendly name from entity attributes, or null if not set */
  friendlyName: string | null;
  /** Current state value with unit, or null if unavailable */
  currentValue: string | null;
}

/**
 * Filter and search Home Assistant entities for the sensor picker.
 *
 * Memoizes filtering based on states, exclusion list, and search query.
 * Results are sorted alphabetically by entity ID.
 *
 * @param states - Current HA entity states
 * @param excludeEntities - Entity IDs to exclude (already selected)
 * @param query - Search string to filter by entity ID or friendly name
 * @returns Filtered array of entity options
 */
export function useFilteredEntities(
  states: Map<string, HaEntityState>,
  excludeEntities: string[],
  query: string
): EntityOption[] {
  const allEntities = useMemo<EntityOption[]>(() => {
    const result: EntityOption[] = [];
    for (const [entityId, state] of states) {
      const unit = (state.attributes.unit_of_measurement as string) ?? "";
      const value = state.state;
      const displayValue = unit ? `${value} ${unit}` : value;
      result.push({
        entityId,
        friendlyName: (state.attributes.friendly_name as string) ?? null,
        currentValue: displayValue,
      });
    }
    result.sort((a, b) => a.entityId.localeCompare(b.entityId));
    return result;
  }, [states]);

  const excludeSet = useMemo(() => new Set(excludeEntities), [excludeEntities]);

  return useMemo(() => {
    const available = allEntities.filter((e) => !excludeSet.has(e.entityId));
    if (!query.trim()) return available;
    const q = query.trim().toLowerCase();
    return available.filter(
      (e) =>
        e.entityId.toLowerCase().includes(q) ||
        (e.friendlyName && e.friendlyName.toLowerCase().includes(q))
    );
  }, [allEntities, excludeSet, query]);
}

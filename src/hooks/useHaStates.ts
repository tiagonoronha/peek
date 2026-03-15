import { useEffect, useState } from "react";
import type { HaEntityState, HaConnectionStatus } from "@/shared";
import { entitiesToMap, getStates, getStatus, getLastError, onStateUpdate, onStatusChange } from "@/services/haConnection";

/**
 * Hook that subscribes to Home Assistant state updates.
 * Returns [states, version] where version increments on each change,
 * useful for useMemo dependencies.
 */
export function useHaStates(): [Map<string, HaEntityState>, number] {
  const [version, setVersion] = useState(0);
  const [states, setStates] = useState<Map<string, HaEntityState>>(() => getStates());

  useEffect(() => {
    const unsubscribe = onStateUpdate((entities) => {
      setStates(entitiesToMap(entities));
      setVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  return [states, version];
}

/**
 * Hook that subscribes to connection status changes.
 * Reactive - no polling needed.
 */
export function useHaConnectionStatus(): {
  status: HaConnectionStatus;
  error: string | null;
} {
  const [status, setStatus] = useState<HaConnectionStatus>(() => getStatus());
  const [error, setError] = useState<string | null>(() => getLastError());

  useEffect(() => {
    const unsubscribe = onStatusChange((newStatus, err) => {
      setStatus(newStatus);
      setError(err ?? null);
    });

    return unsubscribe;
  }, []);

  return { status, error };
}

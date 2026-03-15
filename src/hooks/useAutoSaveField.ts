/**
 * Hook for auto-saving individual settings fields with debouncing.
 * @module hooks/useAutoSaveField
 */

import { useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useSettings } from "./useSettings";
import type { Settings } from "@/shared";
import { toast } from "@/components/ui/Toaster";
import { onSettingsChanged } from "@/services/appLifecycle";
import { saveSettings } from "@/services/configStore";

/** Debounce delay for showing "Settings saved" toast (ms) */
const TOAST_DEBOUNCE_MS = 1000;

/** Debounced toast function - shared across all hook instances */
const showSavedToastDebounced = (() => {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      toast.success("Settings saved");
      timerId = null;
    }, TOAST_DEBOUNCE_MS);
  };
})();

/** Show a debounced "Settings saved" toast */
function showSavedToast() {
  showSavedToastDebounced();
}

/**
 * Show an error toast for save failures.
 * @param err - The error that occurred during save
 */
function showErrorToast(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  toast.error(`Error saving: ${message}`);
}

interface UseAutoSaveFieldOptions<K extends keyof Settings> {
  /** Settings field key to save */
  field: K;
  /** Debounce delay in ms (default: 500, use 0 for immediate) */
  debounce?: number;
}

interface UseAutoSaveFieldReturn<T> {
  /** Current field value from settings */
  value: T;
  /** Update the field (triggers auto-save with optional debounce) */
  onChange: (value: T) => void;
}

interface UseAutoSaveSettingsReturn {
  /** Current settings */
  settings: Settings;
  /** Save partial settings with toast notification */
  savePartial: (partial: Partial<Settings>) => Promise<void>;
}

/**
 * Hook for auto-saving partial settings updates.
 * Provides a simple API for components that need to save multiple fields at once.
 */
export function useAutoSaveSettings(): UseAutoSaveSettingsReturn {
  const { settings, setSettings } = useSettings();

  const savePartial = useCallback(
    async (partial: Partial<Settings>) => {
      let updated: Settings;
      setSettings((prev) => {
        updated = { ...prev, ...partial };
        return updated;
      });
      try {
        await saveSettings(updated!);
        await onSettingsChanged();
        showSavedToast();
      } catch (err) {
        showErrorToast(err);
      }
    },
    [setSettings]
  );

  return { settings, savePartial };
}

/**
 * Hook for auto-saving a single settings field with optional debouncing.
 * Updates UI immediately while debouncing the actual save operation.
 * Shows a debounced toast notification when settings are saved.
 *
 * @param root0 - Options for the auto-save field
 * @param root0.field - Settings field key to save
 * @param root0.debounce - Debounce delay in ms (default: 500, use 0 for immediate)
 */
export function useAutoSaveField<K extends keyof Settings>({
  field,
  debounce = 500,
}: UseAutoSaveFieldOptions<K>): UseAutoSaveFieldReturn<Settings[K]> {
  const { settings, setSettings } = useSettings();

  // Debounced save function - automatically cleans up on unmount
  const debouncedSave = useDebouncedCallback(
    async (value: Settings[K]) => {
      try {
        await saveSettings({ [field]: value });
        await onSettingsChanged();
        showSavedToast();
      } catch (err) {
        showErrorToast(err);
      }
    },
    debounce
  );

  const onChange = useCallback(
    (value: Settings[K]) => {
      // Update local state immediately for responsive UI
      setSettings((prev) => ({ ...prev, [field]: value }));

      if (debounce > 0) {
        // Debounced save
        debouncedSave(value);
      } else {
        // Immediate save
        debouncedSave(value);
        debouncedSave.flush();
      }
    },
    [setSettings, field, debounce, debouncedSave]
  );

  return {
    value: settings[field],
    onChange,
  };
}

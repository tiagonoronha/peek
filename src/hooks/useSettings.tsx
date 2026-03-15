/**
 * Settings context and hook for app configuration state.
 * @module hooks/useSettings
 */

import { createContext, useContext, useMemo } from "react";
import type { Settings } from "@/shared";

/**
 * Context value provided by SettingsProvider.
 */
export interface SettingsContextValue {
  /** Current persisted application settings */
  settings: Settings;
  /** Replace the entire settings object (accepts a value or updater function) */
  setSettings: (s: Settings | ((prev: Settings) => Settings)) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Provides settings state to the component tree.
 * Must wrap any component using useSettings().
 *
 * @param root0 - Provider props
 * @param root0.settings - Current persisted application settings
 * @param root0.setSettings - Function to update settings state
 * @param root0.children - Child components to render within the provider
 */
export function SettingsProvider({
  settings,
  setSettings,
  children,
}: SettingsContextValue & { children: React.ReactNode }) {
  const value = useMemo(
    () => ({ settings, setSettings }),
    [settings, setSettings]
  );
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Access the settings context value.
 *
 * @returns Settings state and update methods
 * @throws Error if used outside of SettingsProvider
 */
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}

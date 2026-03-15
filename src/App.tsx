/**
 * Application entry point and root component.
 * Initializes the app, renders the settings UI with tabbed navigation.
 * @module App
 */

// Global Tailwind styles
import "./index.css";

import { getCurrentWindow } from "@tauri-apps/api/window";
import React, { useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { Provider } from "@/components/ui/Provider";
import { Spinner } from "@/components/ui/Spinner";
import { Toaster, toast } from "@/components/ui/Toaster";
import { SettingsProvider } from "@/hooks/useSettings";
import { initializeApp } from "@/services/appLifecycle";
import { loadSettings } from "@/services/configStore";
import { createLogger, DEFAULT_SETTINGS, type Settings } from "@/shared";

const logger = createLogger("[App]");

/**
 * Root component that manages settings state and provides context.
 * Automatically reloads settings when the window gains focus.
 */
function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const reloadFromStore = useCallback(async () => {
    try {
      const saved = await loadSettings();
      setSettings(saved);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      toast.error(`Error loading settings: ${message}`);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await reloadFromStore();
      setLoading(false);
    }
    init();
  }, [reloadFromStore]);

  // Re-load settings from store whenever the window becomes visible again
  // Force reload to pick up any external changes
  useEffect(() => {
    const unlisten = getCurrentWindow().onFocusChanged(
      ({ payload: focused }) => {
        if (focused) {
          loadSettings(true).then(setSettings);
        }
      }
    );
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <SettingsProvider settings={settings} setSettings={setSettings}>
        <SettingsTabs
          activeTabIndex={activeTabIndex}
          onTabChange={setActiveTabIndex}
        />
      </SettingsProvider>

      <Toaster />
    </div>
  );
}

// Initialize the app
initializeApp().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error("App initialization failed:", message);
});

// Prevent duplicate root creation on HMR
declare global {
  var __reactRoot: ReturnType<typeof ReactDOM.createRoot> | undefined;
}

if (!globalThis.__reactRoot) {
  globalThis.__reactRoot = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
  );
}

// StrictMode only in development (causes double renders for debugging)
const StrictModeWrapper = import.meta.env.DEV ? React.StrictMode : React.Fragment;

globalThis.__reactRoot.render(
  <StrictModeWrapper>
    <ErrorBoundary>
      <Provider>
        <App />
      </Provider>
    </ErrorBoundary>
  </StrictModeWrapper>
);

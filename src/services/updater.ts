/**
 * Auto-update service for checking, downloading, and installing app updates.
 * Uses tauri-plugin-updater to check GitHub releases for new versions.
 * @module services/updater
 */

import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import mitt from "mitt";
import { saveSettings } from "./configStore";
import { createLogger } from "@/shared";

const logger = createLogger("[Updater]");

/**
 * Set to a version string (e.g. "2.0.0") to simulate an available update.
 * Set to null for normal behavior.
 */
const FAKE_UPDATE_VERSION: string | null = null;

/** Check interval: 24 hours */
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Delay before initial check after startup */
const INITIAL_CHECK_DELAY_MS = 10_000;

// --- State ---

let pendingUpdate: Update | null = null;
let updateAvailable = FAKE_UPDATE_VERSION !== null;
let checkInterval: ReturnType<typeof setInterval> | null = null;

// --- Event emitter ---

type UpdateEvents = {
  "update-found": { version: string };
};

const emitter = mitt<UpdateEvents>();

/**
 * Subscribe to update-found events.
 * Fires when a background check discovers a new version.
 *
 * @param callback - Called with the new version info when an update is found
 */
export function onUpdateFound(
  callback: (data: { version: string }) => void
): () => void {
  emitter.on("update-found", callback);
  return () => emitter.off("update-found", callback);
}

// --- Getters ---

/** Whether an update has been found and is ready to install. */
export function isUpdateAvailable(): boolean {
  return updateAvailable;
}

/** Get the version string of the pending update, or null if none available. */
export function getUpdateVersion(): string | null {
  if (FAKE_UPDATE_VERSION) return FAKE_UPDATE_VERSION;
  return pendingUpdate?.version ?? null;
}

// --- Core ---

interface UpdateCheckResult {
  available: boolean;
  version?: string;
  body?: string;
}

/**
 * Check for available updates from GitHub releases.
 * Persists the check timestamp to config on success.
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  if (FAKE_UPDATE_VERSION) {
    logger.info(`Fake update: simulating v${FAKE_UPDATE_VERSION}`);
    updateAvailable = true;
    emitter.emit("update-found", { version: FAKE_UPDATE_VERSION });
    return { available: true, version: FAKE_UPDATE_VERSION };
  }

  logger.info("Checking for updates...");
  const update = await check();

  // Persist timestamp regardless of result
  await saveSettings({ lastUpdateCheck: new Date().toISOString() });

  if (update) {
    logger.info(`Update available: v${update.version}`);
    pendingUpdate = update;
    updateAvailable = true;
    emitter.emit("update-found", { version: update.version });
    return { available: true, version: update.version, body: update.body };
  }

  logger.info("No updates available");
  pendingUpdate = null;
  updateAvailable = false;
  return { available: false };
}

/**
 * Download and install the pending update, then relaunch the app.
 * Must call checkForUpdates() first to populate the pending update.
 */
export async function downloadAndInstall(): Promise<void> {
  if (FAKE_UPDATE_VERSION) {
    logger.info("Fake update: skipping download/install");
    return;
  }

  if (!pendingUpdate) {
    throw new Error("No pending update. Call checkForUpdates() first.");
  }

  logger.info(`Downloading update v${pendingUpdate.version}...`);
  await pendingUpdate.downloadAndInstall();
  logger.info("Update installed, relaunching...");
  await relaunch();
}

// --- Periodic checks ---

/**
 * Start periodic background update checks.
 * Skips the initial check if one was performed recently (within 24h).
 *
 * @param lastUpdateCheck - ISO timestamp of the last check from config
 */
export function startPeriodicChecks(lastUpdateCheck: string): void {
  stopPeriodicChecks();

  const doCheck = async () => {
    try {
      await checkForUpdates();
    } catch {
      // Silent — don't bother the user if the check fails
    }
  };

  // Skip initial check if one happened recently
  const msSinceLastCheck = lastUpdateCheck
    ? Date.now() - new Date(lastUpdateCheck).getTime()
    : Infinity;

  if (msSinceLastCheck >= CHECK_INTERVAL_MS) {
    setTimeout(doCheck, INITIAL_CHECK_DELAY_MS);
  } else {
    logger.info(
      `Skipping initial check — last check was ${Math.round(msSinceLastCheck / 60_000)}m ago`
    );
  }

  checkInterval = setInterval(doCheck, CHECK_INTERVAL_MS);
}

/**
 * Stop periodic background update checks.
 */
export function stopPeriodicChecks(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

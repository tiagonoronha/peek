/**
 * Configuration persistence service using Tauri filesystem API.
 * Stores settings in ~/.peek/config.json.
 * @module services/configStore
 */

import { readTextFile, writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { z } from 'zod';
import { DEFAULT_SETTINGS, type Settings } from '@/shared';

const CONFIG_DIR = '.peek';
const CONFIG_FILE = `${CONFIG_DIR}/config.json`;
const BASE_DIR = BaseDirectory.Home;

// In-memory cache to avoid reading file on every save
let cachedConfig: Settings | null = null;

/**
 * Zod schema for validating config files.
 * All fields are optional since config may be partial.
 */
const configSchema = z.object({
  haUrl: z.string().optional(),
  haToken: z.string().optional(),
  menuBarSensors: z.array(z.string()).optional(),
  dropdownSensors: z.array(z.string()).optional(),
  menuBarSensorNames: z.record(z.string(), z.string()).optional(),
  dropdownSensorNames: z.record(z.string(), z.string()).optional(),
  menuBarFormat: z.string().optional(),
  dropdownFormat: z.string().optional(),
  menuBarSeparator: z.string().optional(),
  autoStartOnLogin: z.boolean().optional(),
  lastUpdateCheck: z.string().optional(),
}).catchall(z.unknown()); // Allow unknown fields for forward compatibility

async function readConfig(bypassCache = false): Promise<Settings> {
  // Return cached config if available and not bypassing
  if (!bypassCache && cachedConfig) {
    return { ...cachedConfig };
  }

  try {
    const raw = await readTextFile(CONFIG_FILE, { baseDir: BASE_DIR });
    const parsed: unknown = JSON.parse(raw);

    // Validate with Zod schema - returns defaults on invalid config
    const result = configSchema.safeParse(parsed);
    if (!result.success) {
      cachedConfig = { ...DEFAULT_SETTINGS };
      return { ...cachedConfig };
    }

    cachedConfig = { ...DEFAULT_SETTINGS, ...result.data };
    return { ...cachedConfig };
  } catch {
    // File or directory doesn't exist yet, or JSON parse failed — return defaults
    cachedConfig = { ...DEFAULT_SETTINGS };
    return { ...cachedConfig };
  }
}

async function writeConfig(config: Settings): Promise<void> {
  // Ensure the config directory exists (no-op if it already does)
  await mkdir(CONFIG_DIR, { baseDir: BASE_DIR, recursive: true });
  await writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2), { baseDir: BASE_DIR });
  // Update cache after successful write
  cachedConfig = { ...config };
}

// --- Public API ---

/**
 * Load settings from the config file.
 * Returns default settings if config file doesn't exist.
 *
 * @param forceReload - If true, bypasses cache and reads from disk
 */
export async function loadSettings(forceReload = false): Promise<Settings> {
  return readConfig(forceReload);
}

/**
 * Save partial settings by merging with existing config.
 *
 * @param partial - Settings fields to update (merged with existing)
 * @returns The complete updated settings object
 */
export async function saveSettings(partial: Partial<Settings>): Promise<Settings> {
  const config = await readConfig();
  const updated = { ...config, ...partial };
  await writeConfig(updated);
  return updated;
}


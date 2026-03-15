/**
 * Tray state interface and initialization.
 * @module services/tray/trayState
 */

import type {
  HaConnectionStatus,
  HaEntityState,
  Settings,
} from "../../shared/types";
import type { Resource } from "@tauri-apps/api/core";
import type { Menu } from "@tauri-apps/api/menu";
import type { TrayIcon } from "@tauri-apps/api/tray";

/**
 * Module state for the tray service.
 */
export interface TrayState {
  /** Tray icon instance (null if initialization failed) */
  tray: TrayIcon | null;
  /** Whether the icon is currently hidden */
  iconHidden: boolean;
  /** Promise chain for serializing title/icon updates */
  pendingTitleUpdate: Promise<void>;
  /** Last title set (for deduplication) */
  latestTitle: string | null;
  /** Whether a menu rebuild is currently in progress */
  menuRebuildInProgress: boolean;
  /** Current connection status */
  status: HaConnectionStatus;
  /** Current error message */
  error: string | null;
  /** Latest render inputs - prevents stale data from closure capture */
  latestRenderInputs: { states: Map<string, HaEntityState>; settings: Settings } | null;
  /** Flag for coalescing queue pattern - ensures final update is never missed */
  renderRequested: boolean;
  /** Tracks consecutive tray errors to prevent spam */
  consecutiveErrors: number;
  /** Prevents double-click on reconnect button */
  reconnectInProgress: boolean;
  /** Current menu instance for cleanup (Rust resource) */
  currentMenu: Menu | null;
  /** Current menu items for cleanup (Rust resources) */
  currentMenuItems: Resource[];
  /** Old resources queued for deferred cleanup (closed at start of next render) */
  pendingCleanup: Resource[];
  /** Fingerprint of last menu content to skip unnecessary setMenu() calls */
  latestMenuFingerprint: string;
}

/**
 * Create initial tray state.
 */
export function createInitialState(): TrayState {
  return {
    tray: null,
    iconHidden: false,
    pendingTitleUpdate: Promise.resolve(),
    latestTitle: null,
    menuRebuildInProgress: false,
    status: "disconnected",
    error: null,
    latestRenderInputs: null,
    renderRequested: false,
    consecutiveErrors: 0,
    reconnectInProgress: false,
    currentMenu: null,
    currentMenuItems: [],
    pendingCleanup: [],
    latestMenuFingerprint: "",
  };
}

/** Maximum consecutive errors before disabling tray */
export const MAX_CONSECUTIVE_ERRORS = 5;

/**
 * Logging utility for consistent terminal output across services.
 * Only logs in development mode via Tauri's log_to_terminal command.
 * @module shared/logger
 */

import { invoke } from "@tauri-apps/api/core";

const IS_DEV = import.meta.env.DEV;

export interface Logger {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function formatArgs(...args: unknown[]): string {
  return args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
    .join(" ");
}

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Create a logger with a prefix that logs via Tauri's terminal output.
 * Only logs in development mode.
 *
 * @param prefix - Prefix for log messages (e.g., "[HA WS]", "[Tray]")
 * @returns Logger instance with info and error methods
 *
 * @example
 * const log = createLogger("[MyService]");
 * log.info("Starting up");
 * log.error("Something went wrong", err);
 */
export function createLogger(prefix: string): Logger {
  const log =
    (level: "info" | "error") =>
    (...args: unknown[]) => {
      if (!IS_DEV) return;
      invoke("log_to_terminal", {
        level,
        message: `${prefix} [${getTimestamp()}] ${formatArgs(...args)}`,
      }).catch(() => {});
    };

  return {
    info: log("info"),
    error: log("error"),
  };
}

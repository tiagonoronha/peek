import type { HaConnectionStatus } from "./types";

export interface FormatStatusOptions {
  /** URL to display when connected (optional) */
  connectedUrl?: string;
  /** Use ellipsis character for "connecting" state (for UI display) */
  useEllipsisChar?: boolean;
}

/**
 * Format connection status to user-friendly text.
 * Shared between tray menu and settings UI.
 *
 * @param status - Current connection status
 * @param error - Last error message, if any
 * @param options - Formatting options
 */
export function formatConnectionStatus(
  status: HaConnectionStatus,
  error: string | null,
  options: FormatStatusOptions = {}
): string {
  const { connectedUrl, useEllipsisChar = false } = options;
  const ellipsis = useEllipsisChar ? "\u2026" : "...";

  switch (status) {
    case "connected":
      return connectedUrl ? `Connected to ${connectedUrl}` : "Connected";
    case "connecting":
      return `Establishing connection${ellipsis}`;
    case "auth_invalid":
      return "Error: Invalid token";
    default:
      return error ? `Disconnected: ${error}` : "Disconnected";
  }
}

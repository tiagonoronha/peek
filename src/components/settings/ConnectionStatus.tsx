/**
 * Connection status indicator with colored dot and text.
 * @module settings/components/ConnectionStatus
 */

import { useState } from "react";
import { Status } from "@/components/ui/Status";
import { useHaConnectionStatus } from "@/hooks/useHaStates";
import { useSettings } from "@/hooks/useSettings";
import { hasCredentials, retryConnection } from "@/services/haConnection";
import { formatConnectionStatus } from "@/shared";

/** Maps connection status to color palette */
const STATUS_COLORS: Record<string, "green" | "yellow" | "red" | "gray"> = {
  connected: "green",
  connecting: "yellow",
  disconnected: "gray",
  auth_invalid: "red",
};

/**
 * Displays current Home Assistant connection status.
 * Shows colored indicator dot and formatted status text.
 */
export function ConnectionStatus() {
  const { settings } = useSettings();
  const { status, error } = useHaConnectionStatus();
  const [retrying, setRetrying] = useState(false);

  const colorPalette = STATUS_COLORS[status] || "gray";
  const isConnecting = status === "connecting";
  const showRetry = status === "disconnected" && hasCredentials() && !retrying;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryConnection();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex items-center gap-2 py-2.5 px-3 rounded-md text-sm bg-bg-muted">
      <Status colorPalette={colorPalette} animate={isConnecting} />
      <span>
        {formatConnectionStatus(status, error, {
          connectedUrl: settings.haUrl || undefined,
          useEllipsisChar: true,
        })}
      </span>
      {showRetry && (
        <button
          type="button"
          onClick={handleRetry}
          className="ml-auto text-fg-muted hover:text-fg cursor-pointer text-sm"
        >
          Retry
        </button>
      )}
    </div>
  );
}

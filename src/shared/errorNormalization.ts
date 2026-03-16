/**
 * Error normalization utilities for user-friendly error messages.
 * @module shared/errorNormalization
 */

import {
  ERR_HASS_HOST_REQUIRED,
  ERR_INVALID_AUTH,
  ERR_CONNECTION_LOST,
  ERR_CANNOT_CONNECT,
} from "home-assistant-js-websocket";

/** Type guard for errors with a code property (home-assistant-js-websocket errors) */
interface ConnectionError extends Error {
  code?: number;
}

/**
 * Check if an error has a numeric code property.
 *
 * @param err - The error to check
 */
export function hasErrorCode(err: unknown): err is ConnectionError {
  return (
    err instanceof Error &&
    "code" in err &&
    typeof (err as ConnectionError).code === "number"
  );
}

/**
 * Normalize connection errors to user-friendly messages.
 * Handles both home-assistant-js-websocket error codes and generic error strings.
 *
 * @param errCode - Error code (number), error message (string), or error object
 * @returns User-friendly error message
 *
 * @example
 * normalizeConnectionError(ERR_INVALID_AUTH) // "Invalid access token..."
 * normalizeConnectionError("ECONNREFUSED") // "Connection refused..."
 */
export function normalizeConnectionError(
  errCode: number | string | unknown
): string {
  if (typeof errCode === "number") {
    switch (errCode) {
      case ERR_HASS_HOST_REQUIRED:
        return "Home Assistant URL is required.";
      case ERR_INVALID_AUTH:
        return "Invalid access token. Check your long-lived token.";
      case ERR_CONNECTION_LOST:
        return "Connection lost. Reconnecting...";
      case ERR_CANNOT_CONNECT:
        return "Cannot connect to Home Assistant. Check URL and network.";
      default:
        return `Connection error (${errCode})`;
    }
  }

  const str = String(errCode).toLowerCase();
  if (str.includes("auth") && (str.includes("invalid") || str.includes("fail"))) {
    return "Invalid access token. Check your long-lived token in HA settings.";
  }
  if (str.includes("ssl") || str.includes("tls") || str.includes("cert")) {
    return "TLS/certificate error. Check your HTTPS configuration.";
  }
  if (str.includes("econnrefused") || str.includes("connection refused")) {
    return "Connection refused. Is Home Assistant running at this URL?";
  }
  if (str.includes("enotfound") || str.includes("getaddrinfo") || str.includes("dns")) {
    return "Host not found. Check the URL for typos.";
  }
  if (str.includes("timeout") || str.includes("timed out")) {
    return "Connection timed out. The server may be unreachable.";
  }
  if (
    str.includes("cleartext") ||
    str.includes("app transport security") ||
    str.includes("ats") ||
    str.includes("insecure load")
  ) {
    return "Cleartext HTTP blocked by macOS App Transport Security. Use https:// or a .local address.";
  }

  return typeof errCode === "string" ? errCode : `Connection error: ${errCode}`;
}

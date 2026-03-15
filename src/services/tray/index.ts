/**
 * Tray service public API.
 * Re-exports all public functions for backwards compatibility.
 * @module services/tray
 */

export { initTray, setTrayConnectedState, renderTray } from "./trayService";
export { applyFormat, formatSensor } from "./sensorFormatter";
export type { FormatSensorOptions } from "./sensorFormatter";

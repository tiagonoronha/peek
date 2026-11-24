# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Automatic reconnection no longer gives up. Failed attempts are retried indefinitely with backoff, and the app reconnects right away after wake from sleep or when the network comes back.
- Silently dead connections, for example after the Mac was locked or idle, are now detected with a heartbeat ping and re-established.

## [1.1.0] - 2026-04-15

### Added

- Light mode support with a theme selector.
- Menu bar sensor pagination with a global shortcut to cycle between pages.
- Auto-return to the first menu bar page after a period of inactivity.

### Changed

- Replaced pill tabs with a vertical sidebar navigation.
- Split the General settings tab into separate Connection and System tabs, with System positioned just before About.
- Redesigned card layout so headers sit outside the card body background.
- Inputs, selects, and the switch off state now use the main background for a cleaner look.
- Refined form field layout and styling.
- Removed the accordion from connection settings for a flatter layout.
- Updated the server URL placeholder and error text to use `http`.
- Updated the token replace button cursor and confirmation message.
- Sensor values now respect the Home Assistant display precision.
- Simplified tray sensor updates for improved performance.

## [1.0.2] - 2026-03-19

### Changed

- Refactor connection error handling and inline error-code lookup into `haConnection.ts`.

### Added

- `NSLocalNetworkUsageDescription` and Bonjour service declarations for macOS local network permission prompt.

### Fixed

- `ERR_INVALID_AUTH` now correctly triggers `auth_invalid` status (HA WS library rejects with plain numbers, not Error objects).
- CSP `connect-src` now includes port wildcards and IPC schemes, fixing WebSocket connections to local/IP addresses with explicit ports.

## [1.0.1] - 2026-03-16

### Fixed

- Add 10s timeout to WebSocket connection to prevent hanging indefinitely.
- Store credentials before connection attempt so reconnect is available on failure.

### Added

- Retry button to settings connection status banner when disconnected.

## [1.0.0] - 2026-03-16

- Initial release.

[1.1.0]: https://github.com/tiagonoronha/peek/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/tiagonoronha/peek/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/tiagonoronha/peek/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/tiagonoronha/peek/releases/tag/v1.0.0

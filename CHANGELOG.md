# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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

[1.0.2]: https://github.com/tiagonoronha/peek/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/tiagonoronha/peek/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/tiagonoronha/peek/releases/tag/v1.0.0

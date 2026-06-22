# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Optional Google Firestore database backend.
- Material confirm dialog replacing the native browser `confirm()`.
- Unit test suite (Vitest), Playwright end-to-end tests, and visual
  regression testing.

### Changed

- Redesigned the UI with a warm, minimal "paper" Material 3 theme.
- Migrated state management to NgRx Signal Store and adopted Angular Signals.
- Switched to a zoneless application with `OnPush` change detection throughout.
- Upgraded Angular to v21 and Node.js to v24.
- Adopted strict TypeScript and upgraded Zod to v4.
- Migrated linting from ESLint to Oxlint, formatting to Oxfmt, and the test
  runner to Vitest.

### Security

- Bumped multiple dependencies to address security advisories.

## [1.0.0] - 2025-01-23

A Progressive Web App (PWA) designed for efficient time tracking, allowing
users to record past events and manage multiple stopwatches simultaneously.

### Added

- **Last Time** mode for recording when events last happened, with timestamp history.
- **Stopwatch** mode supporting multiple parallel stopwatches with laps.
- Local-first storage using PouchDB (IndexedDB), fully functional offline.
- Optional bidirectional live sync with a remote CouchDB database.
- Progressive Web App support, installable to a phone's home screen.
- Light and dark color schemes.
- Docker image and Docker Compose setup for self-hosting.

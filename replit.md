# Overview

Chaldea is a Telegram bot framework designed for group management and interactive features. It provides a modular command system, event handling for member join/leave actions, role-based access control, and support for various media types. The bot uses polling-based message handling and can run multiple bot instances simultaneously.

## Recent Changes

**October 10, 2025 - Command Architecture Refactoring**: Completed comprehensive refactoring of all 19 command files to standardize the command contract and improve code consistency:
- **Standardized Metadata**: All commands now use `export const meta` with complete required fields (name, version, aliases, description, author, prefix, category, type, cooldown, guide)
- **Response-Based Architecture**: Replaced legacy `message` parameter with unified `response` object in command handler, providing consistent API for all user-facing outputs
- **Modern Export Format**: All commands use `export async function onStart` with `response` parameter for sending replies, photos, videos, and other media
- **Unified Error Handling**: Replaced legacy `log.error` with `console.error` across all command files and callback handlers
- **Callback Handler Updates**: Fixed all callback handlers in media commands (animeme, cosplay, meme, waifu) to use `console.error` and proper response methods
- **Verified Production-Ready**: All 19 commands reviewed and approved by architect for consistency, completeness, and production readiness

**October 2025 - ES Module Modernization**: The entire codebase has been converted from CommonJS (require/module.exports) to modern ES modules (import/export) to match the package.json "type": "module" configuration. This includes:
- All core system files (login.js, install.js, message.js, scriptsUtils.js, cache.js, main.js, listen.js, server.js)
- All handler files (command.js, event.js, word.js, reply.js, chat.js, callback.js)
- All command and event modules in apps/ directory
- Update utility (update.js)
- Proper __dirname/__filename polyfills using fileURLToPath for ES module compatibility

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Architecture Pattern

**Modular Command & Event System**: The bot uses a plugin-based architecture where commands and events are dynamically loaded from the `apps/` directory. Each module is self-contained with metadata defining its behavior, permissions, and execution logic.

**Multi-Instance Bot Support**: The system supports running multiple Telegram bot instances from a single codebase by distributing group chats across instances using chat ID modulo assignment. Private chats are handled by all instances.

**Handler Pipeline**: Incoming messages pass through a sequential handler pipeline:
1. Event handlers (welcome/goodbye)
2. Reply handlers (for threaded conversations)
3. Callback handlers (for inline button interactions)
4. Command handlers (prefix-based or keyword-based)
5. Word/keyword detection handlers
6. Chat-level handlers (for continuous interactions)

## Permission & Access Control

**Three-Tier Role System**:
- `admin`: Bot administrators defined in `setup/settings.json`
- `vip`: VIP users defined in `setup/vip.json`
- `anyone`: All users

Commands can specify `type` field to restrict access. The system checks both bot-level permissions and Telegram group admin status.

**Chat Type Restrictions**: Commands can be restricted to `group`, `private`, or allow both chat types.

## Command System

**Prefix Flexibility**: Commands support three modes via the `prefix` field:
- `true`: Requires prefix (e.g., `-help`)
- `false`: No prefix needed
- `"both"`: Works with or without prefix

**Cooldown Mechanism**: Per-user cooldowns prevent command spam. Cooldown state is maintained in `global.chaldea.cooldowns` Map.

**Command Discovery**: Commands are loaded from `apps/commands/` and registered in `global.chaldea.commands` Map. Each command exports `meta` object and `onStart` function. Optional handlers include `onCallback`, `onReply`, `onWord`, and `onChat`.

## Message Abstraction Layer

**Message Class**: Provides a unified interface for sending various message types (text, photo, audio, video, document, sticker, animation). Automatically handles reply-to-message logic for group chats unless explicitly disabled via `noReply` option.

**Reply Tracking**: The system maintains a `global.chaldea.replies` Map to track messages requiring follow-up responses, enabling conversation threading.

## Configuration Management

**JSON-Based Configuration**: All settings stored in `setup/` directory:
- `states.json`: Bot tokens for multi-instance support
- `settings.json`: Global settings (prefix, timezone, admin IDs, dev mode)
- `vip.json`: VIP user IDs
- `api.json`: External API endpoints

**Global State**: Configuration loaded into `global.settings`, `global.vip`, `global.api`, and `global.states` for universal access.

## Development & Debugging

**Dev Mode**: When enabled, logs detailed execution metrics including command name, execution time, and timestamp with timezone formatting.

**Process Management**: The `index.js` entry point spawns the main bot process with error tracing flags (`--trace-warnings`, `--async-stack-traces`) for better debugging.

## Module Lifecycle

**ES Module Architecture**: The entire codebase uses ES module syntax (import/export) as specified in package.json "type": "module". All files use modern import statements and export declarations.

**Dynamic Loading**: Commands and events use ES module dynamic imports (`await import()`) with cache-busting query parameters to enable hot-reloading without CommonJS caching issues.

**Validation**: All modules validated for required properties (`meta`, `meta.name`, `onStart`) before registration. Modules must export named functions and objects per ES module standards.

**Cache Management**: Temporary files stored in `apps/temp/` with automatic cleanup on startup.

**Polyfills**: ES modules don't provide __dirname and __filename by default. Core files use `fileURLToPath(import.meta.url)` and `path.dirname()` to recreate these values when needed for path resolution.

# External Dependencies

## Core Libraries

**node-telegram-bot-api**: Primary Telegram Bot API wrapper using polling mode for message reception.

**express**: HTTP server for health checks and keepalive endpoints (port 3000 or `PORT` env variable).

## Utility Libraries

**axios**: HTTP client for external API calls (memes, AI services, media fetching).

**moment-timezone**: Timezone-aware timestamp formatting for logging and display.

**fs-extra**: Enhanced filesystem operations with promise support.

**supports-color**: Terminal color support detection for console output.

## External APIs

**Neko API** (`api.nekorinn.my.id`): Provides AI chat services (Grok, Venice), Spotify search/download, and other utilities.

**Waifu.pics API**: Random anime character images with category support.

**Meme API** (`meme-api.com`): Random meme generation for entertainment commands.

**Joke API** (`official-joke-api.appspot.com`): Random joke delivery.

**Useless Facts API** (`uselessfacts.jsph.pl`): Random facts for trivia commands.

## Data Storage

**File-Based Storage**: No database used. All persistent data (settings, VIP lists, admin lists) stored in JSON files within `setup/` directory.

**In-Memory State**: Runtime state (command registry, cooldowns, reply tracking, callbacks) maintained in `global.chaldea` object with Map collections.

## Third-Party Integrations

**GitHub Repository**: Update system configured to pull from `https://github.com/shawndesu/chaldea.git` with selective file preservation.

**Spotify**: Integration via Neko API for track search and audio download.

**Media Hosting**: Commands fetch media from various sources (GitHub repos for cosplay videos, public meme APIs).
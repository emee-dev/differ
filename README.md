## Differ

Differ is a minimal dev utility app aimed at providing a set of tools that developers are more likely to use everyday. Such tools includes AI chat, Cross device Pastebin and Code snippet diff checker. It can also be used as a standard Tauri template providing best practices regarding Async rust, error handling, Unit tests and memory safety in general.


## INSPIRATION
-----------
I was heavy inspired by the most recent Cloudflare `unwrap()` bug which took down a major portion of the internet. Other inspirations came from my undying passion for entrepreneurship building `Panda http` which ultimately lead to rust in the first place.


## What problem were you solving?
This application has 3 distinctive features namely:
- Diff checker: this feature makes it easy and intuitive to spot differences in text, which are then highlighted intuitively making it robust for easily catching errors or typo(s) you would have missed if done manually.
- AI chat: in todays age of cloud computing it is becoming increasingly hard to always retain a copy of your data or transactions online. This feature allows you to maintain or retain a locally stored copy of all your AI chats, providing an intuitive user interface that does not block your daily chats. It is very fast and minimal as you can imagine.
- Pastebin: This is a personal problem, I usually find it frustrating to copy and paste text to/from my phone and laptop. This utility enables me to send text/attachments anything from my mobile phone to my laptop vice versa.

## Why does this problem matter?
This is application has been carefully crafted with runtime memory safety, error handling in mind. As I highlighted above, the recent cloudflare bug really dealt a lot of damage to most of us on the internet. With that in mind, I painstakingly made my app such that there is no `unwrap` or `.expect()` used unless explicit required to crash the application. The app is very error resilient according to my current knowledge and experience on rust.


## WHAT IT DOES
------------
High-level explanation of the application.

- Core features
- Main user flows
- Key interactions


## ARCHITECTURE OVERVIEW
---------------------

Tech Stack
~~~~~~~~~~
Frontend:
- React 
- Tanstack query & router
- vercel aisdk

Backend:
- rust (Tauri)
- convex
- aisdk.rs
- anyhow / thiserror
- tokio async runtime
- serde
- axum

Database:
- SQLite with SQLx ORM

Tooling:
- Vite
- pnpm
- cargo
- clippy


PROJECT STRUCTURE
-----------------
.
├── prototype/              Used for mocking/testing functions without Tauri IPC
├── src/                    Frontend source code
│   ├── components/
│   ├── convex/
│   ├── lib/ipc/*           IPC functions
│   ├── hooks/              React hooks for querying & mutations
│   └── main.tsx
│
├── src-tauri/              Rust + Tauri backend
│   ├── src/
│   │   ├── main.rs         Application entry point
│   │   ├── lib.rs          Setup tauri and necessary services
│   │   ├── axum.rs         Axum server for the `/api/chat` SSE requests
│   │   ├── ipc*.rs         IPC Tauri command handlers
│   │   ├── error.rs        Application level error definitions
│   │   ├── prelude.rs      Reuseable struct definitions
│   │   ├── constants.rs    Hard-coded values that are unlikely to change
│   │   ├── utils.rs        Utilities that make my life easier
│   │   └── db*.rs          Sqlx Database handlers
│   ├── migrations/         Sqlx database migrations
│   ├── tests/              Unit tests
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── package.json
├── .env.example            Required environment variables; copy into `.env.local`
├── pnpm-lock.yaml
├── LICENSE.txt
├── Cargo.toml
└── README.txt
~~~~~~~~~~


### SETUP & INSTALLATION
--------------------

Prerequisites:
- Node.js >= v25.1.0
- pnpm@10.20.0 / npm / yarn
- Rust >= <version>
- Tauri CLI

Install Tauri CLI:
cargo install tauri-cli

Install dependencies:
pnpm install

Run in development:
pnpm tauri dev

Build for production:
pnpm tauri build


SECURITY & PERFORMANCE
----------------------
- Secure IPC command boundaries
- Restricted Tauri API permissions
- Rust memory safety guarantees
- Fast startup time
- Small production binary size


ACHIEVEMENTS
------------
- Built a full desktop app within hackathon time limits
- Successfully integrated Rust with a modern frontend
- Clean separation between UI and system logic
- Zero usage of ``


LESSONS LEARNED
---------------
- Understanding Tauri’s IPC model
- Managing async Rust with application state
- Structuring Rust code for maintainability
- Balancing speed vs polish during a hackathon


CHALLENGES FACED
----------------
- Rust compile-time errors and ownership rules
- Tauri configuration and permissions
- Debugging frontend-backend communication
- Cross-platform differences


FUTURE IMPROVEMENTS
-------------------
- Plugin architecture
- Auto-updates
- Offline-first support
- Enhanced error handling
- More native OS integrations


TEAM & CONTRIBUTIONS
--------------------
- <Name> — Frontend
- <Name> — Rust / Backend
- <Name> — Design / Architecture


LICENSE
-------
MIT


FINAL NOTES
-----------
Built with Rust and Tauri during <Hackathon Name>.

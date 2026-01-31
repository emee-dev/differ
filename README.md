## Differ

Differ is a minimal dev utility app aimed at providing a set of tools that developers are more likely to use every day. Such tools include AI chat, cross-device Pastebin, and a code snippet diff checker. It can also be used as a standard Tauri template, providing best practices regarding async Rust, error handling, unit tests, and memory safety in general. This was built for the Rust Africa 2026 Hackathon [#RustAfricaHackathon]()

## Inspiration

I was heavily inspired by the most recent Cloudflare `unwrap()` bug, which took down a major portion of the internet. Other inspirations came from my undying passion for entrepreneurship building `Panda HTTP`, which ultimately led me to Rust in the first place.

## What problem were you solving?

This application has three distinctive features, namely:

- **Diff checker**: This feature makes it easy and intuitive to spot differences in text, which are highlighted clearly. It is robust for catching differences or typos you would have missed if done manually.
- **AI chat**: In today’s age of cloud computing, it is becoming increasingly hard to always retain a copy of your data or transactions online. This feature allows you to maintain a locally stored copy of all your AI chats, providing an intuitive user interface that does not block your daily usage. It is very fast and minimal.
- **Pastebin**: This is a personal problem. I usually find it frustrating to copy and paste text to and from my phone and laptop. This utility enables me to send text or attachments from my mobile phone to my laptop, and vice versa.

## Why does this problem matter?

This application has been carefully crafted with runtime memory safety and error handling in mind. As highlighted above, the recent Cloudflare bug dealt a lot of damage to many of us on the internet. With that in mind, I painstakingly designed this app such that there is no use of `unwrap` or `.expect()` unless explicitly required to crash the application. The app is very error-resilient, according to my current knowledge and experience with Rust.

## Demo
You can find the video demo here [Youtube](https://youtu.be/aPvLLuv0_c0)

## Architecture Overview

**Frontend**
- React  
- TanStack Query & Router  
- Vercel AI SDK  

**Backend**
- Rust (Tauri)  
- Convex  
- aisdk.rs  
- anyhow / thiserror  
- Tokio async runtime  
- Serde  
- Axum  

**Database**
- SQLite with SQLx ORM  

**Tooling**
- Vite  
- Pnpm  
- Cargo  
- Clippy  

### Project Structure
~~~~~~~~~~
├── prototype/              Used for mocking/testing functions without Tauri IPC
├── src/                    Frontend source code
│   ├── components/
│   ├── convex/
│   ├── lib/ipc/*           IPC client functions
│   ├── hooks/              React hooks for queries & mutations
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


## SETUP & INSTALLATION

Prerequisites:
- Node.js v25.1.0
- pnpm@10.20.0
- rustc: 1.92.0
- cargo: 1.92.0
- rustup: 1.28.2

```bash
git clone https://github.com/emee-dev/differ

cd differ
```

Install dependencies
```bash
pnpm install
```

Run in development:

```bash
pnpm tauri dev # copy `.env.example` to `.env.local`

# pnpm tauri build # release build
```

## SECURITY & PERFORMANCE
- Secure IPC command boundaries
- Restricted Tauri API permissions
- Utilizing sqlx for secure database queries. 
- Fast startup time
- Small production binary size


## LESSONS LEARNED
- Understanding Tauri’s IPC model
- Managing async Rust with application state
- Structuring Rust code for maintainability
- Balancing speed vs polish during a hackathon
- Handling errors are early as possible


## CHALLENGES FACED
- Rust compile-time errors and ownership rules
- Unit testing rust code, trying to figure out what to test
- Async rust
- Understanding of threads and where best to use them.


## TEAM
- Emmanuel Ajike — Solo


## LICENSE
MIT
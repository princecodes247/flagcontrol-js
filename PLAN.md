# Plan: FlagControl Next.js SDK (`@flagcontrol/next`)

This plan outlines the architecture, features, and implementation steps for building a dedicated Next.js SDK that supports both Server Components (RSC) and Client Components with zero layout shift.

## 1. Key Architectural Features

### A. Unified Client / Server Entrypoints (`package.exports`)
We will configure `package.json` exports to load the appropriate SDK version depending on where it's imported:
* **Server Components (RSC)**: Imports load a server-optimized module wrapping `@flagcontrol/node`.
* **Client Components (`"use client"`)**: Imports load a client-optimized module wrapping `@flagcontrol/react`.

### B. SSR Hydration (Zero-Flash Layouts)
* Provide a `<FlagControlProvider>` that accepts initial flag values fetched on the server side during server rendering.
* Pass these flags down to Client Components so they are immediately available during hydration without waiting for a client-side network request.

### C. Lightweight Edge Middleware Client
* A dedicated entrypoint optimized for V8 Edge runtimes (no Node-specific built-ins) to perform routing, redirects, and rewrites in Next.js Middleware based on flag states.

---

## 2. Implementation Checklist

- [ ] **Package Setup**:
  - Create `packages/next-sdk` workspace directory.
  - Configure `package.json` with multi-entry exports (`.`, `./server`, `./client`, `./edge`).
  - Configure `tsconfig.json` and build toolchain (`tsup`).
- [ ] **Server Components (RSC) Support**:
  - Implement server-side client setup using `@flagcontrol/node`.
  - Expose server-side functions (e.g. `getFlag(key)`) for use directly in Async Server Components.
- [ ] **SSR Provider & Hydration**:
  - Create `<FlagControlProvider>` to accept `initialFlags`.
  - Wire it to client-side react context for Client Components.
- [ ] **Edge Middleware Client**:
  - Implement a lightweight client that runs on Edge runtimes.
- [ ] **Documentation & Examples**:
  - Add usage examples for App Router, Pages Router, and Middleware.

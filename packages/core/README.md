# @flagcontrol/core

The core SDK for [FlagControl](https://flagcontrol.com) - providing shared logic for feature flag evaluation, real-time streaming, and list management.

[![npm](https://img.shields.io/npm/v/@flagcontrol/core)](https://www.npmjs.com/package/@flagcontrol/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This package contains the core functionality used by all FlagControl SDKs:

- **Flag evaluation** - Local and remote evaluation modes
- **Real-time updates** - Fetch-based streaming that works in Node.js, edge runtimes, and browsers
- **Incremental sync** - Cursor-based change tracking for efficient updates
- **List management** - Create, update, and manage targeting lists

## Installation

```bash
npm install @flagcontrol/core
```

> **Note**: Most users should install [`@flagcontrol/node`](https://www.npmjs.com/package/@flagcontrol/node) or [`@flagcontrol/react`](https://www.npmjs.com/package/@flagcontrol/react) instead, which include this package and provide a more convenient API.

## Usage

```typescript
import { createBaseClient } from '@flagcontrol/core';

const client = createBaseClient({
  sdkKey: 'YOUR_SDK_KEY',
  evaluationMode: 'local', // or 'remote'
});

await client.waitForInitialization();

// Evaluate flags
const value = client.get('my-flag', {}, 'default-value');

// Check if enabled
const isEnabled = client.isEnabled('feature-flag', { userId: 'user-123' });

// List operations
await client.addToList('beta-users', { key: 'user-123' });
await client.removeFromList('beta-users', 'user-123');

// Manual sync
await client.syncChanges();
```

## Related Packages

| Package | Description |
|---------|-------------|
| [`@flagcontrol/node`](https://www.npmjs.com/package/@flagcontrol/node) | Node.js SDK for server-side usage |
| [`@flagcontrol/react`](https://www.npmjs.com/package/@flagcontrol/react) | React SDK with hooks and provider |
| [`flagcontrol`](https://www.npmjs.com/package/flagcontrol) | CLI for TypeScript type generation |

## Documentation

For full documentation, visit [flagcontrol.com/docs](https://flagcontrol.com/docs).

## License

MIT

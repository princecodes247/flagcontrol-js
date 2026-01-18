# @flagcontrol/node

The Node.js SDK for [FlagControl](https://flagcontrol.com) - feature flag and remote configuration management.

[![npm](https://img.shields.io/npm/v/@flagcontrol/node)](https://www.npmjs.com/package/@flagcontrol/node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @flagcontrol/node
```

## Usage

### 1. Initialize the client

```typescript
import { createFlagControlClient } from '@flagcontrol/node';

const client = createFlagControlClient({
  sdkKey: 'YOUR_SDK_KEY',
});
```

### 2. Evaluate flags

```typescript
// Check if a feature is enabled
const isEnabled = client.isEnabled('new-feature', { userId: 'user-123' });

if (isEnabled) {
  console.log('New feature enabled');
}

// Get flag value with fallback
const value = client.get('config-flag', { userId: 'user-123' }, 'default-value');
```

### 3. List management

```typescript
// Add users to a targeting list
await client.addToList('beta-users', { key: 'user-123' });

// Remove users from a list
await client.removeFromList('beta-users', 'user-123');

// Sync changes manually
await client.syncChanges();
```

## Related Packages

| Package | Description |
|---------|-------------|
| [`@flagcontrol/core`](https://www.npmjs.com/package/@flagcontrol/core) | Core SDK logic |
| [`@flagcontrol/react`](https://www.npmjs.com/package/@flagcontrol/react) | React SDK with hooks |
| [`flagcontrol`](https://www.npmjs.com/package/flagcontrol) | CLI for TypeScript type generation |

## Documentation

For full documentation, visit [flagcontrol.com/docs](https://flagcontrol.com/docs).

## License

MIT

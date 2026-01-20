# @flagcontrol/node

The Node.js SDK for [FlagControl](https://flagcontrol.com) - feature flag and remote configuration management.

[![npm](https://img.shields.io/npm/v/@flagcontrol/node)](https://www.npmjs.com/package/@flagcontrol/node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @flagcontrol/node
```

## Usage

### 1. Initialize the Client

Initialize the client with your SDK key. You can also define your flag types for full TypeScript support.

```typescript
import { createFlagControlClient } from '@flagcontrol/node';

const client = createFlagControlClient({
  sdkKey: 'YOUR_SDK_KEY',
});

// Wait for the client to initialize (fetch initial flags)
await client.waitForInitialization();
```

### 2. Evaluate Flags

#### Check if a feature is enabled
```typescript
const isEnabled = client.isEnabled('new-checkout-flow');

if (isEnabled) {
  // Show new checkout flow
}
```

#### Get a flag value with a fallback
```typescript
const bannerColor = client.get('hero-banner-color', { userId: '123' }, 'blue');
```

### 3. Context Management

You can set a global context for the client or pass context per evaluation.

#### Set Global Context
This context will be used for all subsequent evaluations.
```typescript
client.setContext({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'pro'
});
```

#### Identify User
Update the current context and trigger a re-evaluation/sync if needed.
```typescript
await client.identify({ userId: 'user-456', plan: 'enterprise' });
```

#### Individual Evaluation Context
Pass context specifically for one evaluation. This merges with (and overrides) global context.
```typescript
client.get('hero-banner-color', { device: 'mobile' }, 'blue');
```

#### Scoped Client
Create a lightweight client instance bound to a specific context.
```typescript
const userClient = client.forContext({ userId: 'user-789' });
const color = userClient.get('hero-banner-color', 'blue');
```

### 4. Real-time Updates

Listen for flag changes to update your application state dynamically.

```typescript
// Listen for changes to a specific flag
const unsubscribe = client.onFlagChange('hero-banner-color', (newValue) => {
  console.log('Banner color changed to:', newValue);
});

// Listen for any flag change
const unsubscribeAll = client.onFlagsChange(() => {
  console.log('Some flags have changed');
});
```

### 5. List Management

Manage targeting lists programmatically.

```typescript
// Create a new list
await client.createList({
  key: 'beta-testers',
  name: 'Beta Testers',
  description: 'Users who opted in for beta features'
});

// Add users to a list
await client.addToList('beta-testers', { key: 'user-123' });

// Remove users from a list
await client.removeFromList('beta-testers', 'user-123');

// Delete a list
await client.deleteList('beta-testers');
```

### 6. Clean Up

Close the client when your application shuts down to stop background polling/streams.

```typescript
client.close();
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

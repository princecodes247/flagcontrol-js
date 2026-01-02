# @flagcontrol/node

The Node.js SDK for Flagcontrol.

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

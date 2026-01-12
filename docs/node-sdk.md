# Node.js SDK

The Node.js SDK is designed for server-side applications. It uses **Local Evaluation** by default.

## Initialization

```typescript
import { createFlagControlClient } from '@flagcontrol/node';

const client = createFlagControlClient({
  sdkKey: process.env.FLAGCONTROL_SDK_KEY,
  // Optional: Custom API URL
  // apiBaseUrl: 'https://api.custom.com',
});
```

## Evaluation

### `get`
Get the value of a flag.

```typescript
const value = client.get('flag-key', { userId: '123' }, 'default-value');
```

### `isEnabled`
Check if a boolean flag is enabled.

```typescript
if (client.isEnabled('new-feature', { userId: '123' })) {
  // ...
}
```

### `evaluate`
Get detailed evaluation result (value, source, reason).

```typescript
const result = client.evaluate('flag-key', { userId: '123' });
console.log(result.value, result.source);
```

## Scoped Clients (`forContext`)

Create a client instance scoped to a specific context (e.g., per-request).

```typescript
const requestClient = client.forContext({ userId: 'user-123', plan: 'pro' });
const isEnabled = requestClient.isEnabled('pro-feature'); // Context is automatically applied
```

## Managing Lists (`addToList`)

Add users to a target list. This is a server-side only operation.

```typescript
await client.addToList('beta-users', [{ key: 'user-123' }]);
```

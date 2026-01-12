# React SDK

The React SDK is designed for client-side applications. It uses **Remote Evaluation** by default.

## Setup

Wrap your application in `FlagProvider`.

```tsx
import { FlagProvider } from '@flagcontrol/react';

const config = { sdkKey: 'YOUR_SDK_KEY' };

function App() {
  return (
    <FlagProvider config={config}>
      <YourApp />
    </FlagProvider>
  );
}
```

### Initial Context

You can pass an initial context to `FlagProvider` to fetch flags for a specific user immediately.

```tsx
<FlagProvider config={config} context={{ userId: 'user-123' }}>
  <YourApp />
</FlagProvider>
```

## Hooks

### `useFlag`
Use this hook to get a flag value. It automatically updates when the flag changes.

```tsx
import { useFlag } from '@flagcontrol/react';

const MyComponent = () => {
  const showFeature = useFlag('new-feature', false);
  
  if (!showFeature) return null;
  return <div>New Feature!</div>;
};
```

### `useFlagControl`
Access the underlying client instance.

```tsx
import { useFlagControl } from '@flagcontrol/react';

const MyComponent = () => {
  const client = useFlagControl();
  
  const handleLogin = async (user) => {
    // Identify the user and refresh flags
    await client.identify({ userId: user.id, email: user.email });
  };
  
  // ...
};
```

## Dynamic Identification

Use `client.identify()` (or update the `context` prop on `FlagProvider`) to switch users or update attributes. This triggers a re-fetch of flags.

```typescript
await client.identify({ userId: 'new-user', plan: 'enterprise' });
```

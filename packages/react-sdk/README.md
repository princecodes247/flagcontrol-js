# @flagcontrol/react

The React SDK for [FlagControl](https://flagcontrol.com) - feature flag and remote configuration management.

[![npm](https://img.shields.io/npm/v/@flagcontrol/react)](https://www.npmjs.com/package/@flagcontrol/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @flagcontrol/react
```

## Usage

### 1. Wrap your app with `FlagProvider`

```tsx
import { FlagProvider } from '@flagcontrol/react';

function App() {
  return (
    <FlagProvider
      config={{
        sdkKey: 'YOUR_SDK_KEY',
      }}
    >
      <YourComponent />
    </FlagProvider>
  );
}
```

### 2. Use flags in your components

```tsx
import { useFlag } from '@flagcontrol/react';

function YourComponent() {
  const isEnabled = useFlag('new-feature', false);

  if (isEnabled) {
    return <div>New Feature Enabled!</div>;
  }

  return <div>Old Feature</div>;
}
```

### 3. Access the client for list operations

```tsx
import { useFlagControl } from '@flagcontrol/react';

function UserComponent() {
  const client = useFlagControl();

  const handleJoinBeta = async () => {
    await client.addToList('beta-users', { key: 'user-123' });
  };

  return <button onClick={handleJoinBeta}>Join Beta</button>;
}
```

## Related Packages

| Package | Description |
|---------|-------------|
| [`@flagcontrol/core`](https://www.npmjs.com/package/@flagcontrol/core) | Core SDK logic |
| [`@flagcontrol/node`](https://www.npmjs.com/package/@flagcontrol/node) | Node.js SDK for server-side |
| [`flagcontrol`](https://www.npmjs.com/package/flagcontrol) | CLI for TypeScript type generation |

## Documentation

For full documentation, visit [flagcontrol.com/docs](https://flagcontrol.com/docs).

## License

MIT

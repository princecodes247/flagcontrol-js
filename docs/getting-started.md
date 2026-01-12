# Getting Started

## Installation

Install the core package and the SDK for your platform.

### Node.js

```bash
npm install @flagcontrol/node @flagcontrol/core
```

### React

```bash
npm install @flagcontrol/react @flagcontrol/core
```

## Quick Start

### Node.js

```typescript
import { createFlagControlClient } from '@flagcontrol/node';

const client = createFlagControlClient({
  sdkKey: 'YOUR_SDK_KEY',
});

await client.waitForInitialization();

const isEnabled = client.isEnabled('new-feature');
```

### React

```tsx
import { FlagProvider, useFlag } from '@flagcontrol/react';

const App = () => (
  <FlagProvider config={{ sdkKey: 'YOUR_SDK_KEY' }}>
    <FeatureComponent />
  </FlagProvider>
);

const FeatureComponent = () => {
  const isEnabled = useFlag('new-feature', false);
  return isEnabled ? <div>New Feature</div> : null;
};
```

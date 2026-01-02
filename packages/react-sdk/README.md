# @flagcontrol/react

The React SDK for Flagcontrol.

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

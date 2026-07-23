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

Wrap your application root with `FlagProvider`. Pass your SDK key in the `config` prop. You can also pass an initial `context` or `initialFlags` for SSR support.

```tsx
import { FlagProvider } from '@flagcontrol/react';

function App() {
  return (
    <FlagProvider
      config={{
        sdkKey: 'YOUR_SDK_KEY',
      }}
      context={{
        userId: 'user-123',
        plan: 'pro'
      }}
    >
      <YourComponent />
    </FlagProvider>
  );
}
```

### 2. Server-Side Rendering (SSR) & Hydration

If you are using a framework like Next.js, TanStack Start, or Remix, you can evaluate flags on the server using `@flagcontrol/node` and pass them to the client to prevent layout shifts.

**Server Component / Loader (Next.js Example)**
```tsx
import { FlagControl } from "@flagcontrol/node";
import { ClientLayout } from "./client-layout";

export default async function Layout({ children }) {
  const nodeClient = new FlagControl({ sdkKey: process.env.FLAGCONTROL_SECRET_KEY });
  const serverFlags = await nodeClient.getAllFlags({ userId: "user-123" });

  return <ClientLayout initialFlags={serverFlags}>{children}</ClientLayout>;
}
```

**Client Component (`client-layout.tsx`)**
```tsx
"use client";
import { FlagProvider } from "@flagcontrol/react";

export function ClientLayout({ initialFlags, children }) {
  return (
    <FlagProvider 
      config={{ sdkKey: process.env.NEXT_PUBLIC_FLAGCONTROL_CLIENT_KEY }} 
      initialFlags={initialFlags}
    >
      {children}
    </FlagProvider>
  );
}
```

### 3. Use flags in your components

Use the `useFlag` hook to evaluate flags. It handles updates automatically when flags change or context is updated.

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

You can also pass a specific context to `useFlag` for per-flag evaluation overrides:

```tsx
const isMobile = useFlag('mobile-feature', false, { device: 'mobile' });
```

### 4. Context Management

You can update the global context dynamically, for example after user login. This triggers a re-fetch of flags.

```tsx
import { useFlagControl } from '@flagcontrol/react';

function LoginButton() {
  const client = useFlagControl();

  const handleLogin = async (user) => {
    await client.identify({
      userId: user.id,
      email: user.email,
      role: user.role
    });
  };

  return <button onClick={() => handleLogin(newUser)}>Login</button>;
}
```

### 5. Real-time Updates

The React SDK automatically subscribes to changes. You don't need to do anything special; `useFlag` hooks will re-render your components when flag definitions change or when you validly call `identify`.

To manually subscribe to changes or force a reload:

```tsx
const client = useFlagControl();

useEffect(() => {
  const unsubscribe = client.subscribe(() => {
    console.log('Flags updated');
  });
  return unsubscribe;
}, [client]);

// Force reload
await client.reload();
```

### 6. List Management

You can manage targeting lists directly from the client if needed (e.g. for admin panels or user opt-ins).

```tsx
import { useFlagControl } from '@flagcontrol/react';

function BetaOptIn() {
  const client = useFlagControl();

  const handleJoinBeta = async () => {
    await client.addToList('beta-users', { key: 'user-123' });
    // Flags will be re-evaluated automatically next time they are fetched or context changes
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

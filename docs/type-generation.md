# Type Generation

FlagControl supports end-to-end type safety for your flags. You can generate TypeScript definitions from your project.

## Setup

1. Install the generator globally or as a dev dependency.

```bash
npm install -D flagcontrol
```

2. Run the generator.

```bash
npx flagcontrol --key YOUR_SDK_KEY --output ./src/flagcontrol.d.ts
```

Or use environment variables:

```bash
export FLAGCONTROL_SDK_KEY=YOUR_SDK_KEY
npx flagcontrol
```

## Usage

Once generated, the SDKs will automatically pick up the types.

```typescript
// The key 'new-feature' is now type-checked!
// The return value is inferred as boolean.
const isEnabled = client.isEnabled('new-feature'); 

// Error: Argument of type '"invalid-flag"' is not assignable...
client.get('invalid-flag'); 
```

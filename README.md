# Flagcontrol SDKs

This monorepo contains the official SDKs and tools for [Flagcontrol](https://flagcontrol.com).

## Packages

| Package | Description | Version |
|Ptr|---|---|
| [`@flagcontrol/core`](./packages/core) | Core logic shared across SDKs | [![npm](https://img.shields.io/npm/v/@flagcontrol/core)](https://www.npmjs.com/package/@flagcontrol/core) |
| [`@flagcontrol/node`](./packages/node-sdk) | Node.js Server-side SDK | [![npm](https://img.shields.io/npm/v/@flagcontrol/node)](https://www.npmjs.com/package/@flagcontrol/node) |
| [`@flagcontrol/react`](./packages/react-sdk) | React Client-side SDK | [![npm](https://img.shields.io/npm/v/@flagcontrol/react)](https://www.npmjs.com/package/@flagcontrol/react) |
| [`@flagcontrol/generator`](./packages/generator) | TypeScript definition generator | [![npm](https://img.shields.io/npm/v/@flagcontrol/generator)](https://www.npmjs.com/package/@flagcontrol/generator) |

## Getting Started

Please refer to the individual package READMEs for installation and usage instructions:

- [Node.js SDK Documentation](./packages/node-sdk/README.md)
- [React SDK Documentation](./packages/react-sdk/README.md)
- [Generator Documentation](./packages/generator/README.md)

## Development

This project is a monorepo managed with npm workspaces.

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/flagcontrol/flagcontrol-sdks.git
   cd flagcontrol-sdks
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build all packages:
   ```bash
   npm run build
   ```

### Running Examples

The `examples` directory contains sample applications using the SDKs.

- **Backend Example**: `examples/backend`
- **Frontend Example**: `examples/frontend`

To run the backend example:
```bash
npm start -w examples/backend
```

To run the frontend example:
```bash
npm run dev -w examples/frontend
```

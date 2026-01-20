# flagcontrol

The CLI tool for [FlagControl](https://flagcontrol.com) to generate TypeScript definitions for your feature flags.

[![npm](https://img.shields.io/npm/v/flagcontrol)](https://www.npmjs.com/package/flagcontrol)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install -D flagcontrol
```

## Usage

Run the generator to fetch your latest flag definitions and generate TypeScript types (`RegisteredFlags`).

```bash
npx flagcontrol generate
```

This will default to generating a file at `./src/flagcontrol.d.ts`.

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Path to the output declaration file | `./src/flagcontrol.d.ts` |
| `--key` | | Your SDK Key (can also set via env) | `process.env.FLAGCONTROL_SDK_KEY` |
| `--apiUrl` | | Base URL for the FlagControl API | `https://api.flagcontrol.com` |

### Examples

**Specify output file:**
```bash
npx flagcontrol generate -o ./src/types/feature-flags.d.ts
```

**Pass SDK key inline:**
```bash
npx flagcontrol generate --key YOUR_SDK_KEY
```

## Configuration

The recommended way to configure the generator is via environment variables, especially for CI/CD pipelines.

- `FLAGCONTROL_SDK_KEY`: Your SDK Key.
- `FLAGCONTROL_API_URL`: (Optional) Base API URL if using a self-hosted instance.

## Related Packages

| Package | Description |
|---------|-------------|
| [`@flagcontrol/core`](https://www.npmjs.com/package/@flagcontrol/core) | Core SDK logic |
| [`@flagcontrol/react`](https://www.npmjs.com/package/@flagcontrol/react) | React SDK with hooks |
| [`@flagcontrol/node`](https://www.npmjs.com/package/@flagcontrol/node) | Node.js SDK |

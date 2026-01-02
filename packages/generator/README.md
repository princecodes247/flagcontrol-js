# @flagcontrol/generator

Code generator for Flagcontrol types.

## Installation

```bash
npm install -D @flagcontrol/generator
```

## Usage

Run the generator to fetch your flags and generate TypeScript definitions.

```bash
npx flagcontrol generate
```

### Options

- `-o`, `--output`: Specify the output path for the generated declaration file.

```bash
npx flagcontrol generate -o ./src/types/flagcontrol.d.ts
```

## Environment Variables

The generator requires the following environment variables:

- `FLAGCONTROL_SDK_KEY`: Your SDK Key.

# Best Practices

## Flag Naming
- Use **kebab-case** for flag keys (e.g., `new-checkout-flow`, `enable-dark-mode`).
- Use descriptive names that indicate the flag's purpose.
- Prefix temporary flags (e.g., `temp-`, `release-`).

## Security
- **Never expose your SDK Key** in client-side code (React), unless it is a specific **Client-side SDK Key** (if supported).
- Use **Remote Evaluation** for client-side apps to keep rules and lists private.
- Rotate SDK keys periodically.

## Performance
- **Initialize once**: Create the client instance once and reuse it (or use the Provider).
- **Use Local Evaluation** on the server for minimal latency.
- **Context Attributes**: Only send necessary attributes in the context to keep payloads small.

## Cleanup
- Remove flags from code and FlagControl dashboard once they are no longer needed (e.g., after a feature is fully rolled out).
- Use the **Type Generator** to identify usage of deleted flags (TypeScript will error on missing keys).

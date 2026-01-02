import { Flag } from "../types";

/**
 * Helper to define flags with type safety and inference.
 * This allows you to use `defineFlags([...])` instead of `[...] as const`.
 */
export function defineFlags<const T extends readonly Flag[]>(flags: T): T {
  return flags;
}

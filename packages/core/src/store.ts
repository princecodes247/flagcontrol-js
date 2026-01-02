import type { Flag } from "./types";

export type FlagStore = {
  get: (key: string) => Flag | undefined;
  getAll: () => Flag[];
  set: (flags: readonly Flag[]) => void;
  replace: (flags: readonly Flag[]) => void;
};

export const createStore = (initialFlags: readonly Flag[] = []): FlagStore => {
  let flags = new Map(initialFlags.map((f) => [f.key, f]));

  return {
    get: (key: string) => flags.get(key),
    getAll: () => Array.from(flags.values()),
    replace: (newFlags: readonly Flag[]) => {
      flags = new Map(newFlags.map((f) => [f.key, f]));
    },
    set: (newFlags: readonly Flag[]) => {
      for (const flag of newFlags) {
        flags.set(flag.key, flag);
      }
    },
  };
};

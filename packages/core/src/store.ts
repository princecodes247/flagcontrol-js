import type { EvaluationContext, Flag } from "./types";

export type FlagStore = {
  get: (key: string) => Flag | undefined;
  getAll: () => Flag[];
  set: (flags: readonly Flag[]) => void;
  replace: (flags: readonly Flag[]) => void;
  context: {
    get: () => EvaluationContext;
    set: (context: EvaluationContext) => void;
  };
  lists: {
    get: (key: string) => string[] | undefined;
    setAll: (lists: { key: string; members: string[] }[]) => void;
  };
  salt: {
    get: () => string | undefined;
    set: (salt: string) => void;
  };
};

export const createStore = (initialFlags: readonly Flag[] = []): FlagStore => {
  let flags = new Map(initialFlags.map((f) => [f.key, f]));
  let context: EvaluationContext = {};
  let listMap = new Map<string, string[]>();
  let projectSalt: string | undefined;

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
    context: {
      get: () => context,
      set: (newContext: EvaluationContext) => {
        context = newContext;
      },
    },
    lists: {
      get: (key: string) => listMap.get(key),
      setAll: (lists: { key: string; members: string[] }[]) => {
        listMap = new Map(lists.map((l) => [l.key, l.members]));
      },
    },
    salt: {
      get: () => projectSalt,
      set: (salt: string) => {
        projectSalt = salt;
      },
    },
  };
};

import type { EvaluationContext, Flag } from "./types";

export type ListData = { key: string; salt: string; members: string[] };

export type FlagStore = {
  get: (key: string) => Flag | undefined;
  getAll: () => Flag[];
  set: (flags: readonly Flag[]) => void;
  replace: (flags: readonly Flag[]) => void;
  delete: (key: string) => void;
  context: {
    get: () => EvaluationContext;
    set: (context: EvaluationContext) => void;
  };
  cursor: {
    get: () => string | null;
    set: (cursor: string) => void;
  };
  lists: {
    // Read operations
    get: (key: string) => string[] | undefined;
    getAll: () => ListData[];
    getSalt: (key: string) => string | undefined;
    
    // Write operations
    replace: (lists: ListData[]) => void;
    create: (list: ListData) => void;
    delete: (key: string) => void;
    add: (key: string, members: string[]) => void;
    remove: (key: string, members: string[]) => void;
  };
};

export const createStore = (initialFlags: readonly Flag[] = []): FlagStore => {
  let flags = new Map(initialFlags.map((f) => [f.key, f]));
  let context: EvaluationContext = {};
  let cursor: string | null = null;
  let listMap = new Map<string, { salt: string; members: string[] }>();

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
    delete: (key: string) => {
      flags.delete(key);
    },
    context: {
      get: () => context,
      set: (newContext: EvaluationContext) => {
        context = newContext;
      },
    },
    cursor: {
      get: () => cursor,
      set: (newCursor: string) => {
        cursor = newCursor;
      },
    },
    lists: {
      // Read operations
      get: (key: string) => listMap.get(key)?.members,
      getAll: () =>
        Array.from(listMap.entries()).map(([key, data]) => ({
          key,
          salt: data.salt,
          members: data.members,
        })),
      getSalt: (key: string) => listMap.get(key)?.salt,

      // Write operations
      replace: (lists: ListData[]) => {
        listMap = new Map(lists.map((l) => [l.key, { salt: l.salt, members: l.members }]));
      },
      create: (list: ListData) => {
        listMap.set(list.key, { salt: list.salt, members: list.members });
      },
      delete: (key: string) => {
        listMap.delete(key);
      },
      add: (key: string, members: string[]) => {
        const existing = listMap.get(key);
        if (existing) {
          const memberSet = new Set(existing.members);
          for (const member of members) {
            memberSet.add(member);
          }
          existing.members = Array.from(memberSet);
        }
      },
      remove: (key: string, members: string[]) => {
        const existing = listMap.get(key);
        if (existing) {
          const toRemove = new Set(members);
          existing.members = existing.members.filter((m) => !toRemove.has(m));
        }
      },
    },
  };
};

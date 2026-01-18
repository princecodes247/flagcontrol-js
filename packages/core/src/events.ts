import type { Flag, FlagControlConfig, Change } from "./types";
import type { Loader } from "./loader";
import type { FlagStore } from "./store";

export type EventManager = {
  start: () => void;
  stop: () => void;
  /** Manually sync changes from the server */
  syncChanges: () => Promise<void>;
};

/**
 * Apply a list of changes to the store.
 * Returns true if any changes were applied.
 */
const applyChanges = (store: FlagStore, changes: Change[]): boolean => {
  if (changes.length === 0) return false;

  for (const change of changes) {
    switch (change.type) {
      case 'flag.updated':
        // Convert FlagManifest to Flag and update store
        store.set([change.data as unknown as Flag]);
        break;
      case 'flag.deleted':
        store.delete(change.flagKey);
        break;
      case 'list.updated':
        // Replace or create the list with new data
        store.lists.create(change.data);
        break;
      case 'list.deleted':
        store.lists.delete(change.listKey);
        break;
    }
  }

  return true;
};

export const createEventManager = (
  config: FlagControlConfig,
  loader: Loader,
  store: FlagStore
): EventManager => {
  let pollingController: AbortController | null = null;
  let eventSource: any | null = null;
  let isClosed = false;
  let pollingTimer: ReturnType<typeof setTimeout> | number | null = null;

  const stopPolling = () => {
    if (pollingController) {
      pollingController.abort();
      pollingController = null;
    }
    if (pollingTimer) {
      clearTimeout(pollingTimer);
      pollingTimer = null;
    }
  };

  const stopSSE = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  /**
   * Fetch and apply changes from the server.
   * Uses incremental changes if cursor exists, otherwise does a full fetch.
   */
  const syncChanges = async (signal?: AbortSignal): Promise<void> => {
    const currentCursor = store.cursor.get();

    if (currentCursor && config.evaluationMode !== 'remote') {
      // Incremental update using changes API
      let cursor = currentCursor;
      let hasMore = true;

      while (hasMore && !signal?.aborted) {
        const response = await loader.getChanges(cursor, signal);
        
        if (signal?.aborted) return;

        const hasChanges = applyChanges(store, response.changes);
        store.cursor.set(response.cursor);
        cursor = response.cursor;
        hasMore = response.hasMore;

        if (hasChanges) {
          config.onFlagsUpdated?.();
        }
      }
    } else {
      // Full fetch (initial load or remote mode)
      let flags: Flag[] = [];
      
      if (config.evaluationMode === 'remote') {
        flags = await loader.getFlags(store.context.get(), signal);
      } else {
        const definitions = await loader.getFlagDefinitions(signal);
        store.lists.replace(definitions.lists);
        store.cursor.set(definitions.cursor);
        flags = definitions.flags.map(f => ({
          ...f,
        } as unknown as Flag));
      }

      if (!signal?.aborted) {
        store.set(flags);
        config.onFlagsUpdated?.();
      }
    }
  };

  const startPolling = () => {
    stopPolling();
    if (isClosed) return;

    const interval = config.pollingIntervalMs ?? 60000;
    if (interval <= 0) return;

    pollingController = new AbortController();
    const signal = pollingController.signal;

    const poll = async () => {
      if (signal.aborted) return;

      try {
        await syncChanges(signal);
      } catch (error) {
        if (!signal.aborted) {
          config.onError?.(error as Error);
        }
      }

      if (!signal.aborted) {
        pollingTimer = setTimeout(poll, interval);
      }
    };

    // Initial poll immediately
    poll();
  };

  const startSSE = () => {
    stopSSE();
    if (isClosed) return;

    const EventSourceCtor = config.eventSource || (globalThis as any).EventSource;

    // If SSE is disabled or not available, fallback to polling
    if (!EventSourceCtor || config.disableSSE) {
      startPolling();
      return;
    }

    try {
      const baseUrl = config.apiBaseUrl || "https://api.flagcontrol.com/v1";
      const currentCursor = store.cursor.get();
      // Append sdkKey and cursor to query params
      let url = `${baseUrl}/sdk/changes/stream?sdkKey=${config.sdkKey}`;
      if (currentCursor) {
        url += `&since=${encodeURIComponent(currentCursor)}`;
      }

      // Attempt to pass headers for Node.js libraries that support it
      const initDict = {
        headers: {
          "X-FlagControl-SDK-Key": config.sdkKey
        }
      };

      eventSource = new EventSourceCtor(url, initDict);

      eventSource.onopen = () => {
        // Connection established
      };

      eventSource.onmessage = (event: any) => {
        if (isClosed) return;
        try {
          const data = JSON.parse(event.data);
          
          // Handle change events from stream
          if (data.cursor && Array.isArray(data.changes)) {
            const hasChanges = applyChanges(store, data.changes as Change[]);
            store.cursor.set(data.cursor);
            if (hasChanges) {
              config.onFlagsUpdated?.();
            }
          } else if (data && Array.isArray(data.flags)) {
            // Legacy full flags response
            store.set(data.flags as Flag[]);
            config.onFlagsUpdated?.();
          }
        } catch (err) {
          config.onError?.(err as Error);
        }
      };

      eventSource.onerror = (err: any) => {
        if (isClosed) return;
        // On error, close SSE and fallback to polling
        config.onError?.(new Error("SSE connection error, falling back to polling"));
        stopSSE();
        startPolling();
      };

    } catch (err) {
      if (isClosed) return;
      config.onError?.(err as Error);
      startPolling();
    }
  };

  const start = () => {
    isClosed = false;
    // Try SSE first
    startSSE();
  };

  const stop = () => {
    isClosed = true;
    stopPolling();
    stopSSE();
  };

  return {
    start,
    stop,
    syncChanges: () => syncChanges(),
  };
};

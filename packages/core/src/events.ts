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
 * Returns 'resync' if a full resync is required, true if changes were applied, false otherwise.
 */
const applyChanges = (store: FlagStore, changes: Change[]): boolean | 'resync' => {
  if (changes.length === 0) return false;

  for (const change of changes) {
    switch (change.type) {
      case 'flag.created':
      case 'flag.updated':
        // Convert FlagManifest to Flag and upsert in store
        store.set([change.data as unknown as Flag]);
        break;
      case 'flag.deleted':
      case 'flag.archived':
        // Both deleted and archived flags should be removed from the store
        store.delete(change.flagKey);
        break;
      case 'list.created':
      case 'list.updated':
        // Upsert the list with new data
        store.lists.create(change.data);
        break;
      case 'list.deleted':
        store.lists.delete(change.listKey);
        break;
      case 'resync.required':
        // Signal that a full resync is needed
        return 'resync';
    }
  }

  return true;
};

/**
 * Parse SSE messages from a text chunk.
 * SSE format: "data: <json>\n\n"
 */
const parseSSEMessages = (buffer: string): { messages: string[]; remaining: string } => {
  const messages: string[] = [];
  const lines = buffer.split('\n');
  let remaining = '';
  let currentData = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('data:')) {
      // Extract data after "data:" (with optional space)
      currentData += line.slice(line.charAt(5) === ' ' ? 6 : 5);
    } else if (line === '' && currentData) {
      // Empty line signals end of message
      messages.push(currentData);
      currentData = '';
    } else if (i === lines.length - 1 && line !== '') {
      // Last line might be incomplete
      remaining = line;
    }
  }

  // If we have partial data, put it back in the buffer
  if (currentData) {
    remaining = `data:${currentData}${remaining ? '\n' + remaining : ''}`;
  }

  return { messages, remaining };
};

export const createEventManager = (
  config: FlagControlConfig,
  loader: Loader,
  store: FlagStore
): EventManager => {
  let pollingController: AbortController | null = null;
  let streamController: AbortController | null = null;
  let isClosed = false;
  let pollingTimer: ReturnType<typeof setTimeout> | number | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | number | null = null;

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

  const stopStream = () => {
    if (streamController) {
      streamController.abort();
      streamController = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  /**
   * Perform a full resync by fetching all definitions.
   */
  const performFullResync = async (signal?: AbortSignal): Promise<void> => {
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
      store.replace(flags);
      config.onFlagsUpdated?.();
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

        const result = applyChanges(store, response.changes);
        
        // If resync is required, do a full fetch and exit
        if (result === 'resync') {
          await performFullResync(signal);
          return;
        }

        store.cursor.set(response.cursor);
        cursor = response.cursor;
        hasMore = response.hasMore;

        if (result) {
          config.onFlagsUpdated?.();
        }
      }
    } else {
      // Full fetch (initial load or remote mode)
      await performFullResync(signal);
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

  /**
   * Start streaming using fetch with ReadableStream.
   */
  const startStream = async () => {
    stopStream();
    if (isClosed) return;

    // If streaming is disabled, fallback to polling
    if (config.disableStreaming) {
      startPolling();
      return;
    }

    const fetchImpl = config.fetch || globalThis.fetch;

    // If fetch is not available, fallback to polling
    if (!fetchImpl) {
      startPolling();
      return;
    }

    streamController = new AbortController();
    const signal = streamController.signal;

    try {
      const baseUrl = config.apiBaseUrl || "https://api.flagcontrol.com/v1";
      const currentCursor = store.cursor.get();
      
      let url = `${baseUrl}/sdk/changes/stream`;
      const params = new URLSearchParams({ sdkKey: config.sdkKey });
      if (currentCursor) {
        params.set('since', currentCursor);
      }
      url += `?${params.toString()}`;

      const response = await fetchImpl(url, {
        method: 'GET',
        headers: {
          'X-FlagControl-SDK-Key': config.sdkKey,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Stream connection failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // Read the stream
      while (!signal.aborted) {
        const { done, value } = await reader.read();

        if (done) {
          // Stream ended, attempt to reconnect after a delay
          if (!isClosed && !signal.aborted) {
            reconnectTimer = setTimeout(() => startStream(), 1000);
          }
          break;
        }

        // Decode and buffer the chunk
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE messages from buffer
        const { messages, remaining } = parseSSEMessages(buffer);
        buffer = remaining;
        console.log({messages})

        // Process each message
        for (const message of messages) {
          if (isClosed || signal.aborted) break;

          try {
            const data = JSON.parse(message);

            // Handle change events from stream
            if (data.cursor && Array.isArray(data.changes)) {
              const result = applyChanges(store, data.changes as Change[]);
              
              // If resync is required, do a full fetch
              if (result === 'resync') {
                await performFullResync(signal);
              } else {
                store.cursor.set(data.cursor);
                if (result) {
                  config.onFlagsUpdated?.();
                }
              }
            } else if (data && Array.isArray(data.flags)) {
              // Legacy full flags response
              store.set(data.flags as Flag[]);
              config.onFlagsUpdated?.();
            }
          } catch (err) {
            config.onError?.(err as Error);
          }
        }
      }
    } catch (error) {
      if (isClosed || signal.aborted) return;

      // On error, fallback to polling
      config.onError?.(new Error(`Stream error, falling back to polling: ${(error as Error).message}`));
      stopStream();
      startPolling();
    }
  };

  const start = () => {
    isClosed = false;
    startStream();
  };

  const stop = () => {
    isClosed = true;
    stopPolling();
    stopStream();
  };

  return {
    start,
    stop,
    syncChanges: () => syncChanges(),
  };
};

import type { Flag, FlagControlConfig } from "./types";
import type { Loader } from "./loader";
import type { FlagStore } from "./store";

export type EventManager = {
  start: () => void;
  stop: () => void;
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
        const flags = await loader.getFlags(signal);
        if (!signal.aborted) {
          store.set(flags);
          config.onFlagsUpdated?.();
        }
      } catch (error) {
        if (!signal.aborted) {
          config.onError?.(error as Error);
        }
      }

      if (!signal.aborted) {
        pollingTimer = setTimeout(poll, interval);
      }
    };

    // Initial poll immediately? 
    // Usually if we fallback to polling, we might want to poll immediately or wait for interval?
    // If we just failed SSE, maybe we want to fetch immediately to be sure we are up to date.
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
      // Append sdkKey to query param for browser support
      const url = `${baseUrl}/flags/stream?sdkKey=${config.sdkKey}`;

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
          if (data && Array.isArray(data.flags)) {
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
        // We might want to log the error
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
  };
};

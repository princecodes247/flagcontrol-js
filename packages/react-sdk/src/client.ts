import {
  Evaluator,
  createEventManager,
  createLoader,
  createStore,
  createTelemetryManager,
  type EvaluationContext,
  type Flag,
  type FlagControlConfig,
  type RegisteredFlags
} from "@flagcontrol/core";


export type FlagControlClient<
  F extends Record<string, any> = RegisteredFlags,
> = {
  get: <K extends keyof F & string>(
    key: K,
    context?: EvaluationContext,
    fallbackValue?: F[K]
  ) => F[K] | undefined;
  reload: () => Promise<void>;
  isEnabled: (key: string, context?: EvaluationContext) => boolean;
  waitForInitialization: () => Promise<void>;
  close: () => void;
  subscribe: (listener: () => void) => () => void;
};

export const initFlagControl = <
  F extends Record<string, any> = RegisteredFlags,
>(
  config: FlagControlConfig,
  offlineFlags: readonly Flag[] = []
): FlagControlClient<F> => {
  const store = createStore(offlineFlags);
  const loader = createLoader(config);
  const events = createEventManager(config, loader, store);
  const telemetry = createTelemetryManager(config);
  const evaluator = new Evaluator();
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const notifyListeners = () => {
    listeners.forEach((listener) => listener());
  };

  // Initial load
  const initPromise = (async () => {
    try {
      const flags = await loader.getFlags();
      store.set(flags);
      status = 'ready';
      config.onFlagsUpdated?.();
      notifyListeners();
    } catch (error) {
      status = 'error';
      config.onError?.(error as Error);
    } finally {
      events.start();
      telemetry.start();
    }
  })();

  const waitForInitialization = () => initPromise;


  const internalEvaluate = (
    key: string,
    context: EvaluationContext,
    callsiteFallback?: any
  ) => {
    const flag = store.get(key);

    // Determine the result
    let result: any;
    let source: 'remote' | 'fallback' | 'default' = 'remote';

    if (!flag) {
      result = callsiteFallback;
      source = 'fallback';
    } else {
      try {
        result = evaluator.evaluate(flag, context) ?? flag.defaultValue ?? callsiteFallback;
      } catch (error) {
        config.onError?.(error as Error);
        result = flag.defaultValue ?? callsiteFallback;
        source = 'default';
      }
    }

    telemetry.record({
      flagKey: key,
      value: result,
      timestamp: Date.now(),
      metadata: { source, sdkStatus: status }
    });

    return result;
  };

  const reload = async (): Promise<void> => {
    try {
      const flags = await loader.getFlags();
      store.set(flags);
      config.onFlagsUpdated?.();
      notifyListeners();
    } catch (error) {
      config.onError?.(error as Error);
      throw error;
    }
  };

  return {
    get: (key, context = {}, fallback) =>
      internalEvaluate(key as string, context, fallback),
    reload,
    isEnabled: (key, context = {}) =>
      internalEvaluate(key, context, false) === true,
    waitForInitialization,
    close: async () => {
      events.stop();
      await telemetry.stop();
    },
    subscribe,
  };
};


/**
 * Creates a new FlagControl client for React applications.
 *
 * @param config - The configuration for the SDK, including the SDK key.
 * @param offlineFlags - Optional list of flags to use in offline mode.
 * @returns A FlagControlClient instance.
 */
export function createFlagControlClient<
  F extends Record<string, any> = RegisteredFlags,
>(config: FlagControlConfig, offlineFlags: readonly Flag[] = []): FlagControlClient<F> {
  const client = initFlagControl(config, offlineFlags);
  return client as any as FlagControlClient<F>
}

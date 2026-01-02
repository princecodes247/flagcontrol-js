import {
  AnyFlags,
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

export type ClientStatus = 'loading' | 'ready' | 'error';

export type EvaluationResult<T> = {
  value: T | undefined;
  source: "remote" | "default" | "fallback";
  reason?: string;
};

export type FlagChangeHandler<T = any> = (value: T | undefined) => void;


export type FlagControlClient<
  F extends Record<string, any> = RegisteredFlags,
> = {
  get: <K extends keyof F & string>(
    key: K,
    context?: EvaluationContext,
    fallbackValue?: F[K]
  ) => F[K] | undefined;
  isEnabled: <K extends keyof F & string>(key: K, context?: EvaluationContext) => boolean;

  evaluate: <K extends keyof F & string>(
    key: K,
    context?: EvaluationContext,
    fallbackValue?: F[K]
  ) => EvaluationResult<F[K]>;

  reload: () => Promise<void>;
  waitForInitialization: () => Promise<void>;
  close: () => void;
  status: () => ClientStatus;

  onFlagChange: <K extends keyof F & string>(
    key: K,
    handler: FlagChangeHandler<F[K]>
  ) => () => void;
  onFlagsChange: (handler: () => void) => () => void;


  setContext: (context: EvaluationContext) => void;
  clearContext: () => void;
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

  let status: ClientStatus = 'loading';
  let globalContext: EvaluationContext = {};

  const flagListeners = new Map<string, Set<FlagChangeHandler>>();
  const globalListeners = new Set<() => void>();

  // Initial load
  const initPromise = (async () => {
    try {
      const flags = await loader.getFlags();
      store.set(flags);
      status = 'ready';
      config.onFlagsUpdated?.();
    } catch (error) {
      status = 'error';
      config.onError?.(error as Error);
    } finally {
      // events.start(() => {
      //   notifyAll();
      // });
      events.start()
      telemetry.start();
    }
  })();

  const waitForInitialization = () => initPromise;

  const notifyAll = () => {
    globalListeners.forEach((fn) => fn());

    for (const [key, handlers] of flagListeners.entries()) {
      const value = internalEvaluate(key, globalContext).value;
      handlers.forEach((h) => h(value));
    }
  };

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

  const evaluate = <K extends keyof F & string>(
    key: K,
    context: EvaluationContext = {},
    fallback?: F[K]
  ): EvaluationResult<F[K]> => {
    const result = internalEvaluate(
      key,
      { ...globalContext, ...context },
      fallback
    );

    if (status === "ready") {
      telemetry.record({
        flagKey: key,
        value: result.value,
        timestamp: Date.now(),
        metadata: {
          source: result.source,
          sdkStatus: status,
        },
      });
    }

    return result;
  };

  const reload = async (): Promise<void> => {
    status = 'loading'
    try {
      const flags = await loader.getFlags();
      store.set(flags);
      config.onFlagsUpdated?.();
      status = 'ready'
    } catch (error) {
      config.onError?.(error as Error);
      status = 'error'
    }
  };

  return {
    get: (key, context = {}, fallback) =>
      evaluate(key, context, fallback).value,
    isEnabled: (key, context = {}) =>
      internalEvaluate(key, context, false).value === true,
    evaluate,

    reload,
    waitForInitialization,
    close: async () => {
      events.stop();
      await telemetry.stop();
    },
    status: () => status,

    setContext: (ctx) => {
      globalContext = ctx;
    },
    clearContext: () => {
      globalContext = {};
    },

    onFlagChange: (key, handler) => {
      if (!flagListeners.has(key)) {
        flagListeners.set(key, new Set());
      }
      flagListeners.get(key)!.add(handler);

      return () => {
        flagListeners.get(key)?.delete(handler);
      };
    },
    onFlagsChange: (handler) => {
      globalListeners.add(handler);
      return () => globalListeners.delete(handler);
    },

  };
};


/**
 * Creates a new FlagControl client.
 *
 * @param config - The configuration for the SDK, including the SDK key.
 * @param offlineFlags - Optional list of flags to use in offline mode.
 * @returns A FlagControlClient instance.
 */
export function createFlagControlClient<
  F extends AnyFlags = RegisteredFlags,
>(config: FlagControlConfig, offlineFlags: readonly Flag[] = []): FlagControlClient<F> {
  const client = initFlagControl(config, offlineFlags);
  return client as FlagControlClient<F>
}

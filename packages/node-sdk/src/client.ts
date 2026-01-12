import {
  AnyFlags,
  createBaseClient,
  type BaseClient,
  type ClientStatus,
  type EvaluationContext,
  type EvaluationResult,
  type Flag,
  type FlagControlConfig,
  type RegisteredFlags,
} from "@flagcontrol/core";

export type { ClientStatus, EvaluationResult };

export type FlagChangeHandler<T = any> = (value: T | undefined) => void;

export type ScopedFlagControlClient<
  F extends Record<string, any> = RegisteredFlags,
> = {
  get: <K extends keyof F & string>(
    key: K,
    fallbackValue?: F[K]
  ) => F[K] | undefined;
  isEnabled: <K extends keyof F & string>(key: K) => boolean;
  evaluate: <K extends keyof F & string>(
    key: K,
    fallbackValue?: F[K]
  ) => EvaluationResult<F[K]>;
};

export type FlagControlClient<
  F extends Record<string, any> = RegisteredFlags,
> = Omit<BaseClient<F>,
  "_internalEvaluate"
  | "_events"
  | "_telemetry"
  | "_store"
  | "_loader"
  | "_config"
> & {
  evaluate: <K extends keyof F & string>(
    key: K,
    context?: EvaluationContext,
    fallbackValue?: F[K]
  ) => EvaluationResult<F[K]>;

  forContext: (context: EvaluationContext) => ScopedFlagControlClient<F>;

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
  const baseClient = createBaseClient<F>({ ...config, evaluationMode: config.evaluationMode ?? 'local' }, offlineFlags);


  const flagListeners = new Map<string, Set<FlagChangeHandler>>();
  const globalListeners = new Set<() => void>();

  const notifyAll = () => {
    globalListeners.forEach((fn) => fn());

    for (const [key, handlers] of flagListeners.entries()) {
      const value = baseClient._internalEvaluate(key, baseClient._store.context.get()).value;
      handlers.forEach((h) => h(value));
    }
  };

  // Hook into base client events if possible, or just rely on manual reload/updates
  // Since BaseClient doesn't expose event hooks directly, we might need to wrap reload
  // or rely on config callbacks if we want to trigger listeners.
  // For now, let's wrap reload.

  const originalReload = baseClient.reload;
  const reload = async () => {
    await originalReload();
    notifyAll();
  };

  /**
   * Evaluates a feature flag and returns detailed information about the result.
   * @param key - The key of the flag to evaluate.
   * @param context - Optional context for evaluation.
   * @param fallback - Optional fallback value if evaluation fails.
  */
  const evaluate = <K extends keyof F & string>(
    key: K,
    context: EvaluationContext = {},
    fallback?: F[K]
  ): EvaluationResult<F[K]> => {
    const result = baseClient._internalEvaluate(
      key,
      { ...baseClient._store.context.get(), ...context },
      fallback
    );

    if (baseClient.status() === "ready") {
      baseClient._telemetry.record({
        flagKey: key,
        value: result.value,
        timestamp: Date.now(),
        metadata: {
          source: result.source,
          sdkStatus: baseClient.status(),
        },
      });
    }

    return result as EvaluationResult<F[K]>;
  };

  return {
    close: baseClient.close,
    status: baseClient.status,
    waitForInitialization: baseClient.waitForInitialization,
    evaluate,
    reload,
    identify: async (context: EvaluationContext) => {
      baseClient._store.context.set(context);
      await baseClient.identify(context);
      notifyAll();
    },
    forContext: (context: EvaluationContext): ScopedFlagControlClient<F> => {
      // Merge with global context, but specific context takes precedence
      const scopedContext = { ...baseClient._store.context.get(), ...context };
      return {
        get: (key, fallback) => evaluate(key, scopedContext, fallback).value,
        isEnabled: (key) =>
          evaluate(key, scopedContext, false as any).value === true,
        evaluate: (key, fallback) => evaluate(key, scopedContext, fallback),
      };
    },
    addToList: baseClient.addToList,
    get: (key, context = {}, fallback) =>
      evaluate(key, context, fallback).value,
    isEnabled: (key, context = {}) =>
      evaluate(key, context, false as any).value === true,

    setContext: (ctx) => {
      baseClient._store.context.set(ctx);
    },
    clearContext: () => {
      baseClient._store.context.set({});
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
>(
  config: FlagControlConfig,
  offlineFlags: readonly Flag[] = []
): FlagControlClient<F> {
  const client = initFlagControl(config, offlineFlags);
  return client as FlagControlClient<F>;
}

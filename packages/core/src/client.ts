import {
    Evaluator,
    createEventManager,
    createLoader,
    createStore,
    createTelemetryManager,
    type EvaluationContext,
    type Flag,
    type FlagControlConfig,
    type RegisteredFlags,
} from "./index";

export type ClientStatus = "loading" | "ready" | "error";

export type EvaluationResult<T> = {
    value: T | undefined;
    source: "remote" | "default" | "fallback";
    reason?: string;
};

export type BaseClient<F extends Record<string, any> = RegisteredFlags> = {
    get: <K extends keyof F & string>(
        key: K,
        context?: EvaluationContext,
        fallbackValue?: F[K]
    ) => F[K] | undefined;
    reload: () => Promise<void>;
    isEnabled: <K extends keyof F & string>(
        key: K,
        context?: EvaluationContext
    ) => boolean;
    waitForInitialization: () => Promise<void>;
    close: () => Promise<void>;
    status: () => ClientStatus;
    // Internal methods exposed for extension
    _internalEvaluate: (
        key: string,
        context: EvaluationContext,
        callsiteFallback?: any
    ) => { value: any; source: "remote" | "default" | "fallback" };
    _events: ReturnType<typeof createEventManager>;
    _telemetry: ReturnType<typeof createTelemetryManager>;
    _store: ReturnType<typeof createStore>;
    _loader: ReturnType<typeof createLoader>;
    _config: FlagControlConfig;
};

export const createBaseClient = <
    F extends Record<string, any> = RegisteredFlags,
>(
    config: FlagControlConfig,
    offlineFlags: readonly Flag[] = []
): BaseClient<F> => {
    const store = createStore(offlineFlags);
    const loader = createLoader(config);
    const events = createEventManager(config, loader, store);
    const telemetry = createTelemetryManager(config);
    const evaluator = new Evaluator();

    let status: ClientStatus = "loading";

    // Initial load
    const initPromise = (async () => {
        try {
            const flags = await loader.getFlags();
            store.set(flags);
            status = "ready";
            config.onFlagsUpdated?.();
        } catch (error) {
            status = "error";
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
        let source: "remote" | "fallback" | "default" = "remote";

        if (!flag) {
            result = callsiteFallback;
            source = "fallback";
        } else {
            try {
                result =
                    evaluator.evaluate(flag, context) ??
                    flag.defaultValue ??
                    callsiteFallback;
            } catch (error) {
                config.onError?.(error as Error);
                result = flag.defaultValue ?? callsiteFallback;
                source = "default";
            }
        }

        telemetry.record({
            flagKey: key,
            value: result,
            timestamp: Date.now(),
            metadata: { source, sdkStatus: status },
        });

        return { value: result, source };
    };

    const reload = async (): Promise<void> => {
        status = "loading";
        try {
            const flags = await loader.getFlags();
            store.set(flags);
            config.onFlagsUpdated?.();
            status = "ready";
        } catch (error) {
            config.onError?.(error as Error);
            status = "error";
            throw error;
        }
    };

    return {
        get: (key, context = {}, fallback) =>
            internalEvaluate(key as string, context, fallback).value,
        isEnabled: (key, context = {}) =>
            internalEvaluate(key, context, false).value === true,
        reload,
        waitForInitialization,
        close: async () => {
            events.stop();
            await telemetry.stop();
        },
        status: () => status,
        _internalEvaluate: internalEvaluate,
        _events: events,
        _telemetry: telemetry,
        _store: store,
        _loader: loader,
        _config: config,
    };
};

import {
    Evaluator,
    ListKeys,
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
    identify: (context: EvaluationContext) => Promise<void>;
    addToList: (
        listKey: ListKeys,
        users:
            | { key: string;[attrs: string]: any }
            | Array<{ key: string;[attrs: string]: any }>
    ) => Promise<any>;
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
    offlineFlags: readonly Flag[] = [],
    initialContext?: EvaluationContext
): BaseClient<F> => {
    const store = createStore(offlineFlags);
    if (initialContext) {
        store.context.set(initialContext);
    }
    const loader = createLoader(config);
    const events = createEventManager(config, loader, store);
    const telemetry = createTelemetryManager(config);
    const evaluator = new Evaluator(store);

    let status: ClientStatus = "loading";

    const fetchFlags = async (context?: EvaluationContext): Promise<Flag[]> => {
        if (config.evaluationMode === 'remote') {
            return loader.getFlags(context);
        } else {
            const definitions = await loader.getFlagDefinitions();
            store.lists.setAll(definitions.lists);
            store.salt.set(definitions.salt);
            return definitions.flags.map(f => ({
                ...f,
            } as unknown as Flag));
        }
    };

    // Initial load
    const initPromise = (async () => {
        try {
            const flags = await fetchFlags(initialContext);

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
                if (config.evaluationMode === 'remote') {
                    // In remote mode, the flag value is already evaluated
                    result = flag.value ?? flag.defaultValue ?? callsiteFallback;
                } else {
                    // In local mode, evaluate using the evaluator
                    result =
                        evaluator.evaluate(flag, context) ??
                        flag.defaultValue ??
                        callsiteFallback;
                }
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

    const identify = async (context: EvaluationContext): Promise<void> => {
        await waitForInitialization();
        store.context.set(context);

        if (config.evaluationMode === 'remote') {
            status = "loading";
            try {
                const flags = await fetchFlags(context);
                store.set(flags);
                config.onFlagsUpdated?.();
                status = "ready";
            } catch (error) {
                config.onError?.(error as Error);
                status = "error";
                throw error;
            }
        } else {
            // Local mode: just notify, context is already set
            config.onFlagsUpdated?.();
        }
    };

    const reload = async (): Promise<void> => {
        status = "loading";
        try {
            const flags = await fetchFlags(store.context.get());
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
        identify,
        addToList: (listKey, users) => loader.addToList(listKey, users),
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

import {
	AnyFlags,
	type BaseClient,
	type EvaluationContext,
	type Flag,
	type FlagControlConfig,
	type RegisteredFlags,
	createBaseClient,
} from "@flagcontrol/core";

export type FlagControlClient<F extends Record<string, any> = RegisteredFlags> =
	Omit<
		BaseClient<F>,
		| "_internalEvaluate"
		| "_events"
		| "_telemetry"
		| "_store"
		| "_loader"
		| "_config"
	> & {
		subscribe: (listener: () => void) => () => void;
	};

export const initFlagControl = <
	F extends Record<string, any> = RegisteredFlags,
>(
	config: FlagControlConfig,
	offlineFlags: readonly Flag[] = [],
	context?: EvaluationContext,
): FlagControlClient<F> => {
	let pollingIntervalMs = config.pollingIntervalMs ?? 0;
	if (pollingIntervalMs > 0 && pollingIntervalMs < 60000) {
		console.warn(
			`[FlagControl] pollingIntervalMs (${pollingIntervalMs}ms) is less than the minimum allowed (60000ms). Defaulting to 60000ms.`,
		);
		pollingIntervalMs = 60000;
	}

	const baseClient = createBaseClient<F>(
		{
			...config,
			pollingIntervalMs,
			evaluationMode: "remote",
		},
		offlineFlags,
		context,
	);
	const listeners = new Set<() => void>();

	if (typeof document !== "undefined") {
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "hidden") {
				baseClient._events.stop();
			} else {
				baseClient._events.start();
			}
		});
	}

	const subscribe = (listener: () => void) => {
		listeners.add(listener);
		return () => listeners.delete(listener);
	};

	const notifyListeners = () => {
		listeners.forEach((listener) => listener());
	};

	// Hook into base client events
	// We need to wrap reload and also listen for internal updates if possible.
	// Since BaseClient doesn't expose a generic "onUpdate", we rely on wrapping reload
	// and potentially the config callback if we could hook into it, but config is passed to BaseClient.
	// A better way would be if BaseClient allowed adding listeners.
	// For now, we wrap reload.

	const originalReload = baseClient.reload;
	const reload = async () => {
		await originalReload();
		notifyListeners();
	};

	// We also need to trigger notifyListeners when the initial load completes.
	// BaseClient starts loading immediately. We can chain off waitForInitialization.
	baseClient.waitForInitialization().then(() => {
		notifyListeners();
	});

	return {
		...baseClient,
		reload,
		identify: async (context: EvaluationContext) => {
			await baseClient.identify(context);
			notifyListeners();
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
export function createFlagControlClient<F extends AnyFlags = RegisteredFlags>(
	config: FlagControlConfig,
	offlineFlags: readonly Flag[] = [],
	context?: EvaluationContext,
): FlagControlClient<F> {
	const client = initFlagControl(config, offlineFlags, context);
	return client as FlagControlClient<F>;
}

"use client";

import type {
	EvaluationContext,
	Flag,
	FlagControlConfig,
	RegisteredFlags,
} from "@flagcontrol/core";
import React, { createContext, useContext, useEffect, useState } from "react";
import { type FlagControlClient, initFlagControl } from "./client";

const FlagControlContext = createContext<FlagControlClient | null>(null);

export interface FlagProviderProps {
	config: FlagControlConfig;
	/** @deprecated Use initialFlags instead for SSR hydration */
	offlineFlags?: readonly Flag[];
	/** Pre-evaluated flags for SSR hydration to prevent layout shifts */
	initialFlags?: readonly Flag[];
	context?: EvaluationContext;
	children: React.ReactNode;
}

export const FlagProvider: React.FC<FlagProviderProps> = ({
	config,
	offlineFlags,
	initialFlags,
	context,
	children,
}) => {
	const [client, setClient] = useState<FlagControlClient | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useEffect(() => {
		// Initialize the client
		const newClient = initFlagControl(config, initialFlags || offlineFlags, context);
		setClient(newClient);

		return () => {
			newClient.close();
		};
	}, [config.sdkKey]); // Re-init if SDK key changes (or other critical config)

	// Handle context updates
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useEffect(() => {
		if (client && context) {
			client.identify(context);
		}
	}, [client, JSON.stringify(context)]);

	if (!client) {
		return null; // Or a loading spinner?
	}

	return (
		<FlagControlContext.Provider value={client}>
			{children}
		</FlagControlContext.Provider>
	);
};

export const useFlagControl = (): FlagControlClient => {
	const client = useContext(FlagControlContext);
	if (!client) {
		throw new Error("useFlagControl must be used within a FlagProvider");
	}
	return client;
};

export const useFlag = <T extends keyof RegisteredFlags & string>(
	key: T,
	defaultValue: RegisteredFlags[T],
	context: EvaluationContext = {},
): RegisteredFlags[T] => {
	const client = useFlagControl();

	const [value, setValue] = useState<T>(() => {
		return client.get(key, context, defaultValue) as T;
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useEffect(() => {
		const update = () => {
			const newValue = client.get(key, context, defaultValue) as T;
			setValue((prev: T) => {
				// Simple equality check to avoid unnecessary re-renders
				if (JSON.stringify(prev) === JSON.stringify(newValue)) return prev;
				return newValue;
			});
		};

		// Subscribe to changes
		const unsubscribe = client.subscribe(update);

		// Initial check in case it changed before subscription
		update();

		return () => {
			unsubscribe();
		};
	}, [client, key, JSON.stringify(context), defaultValue]);

	return value;
};

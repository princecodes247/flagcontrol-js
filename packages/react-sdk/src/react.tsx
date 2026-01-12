import React, { createContext, useContext, useEffect, useState } from 'react';
import { initFlagControl, type FlagControlClient } from './client';
import type { FlagControlConfig, Flag, EvaluationContext, RegisteredFlags } from '@flagcontrol/core';

const FlagControlContext = createContext<FlagControlClient | null>(null);

export interface FlagProviderProps {
    config: FlagControlConfig;
    offlineFlags?: readonly Flag[];
    context?: EvaluationContext;
    children: React.ReactNode;
}

export const FlagProvider: React.FC<FlagProviderProps> = ({
    config,
    offlineFlags,
    context,
    children,
}) => {
    const [client, setClient] = useState<FlagControlClient | null>(null);

    useEffect(() => {
        // Initialize the client
        const newClient = initFlagControl(config, offlineFlags, context);
        setClient(newClient);

        return () => {
            newClient.close();
        };
    }, [config.sdkKey]); // Re-init if SDK key changes (or other critical config)

    // Handle context updates
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
        throw new Error('useFlagControl must be used within a FlagProvider');
    }
    return client;
};


export const useFlag = <T extends keyof RegisteredFlags & string>(
    key: T,
    defaultValue: RegisteredFlags[T],
    context: EvaluationContext = {}
): RegisteredFlags[T] => {
    const client = useFlagControl();

    const [value, setValue] = useState<T>(() => {
        return client.get(key, context, defaultValue) as T;
    });

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

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initFlagControl, type FlagControlClient } from './client';
import type { FlagControlConfig, Flag, EvaluationContext } from '@flagcontrol/core';

const FlagsenseContext = createContext<FlagControlClient | null>(null);

export interface FlagsenseProviderProps {
    config: FlagControlConfig;
    offlineFlags?: readonly Flag[];
    children: React.ReactNode;
}

export const FlagsenseProvider: React.FC<FlagsenseProviderProps> = ({
    config,
    offlineFlags,
    children,
}) => {
    const [client, setClient] = useState<FlagControlClient | null>(null);

    useEffect(() => {
        // Initialize the client
        const newClient = initFlagControl(config, offlineFlags);
        setClient(newClient);

        return () => {
            newClient.close();
        };
    }, [config.sdkKey]); // Re-init if SDK key changes (or other critical config)

    if (!client) {
        return null; // Or a loading spinner?
    }

    return (
        <FlagsenseContext.Provider value={client}>
            {children}
        </FlagsenseContext.Provider>
    );
};

export const useFlagsense = (): FlagControlClient => {
    const client = useContext(FlagsenseContext);
    if (!client) {
        throw new Error('useFlagsense must be used within a FlagsenseProvider');
    }
    return client;
};

export const useFlag = <T = any>(
    key: string,
    defaultValue: T,
    context: EvaluationContext = {}
): T => {
    const client = useFlagsense();
    // We need a way to trigger re-renders when flags change.
    // The current client implementation relies on `onFlagsUpdated` callback in config.
    // But that's global.
    // We might need to implement a listener pattern in the client or use a global signal.

    // For now, let's assume the provider triggers a re-render of the app or we use a state here.
    // But wait, the client instance doesn't change on updates, only internal store.
    // So we need to subscribe to store updates.

    // Since `initFlagControl` takes `onFlagsUpdated`, we can't easily hook into it from here 
    // without modifying the client to support multiple listeners.

    // Let's modify the client to support event emitters or similar.
    // OR, we can use a forceUpdate in the Provider and pass it down? 
    // No, that's inefficient.

    // Best approach: Modify `client.ts` to support `subscribe`.

    // For this initial pass, I'll implement a simple state that updates when the component mounts/updates,
    // but real-time updates require the subscription mechanism.

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

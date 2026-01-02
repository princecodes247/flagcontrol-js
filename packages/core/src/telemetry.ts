import type { FlagControlConfig, TelemetryEvent } from "./types";

export type TelemetryManager = {
    record: (event: TelemetryEvent) => void;
    start: () => void;
    stop: () => Promise<void>;
};

export const createTelemetryManager = (
    config: FlagControlConfig
): TelemetryManager => {
    if (config.disableTelemetry) {
        return {
            record: () => { },
            start: () => { },
            stop: async () => { },
        };
    }

    const events: TelemetryEvent[] = [];
    const flushInterval = config.telemetryIntervalMs ?? 60000;
    const bufferSize = 1;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let isClosed = false;

    let flushing = false;
    const MAX_QUEUE_SIZE = 500;

    const flush = async () => {
        if (flushing || events.length === 0) return;

        flushing = true;
        const batch = events.splice(0, bufferSize);

        const baseUrl = config.apiBaseUrl || "https://api.flagcontrol.com/v1";
        const url = `${baseUrl}/telemetry/events`;
        const fetchImpl = config.fetch || globalThis.fetch;

        if (!fetchImpl) return;

        try {
            await fetchImpl(url, {
                method: "POST",
                headers: {
                    "X-FlagControl-SDK-Key": config.sdkKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ events: batch }),
            });
        } catch (error) {
            // Silently fail for telemetry
            // console.error("Failed to send telemetry", error);
            events.unshift(...batch);
            events.length = Math.min(events.length, MAX_QUEUE_SIZE);
        } finally {
            flushing = false;
        }
    };

    const start = () => {
        if (isClosed) return;
        timer = setInterval(flush, flushInterval);
        // timer.unref?.(); // unref is Node-specific
    };

    const stop = async () => {
        isClosed = true;
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        await flush();
    };

    const record = (event: TelemetryEvent) => {
        if (isClosed) return;

        const sampleRate = config.telemetrySampleRate ?? 1.0;
        if (Math.random() > sampleRate) return;

        if (events.length >= MAX_QUEUE_SIZE) {
            events.shift(); // drop oldest
        }

        events.push({
            ...event,
            metadata: {
                ...event.metadata,
                sdk: "js-sdk",
                version: "1.0.0",
                platform: typeof window === "undefined" ? "node" : "browser",
            },
        });

        if (events.length >= bufferSize) {
            flush();
        }
    };

    return {
        record,
        start,
        stop,
    };
};

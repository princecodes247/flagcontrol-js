import type {
  Flag,
  FlagManifest,
  FlagControlConfig,
  EvaluationContext,
} from "./types";

export type Loader = {
  getFlags: (
    context?: EvaluationContext,
    signal?: AbortSignal
  ) => Promise<Flag[]>;
  getManifest: (signal?: AbortSignal) => Promise<FlagManifest[]>;
};

const DEFAULT_API_BASE_URL = "https://api.flagcontrol.com/v1";

export const createLoader = (config: FlagControlConfig): Loader => {
  return {
    getFlags: async (
      context?: EvaluationContext,
      signal?: AbortSignal
    ): Promise<Flag[]> => {
      const baseUrl = config.apiBaseUrl || DEFAULT_API_BASE_URL;
      let url = `${baseUrl}/sdk/flags`;

      if (context) {
        const contextStr = encodeURIComponent(JSON.stringify(context));
        url += `?context=${contextStr}`;
      }
      const fetchImpl = config.fetch || global.fetch;

      if (!fetchImpl) {
        throw new Error(
          "No fetch implementation found. Please provide one in the config or ensure global fetch is available."
        );
      }

      try {
        const response = await fetchImpl(url, {
          method: "GET",
          headers: {
            "X-FlagControl-SDK-Key": config.sdkKey,
            "Content-Type": "application/json",
          },
          signal,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch flags: ${response.status} ${response.statusText}`
          );
        }

        const data = (await response.json()) as { flags: Flag[] };
        return data.flags;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        throw new Error(
          `Network error fetching flags: ${error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    getManifest: async (signal?: AbortSignal): Promise<FlagManifest[]> => {
      const baseUrl = config.apiBaseUrl || DEFAULT_API_BASE_URL;
      const url = `${baseUrl}/sdk/manifest`;
      const fetchImpl = config.fetch || global.fetch;

      if (!fetchImpl) {
        throw new Error(
          "No fetch implementation found. Please provide one in the config or ensure global fetch is available."
        );
      }

      try {
        const response = await fetchImpl(url, {
          method: "GET",
          headers: {
            "X-FlagControl-SDK-Key": config.sdkKey,
            "Content-Type": "application/json",
          },
          signal,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch flags: ${response.status} ${response.statusText}`
          );
        }

        const data = (await response.json()) as { flags: FlagManifest[] };
        return data.flags;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        throw new Error(
          `Network error fetching flags: ${error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }
};

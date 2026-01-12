import type {
  Flag,
  FlagManifest,
  FlagControlConfig,
  EvaluationContext,
} from "./types";

export type BootstrapResponse = {
  types: FlagManifest[];
}

export type Loader = {
  getFlags: (
    context?: EvaluationContext,
    signal?: AbortSignal
  ) => Promise<Flag[]>;
  getBootstrap: (signal?: AbortSignal) => Promise<BootstrapResponse>;
  addToList: (
    listKey: string,
    users:
      | { key: string;[attrs: string]: any }
      | Array<{ key: string;[attrs: string]: any }>,
    signal?: AbortSignal
  ) => Promise<any>;
};

const DEFAULT_API_BASE_URL = "https://api.flagcontrol.com/v1";

export const createLoader = (config: FlagControlConfig): Loader => {
  return {
    getFlags: async (
      context?: EvaluationContext,
      signal?: AbortSignal
    ): Promise<Flag[]> => {
      const baseUrl = config.apiBaseUrl || DEFAULT_API_BASE_URL;
      let url = `${baseUrl}/sdk/flags/evaluate/all`;
      console.log({ url, repla: config.apiBaseUrl })
      const fetchImpl = config.fetch || global.fetch;

      if (!fetchImpl) {
        throw new Error(
          "No fetch implementation found. Please provide one in the config or ensure global fetch is available."
        );
      }

      try {
        const response = await fetchImpl(url, {
          method: "POST",
          headers: {
            "X-FlagControl-SDK-Key": config.sdkKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ context }),
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
        console.log({ error })
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        throw new Error(
          `Network error fetching flags: ${error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    getBootstrap: async (signal?: AbortSignal): Promise<BootstrapResponse> => {
      const baseUrl = config.apiBaseUrl || DEFAULT_API_BASE_URL;
      const url = `${baseUrl}/sdk/bootstrap`;
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

        const data = (await response.json()) as BootstrapResponse;
        return data;
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
    addToList: async (
      listKey: string,
      users:
        | { key: string;[attrs: string]: any }
        | Array<{ key: string;[attrs: string]: any }>,
      signal?: AbortSignal
    ): Promise<any> => {
      const baseUrl = config.apiBaseUrl || DEFAULT_API_BASE_URL;
      const url = `${baseUrl}/lists/${listKey}/add`;
      const fetchImpl = config.fetch || global.fetch;

      if (!fetchImpl) {
        throw new Error(
          "No fetch implementation found. Please provide one in the config or ensure global fetch is available."
        );
      }

      try {
        const response = await fetchImpl(url, {
          method: "POST",
          headers: {
            "X-FlagControl-SDK-Key": config.sdkKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ users: Array.isArray(users) ? users : [users] }),
          signal,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to add to list: ${response.status} ${response.statusText}`
          );
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        throw new Error(
          `Network error adding to list: ${error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
  };
};

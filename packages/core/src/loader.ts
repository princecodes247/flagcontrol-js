import type {
  Flag,
  FlagManifest,
  FlagControlConfig,
  EvaluationContext,
  BootstrapResponse,
  DefinitionsResponse,
  ChangesResponse,
} from "./types";

// ============================================================================
// Types
// ============================================================================

export type UserEntry = { key: string; [attrs: string]: any };

export type ListInfo = {
  key: string;
  name: string;
  description?: string;
};

export type Loader = {
  // Flag operations
  getFlags: (context?: EvaluationContext, signal?: AbortSignal) => Promise<Flag[]>;
  getFlagDefinitions: (signal?: AbortSignal) => Promise<DefinitionsResponse>;
  getChanges: (cursor: string, signal?: AbortSignal) => Promise<ChangesResponse>;
  getBootstrap: (signal?: AbortSignal) => Promise<BootstrapResponse>;

  // List operations
  createList: (list: ListInfo, signal?: AbortSignal) => Promise<ListInfo>;
  deleteList: (listKey: string, signal?: AbortSignal) => Promise<void>;
  addToList: (listKey: string, users: UserEntry | UserEntry[], signal?: AbortSignal) => Promise<any>;
  removeFromList: (listKey: string, userKeys: string | string[], signal?: AbortSignal) => Promise<void>;
};

// ============================================================================
// Route Definitions
// ============================================================================

const DEFAULT_API_BASE_URL = "https://api.flagcontrol.com/v1";

/**
 * Centralized route definitions for all SDK API endpoints.
 * Each route is a function that takes route parameters and returns the path.
 */
const ROUTES = {
  // Flag routes
  evaluateAll: () => "/sdk/flags/evaluate/all",
  definitions: () => "/sdk/definitions",
  changes: (cursor: string) => `/sdk/changes?since=${encodeURIComponent(cursor)}`,
  bootstrap: () => "/sdk/bootstrap",

  // List routes
  lists: () => "/sdk/lists",
  list: (listKey: string) => `/sdk/lists/${listKey}`,
  listUsers: (listKey: string) => `/sdk/lists/${listKey}/users`,
} as const;

// ============================================================================
// Request Helper
// ============================================================================

type RequestOptions<TBody = unknown> = {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: TBody;
  signal?: AbortSignal;
  errorMessage: string;
};

/**
 * Creates a reusable request function bound to the SDK configuration.
 */
const createRequestFn = (config: FlagControlConfig) => {
  const baseUrl = config.apiBaseUrl || DEFAULT_API_BASE_URL;
  const fetchImpl = config.fetch || global.fetch;

  if (!fetchImpl) {
    throw new Error(
      "No fetch implementation found. Please provide one in the config or ensure global fetch is available."
    );
  }

  return async <TResponse, TBody = unknown>(
    options: RequestOptions<TBody>
  ): Promise<TResponse> => {
    const { method, path, body, signal, errorMessage } = options;
    const url = `${baseUrl}${path}`;

    try {
      const response = await fetchImpl(url, {
        method,
        headers: {
          "X-FlagControl-SDK-Key": config.sdkKey,
          "Content-Type": "application/json",
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });

      if (!response.ok) {
        throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`);
      }

      // Handle empty responses (e.g., 204 No Content)
      const contentLength = response.headers.get("content-length");
      if (response.status === 204 || contentLength === "0") {
        return undefined as TResponse;
      }

      return (await response.json()) as TResponse;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      throw new Error(
        `Network error - ${errorMessage}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };
};

// ============================================================================
// Loader Factory
// ============================================================================

export const createLoader = (config: FlagControlConfig): Loader => {
  const request = createRequestFn(config);

  return {
    // ========================================================================
    // Flag Operations
    // ========================================================================

    getFlags: async (context?: EvaluationContext, signal?: AbortSignal): Promise<Flag[]> => {
      const data = await request<{ flags: Flag[] }>({
        method: "POST",
        path: ROUTES.evaluateAll(),
        body: { context },
        signal,
        errorMessage: "Failed to fetch flags",
      });
      return data.flags;
    },

    getFlagDefinitions: async (signal?: AbortSignal): Promise<DefinitionsResponse> => {
      return request<DefinitionsResponse>({
        method: "GET",
        path: ROUTES.definitions(),
        signal,
        errorMessage: "Failed to fetch flag definitions",
      });
    },

    getBootstrap: async (signal?: AbortSignal): Promise<BootstrapResponse> => {
      return request<BootstrapResponse>({
        method: "GET",
        path: ROUTES.bootstrap(),
        signal,
        errorMessage: "Failed to fetch bootstrap data",
      });
    },

    getChanges: async (cursor: string, signal?: AbortSignal): Promise<ChangesResponse> => {
      return request<ChangesResponse>({
        method: "GET",
        path: ROUTES.changes(cursor),
        signal,
        errorMessage: "Failed to fetch changes",
      });
    },

    // ========================================================================
    // List Operations
    // ========================================================================

    createList: async (list: ListInfo, signal?: AbortSignal): Promise<ListInfo> => {
      return request<ListInfo>({
        method: "POST",
        path: ROUTES.lists(),
        body: list,
        signal,
        errorMessage: "Failed to create list",
      });
    },

    deleteList: async (listKey: string, signal?: AbortSignal): Promise<void> => {
      await request<void>({
        method: "DELETE",
        path: ROUTES.list(listKey),
        signal,
        errorMessage: "Failed to delete list",
      });
    },

    addToList: async (
      listKey: string,
      users: UserEntry | UserEntry[],
      signal?: AbortSignal
    ): Promise<any> => {
      return request({
        method: "POST",
        path: ROUTES.listUsers(listKey),
        body: { userKeys: Array.isArray(users) ? users : [users] },
        signal,
        errorMessage: "Failed to add to list",
      });
    },

    removeFromList: async (
      listKey: string,
      userKeys: string | string[],
      signal?: AbortSignal
    ): Promise<void> => {
      await request<void>({
        method: "DELETE",
        path: ROUTES.listUsers(listKey),
        body: { userKeys: Array.isArray(userKeys) ? userKeys : [userKeys] },
        signal,
        errorMessage: "Failed to remove from list",
      });
    },
  };
};

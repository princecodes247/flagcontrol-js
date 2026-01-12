export type FlagValue = boolean | string | number | Record<string, unknown>;

export type Operator =
  | "equals"
  | "contains"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "in_list"
  | "not_in_list";



export interface Rule {
  conditions: readonly {
    attribute: string;
    operator: Operator;
    value: string | number | boolean | readonly (string | number | boolean)[];
  }[];
  result: FlagValue;
  enabled: boolean;
  priority: number;
}

export interface Variant {
  id: string;
  value: FlagValue;
}

export interface Target {
  variants: readonly {
    variantId: string;
    percentage: number;
  }[];
  rules: readonly Rule[];
}

export type FlagTypeValue = {
  type: 'boolean'
  value?: boolean
  defaultValue: boolean
} | {
  type: 'string'
  value?: string
  defaultValue: string
} | {
  type: 'number'
  value?: number
  defaultValue: number
} | {
  type: 'object'
  value?: Record<string, unknown>
  defaultValue: Record<string, unknown>
}

export type Flag = {
  key: string;
  defaultVariantId?: string;
  variants?: readonly Variant[];
  targets?: readonly Target[];
  rules?: readonly Rule[];
  lists?: readonly string[];
} & FlagTypeValue;

export interface FlagControlConfig {
  sdkKey: string;
  apiBaseUrl?: string;
  pollingIntervalMs?: number;
  fetch?: typeof fetch;
  onFlagsUpdated?: () => void;
  onError?: (error: Error) => void;
  eventSource?: EventSource;
  disableSSE?: boolean;
  telemetryIntervalMs?: number;
  disableTelemetry?: boolean;
  telemetrySampleRate?: number;
  evaluationMode?: 'local' | 'remote';
}

export interface TelemetryEvent {
  flagKey: string;
  variantId?: string;
  value: FlagValue;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type FlagManifest = {
  key: string,
  type: 'boolean' | 'string' | 'number' | 'json',
  defaults: string[] | number[] | boolean[] | Record<string, unknown>[] | undefined,
  variants: string[] | number[] | boolean[] | Record<string, unknown>[] | undefined,
  rules: string[] | number[] | boolean[] | Record<string, unknown>[] | undefined,
}

export type DefinitionsResponse = {
  flags: FlagManifest[];
  lists: {
    key: string;
    members: string[];
  }[];
  salt: string;
}

export type BootstrapResponse = {
  types: FlagManifest[];
  lists: string[];
}


// export type InferFlags<T extends readonly { key: string; variants: readonly { value: unknown }[] }[]> = {
//   [F in T[number] as F["key"]]: F["variants"][number]["value"];
// };

export type InferFlags<T extends readonly { key: string; type: 'boolean' | 'string' | 'number'; }[]> = {
  [F in T[number]as F["key"]]: F["type"] extends 'boolean' ? boolean : F["type"] extends 'string' ? string : F["type"] extends 'number' ? number : never;
};

/**
 * Global registry for flag types.
 * Users can augment this interface to provide type safety.
 *
 * Example:
 * declare module "@flagcontrol/sdk" {
 *   interface Register {
 *     flags: AppFlags;
 *   }
 * }
 */
export interface FlagControlRegister {
  // flags: AppFlags
}

export type AnyFlags = Record<string, any>;

/**
 * Helper to extract flags from the registry or fallback to AnyFlags.
 */
export type RegisteredFlags = FlagControlRegister extends { flags: infer F }
  ? F
  : AnyFlags;



export type BaseEvaluationContext<T extends object = Record<string, unknown>> = Record<string, unknown> & T;


export interface FlagControlEvaluationContext {
  id?: string;
  email?: string;
}
export type EvaluationContext = BaseEvaluationContext<FlagControlEvaluationContext>;

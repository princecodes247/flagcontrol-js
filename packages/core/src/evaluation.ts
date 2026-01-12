import type {
  EvaluationContext,
  Flag,
  FlagValue,
  Operator,
  Rule,
  Target,
  Variant,
} from "./types";
import { getBucket } from "./utils/hashing";

export class Evaluator {
  evaluate(flag: Flag, context: EvaluationContext): FlagValue {
    return flag?.value ?? flag.defaultValue;
  }
}

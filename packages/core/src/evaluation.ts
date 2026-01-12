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
    console.log({ flag })
    // 1. Check rules
    if (flag.rules) {
      for (const rule of flag.rules) {
        if (this.matchesConditions(rule.conditions, context)) {
          return rule.result;
        }
      }
    }

    // 2. Default variant
    if (flag.defaultVariantId) {
      const defaultVariant = flag.variants?.find(
        (v) => v.id === flag.defaultVariantId
      );
      if (!defaultVariant) {
        // Fallback to defaultValue if variant not found
        return flag.defaultValue;
      }
      return defaultVariant.value;
    }

    return flag.defaultValue;
  }

  private matchesConditions(conditions: readonly { attribute: string; operator: Operator; value: any }[], context: EvaluationContext): boolean {
    return conditions.every((condition) => this.matchesCondition(condition, context));
  }

  private matchesCondition(condition: { attribute: string; operator: Operator; value: any }, context: EvaluationContext): boolean {
    const attributeValue =
      condition.attribute === "id"
        ? context.userId
        : context.attributes?.[condition.attribute];

    // If attribute is missing, condition fails
    if (attributeValue === undefined) {
      return false;
    }

    switch (condition.operator) {
      case "equals":
        return attributeValue === condition.value;
      case "contains":
        return (
          typeof attributeValue === "string" &&
          typeof condition.value === "string" &&
          attributeValue.includes(condition.value as string)
        );
      case "gt":
        return (
          typeof attributeValue === "number" &&
          typeof condition.value === "number" &&
          attributeValue > condition.value
        );
      case "lt":
        return (
          typeof attributeValue === "number" &&
          typeof condition.value === "number" &&
          attributeValue < condition.value
        );
      case "gte":
        return (
          typeof attributeValue === "number" &&
          typeof condition.value === "number" &&
          attributeValue >= condition.value
        );
      case "lte":
        return (
          typeof attributeValue === "number" &&
          typeof condition.value === "number" &&
          attributeValue <= condition.value
        );
      case "in_list":
        return (
          Array.isArray(condition.value) &&
          condition.value.includes(attributeValue as string | number | boolean)
        );
      case "not_in_list":
        return (
          Array.isArray(condition.value) &&
          !condition.value.includes(attributeValue as string | number | boolean)
        );
      default:
        return false;
    }
  }

  private evaluateRollout(
    target: Target,
    flag: Flag,
    context: EvaluationContext
  ): Variant {
    // If only one variant with 100%, return it
    if (target.variants.length === 1 && target.variants[0].percentage === 100) {
      const variant = flag?.variants?.find(
        (v) => v.id === target.variants[0].variantId
      );
      if (variant) return variant;
    }

    // Percentage rollout
    // We need a unique key for the user + flag combination to ensure stickiness
    const bucketKey = `${context.userId || "anonymous"}:${flag.key}`;
    const bucket = getBucket(bucketKey);

    let accumulated = 0;
    for (const targetVariant of target.variants) {
      accumulated += targetVariant.percentage;
      if (bucket < accumulated) {
        const variant = flag.variants?.find(
          (v) => v.id === targetVariant.variantId
        );
        if (variant) return variant;
      }
    }

    // Fallback to default if something goes wrong with rollout math
    const defaultVariant = flag.variants?.find(
      (v) => v.id === flag.defaultVariantId
    );
    if (!defaultVariant) throw new Error("Default variant not found");
    return defaultVariant;
  }
}

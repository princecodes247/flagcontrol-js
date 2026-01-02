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
    // 1. Check targets (rules + rollouts)
    if (flag.targets) {
      for (const target of flag.targets) {
        if (this.matchesRules(target.rules, context)) {
          return this.evaluateRollout(target, flag, context).value;
        }
      }
    }

    // 2. Default variant
    if (flag.defaultVariantId) {
      const defaultVariant = flag.variants?.find(
        (v) => v.id === flag.defaultVariantId
      );
      if (!defaultVariant) {
        // throw new Error(`Default variant ${flag.defaultVariantId} not found`);
        // Fallback to defaultValue if variant not found
        return flag.defaultValue;
      }
      return defaultVariant.value;
    }

    return flag.defaultValue;
  }

  private matchesRules(rules: readonly Rule[], context: EvaluationContext): boolean {
    return rules.every((rule) => this.matchesRule(rule, context));
  }

  private matchesRule(rule: Rule, context: EvaluationContext): boolean {
    const attributeValue =
      rule.attribute === "id"
        ? context.userId
        : context.attributes?.[rule.attribute];

    // If attribute is missing, rule fails (unless operator handles missing?)
    // For now, strict: missing attribute = false
    if (attributeValue === undefined) {
      return false;
    }

    switch (rule.operator) {
      case "equals":
        return attributeValue === rule.value;
      case "contains":
        return (
          typeof attributeValue === "string" &&
          typeof rule.value === "string" &&
          attributeValue.includes(rule.value)
        );
      case "gt":
        return (
          typeof attributeValue === "number" &&
          typeof rule.value === "number" &&
          attributeValue > rule.value
        );
      case "lt":
        return (
          typeof attributeValue === "number" &&
          typeof rule.value === "number" &&
          attributeValue < rule.value
        );
      case "gte":
        return (
          typeof attributeValue === "number" &&
          typeof rule.value === "number" &&
          attributeValue >= rule.value
        );
      case "lte":
        return (
          typeof attributeValue === "number" &&
          typeof rule.value === "number" &&
          attributeValue <= rule.value
        );
      case "oneOf":
        return (
          Array.isArray(rule.value) &&
          rule.value.includes(attributeValue as string | number | boolean)
        );
      case "notOneOf":
        return (
          Array.isArray(rule.value) &&
          !rule.value.includes(attributeValue as string | number | boolean)
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

    // Fallback to default if something goes wrong with rollout math (shouldn't happen if sum is 100)
    const defaultVariant = flag.variants?.find(
      (v) => v.id === flag.defaultVariantId
    );
    if (!defaultVariant) throw new Error("Default variant not found");
    return defaultVariant;
  }
}

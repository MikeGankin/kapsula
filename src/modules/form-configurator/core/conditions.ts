import type {CardsFieldConfig, FieldOption, FieldValue, FormValues} from "./types.ts";

function toValueList(value: FieldValue | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}

function matchesFieldRule(
  currentValue: FieldValue | undefined,
  rule: NonNullable<FieldOption["visibleWhen"]>[string],
): boolean {
  const selectedValues = toValueList(currentValue);

  if (rule.includes) {
    return rule.includes.some((value) => selectedValues.includes(value));
  }

  if (rule.excludes) {
    return rule.excludes.every((value) => !selectedValues.includes(value));
  }

  return true;
}

function matchesRules(
  rules: NonNullable<FieldOption["visibleWhen"]>,
  values: Readonly<FormValues>,
): boolean {
  return Object.entries(rules)
    .every(([sectionId, rule]) => matchesFieldRule(values[sectionId], rule));
}

export function isOptionVisible(
  option: FieldOption,
  values: Readonly<FormValues> = {},
): boolean {
  if (option.visibleWhen && !matchesRules(option.visibleWhen, values)) return false;
  if (option.hiddenWhen && matchesRules(option.hiddenWhen, values)) return false;
  return true;
}

export function getVisibleOptions(
  section: CardsFieldConfig,
  values: Readonly<FormValues> = {},
): FieldOption[] {
  return section.options.filter((option) => isOptionVisible(option, values));
}

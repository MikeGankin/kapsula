import {getFieldTypeDefinition} from "./fieldTypes.ts";
import type {
  CardsFieldConfig,
  ExpandedState,
  FieldConfig,
  FieldValue,
  FormValues,
} from "./types.ts";

function isRendered(section: FieldConfig): boolean {
  return section.render === true;
}

export function buildInitialValues(
  sections: readonly FieldConfig[],
  current: Readonly<FormValues> = {},
): FormValues {
  return sections.filter(isRendered).reduce<FormValues>((values, section) => {
    values[section.id] = getFieldTypeDefinition(section)
      .getInitialValue(section, current[section.id]);

    return values;
  }, {});
}

export function toggleOptionValue(
  section: CardsFieldConfig,
  current: FieldValue | undefined,
  option: string,
): string | string[] {
  if (section.multiple) {
    const nextValue = Array.isArray(current) ? [...current] : [];
    const existingIndex = nextValue.indexOf(option);
    if (existingIndex >= 0) nextValue.splice(existingIndex, 1);
    else nextValue.push(option);
    return nextValue;
  }

  return current === option ? "" : option;
}

export function normalizeFormValues(
  sections: readonly FieldConfig[],
  values: Readonly<FormValues>,
): FormValues {
  return sections.reduce<FormValues>((normalized, section) => {
    normalized[section.id] = getFieldTypeDefinition(section)
      .normalizeValue(section, values[section.id], {values});

    return normalized;
  }, {});
}

function areValuesEqual(
  sections: readonly FieldConfig[],
  previous: Readonly<FormValues>,
  next: Readonly<FormValues>,
): boolean {
  return sections.every((section) => {
    const previousValue = previous[section.id];
    const nextValue = next[section.id];
    if (Array.isArray(previousValue) || Array.isArray(nextValue)) {
      return Array.isArray(previousValue) && Array.isArray(nextValue)
        && previousValue.length === nextValue.length
        && previousValue.every((value, index) => value === nextValue[index]);
    }
    return previousValue === nextValue;
  });
}

export function normalizeFormValuesUntilStable(
  sections: readonly FieldConfig[],
  values: Readonly<FormValues>,
): FormValues {
  let normalizedValues = values;
  for (let pass = 0; pass < sections.length; pass += 1) {
    const nextValues = normalizeFormValues(sections, normalizedValues);
    if (areValuesEqual(sections, normalizedValues, nextValues)) return nextValues;
    normalizedValues = nextValues;
  }
  return {...normalizedValues};
}

export function buildExpandedState(
  sections: readonly FieldConfig[],
  current: Readonly<ExpandedState> = {},
): ExpandedState {
  return sections.filter(isRendered).reduce<ExpandedState>((expanded, section, index) => {
    expanded[section.id] = current[section.id] ?? section.expanded ?? index === 0;
    return expanded;
  }, {});
}

import {getVisibleOptions} from "./formConditions.js";

export function toggleOptionValue(section, currentValue, optionValue) {
  if (section.multiple) {
    const nextValue = Array.isArray(currentValue) ? [...currentValue] : [];
    const existingIndex = nextValue.indexOf(optionValue);

    if (existingIndex >= 0) {
      nextValue.splice(existingIndex, 1);
      return nextValue;
    }

    nextValue.push(optionValue);
    return nextValue;
  }

  return currentValue === optionValue ? "" : optionValue;
}

export function normalizeFormValues(sections, values) {
  return sections.reduce((accumulator, section) => {
    const currentValue = values[section.id];

    if (section.type === "calendar") {
      accumulator[section.id] = currentValue ?? null;
      return accumulator;
    }

    if (section.type === "textarea") {
      accumulator[section.id] = currentValue ?? "";
      return accumulator;
    }

    const visibleValues = getVisibleOptions(section, values).map((option) => option.value);

    if (section.multiple) {
      accumulator[section.id] = Array.isArray(currentValue)
        ? currentValue.filter((value) => visibleValues.includes(value))
        : [];
      return accumulator;
    }

    if (Array.isArray(currentValue)) {
      accumulator[section.id] = currentValue.find((value) => visibleValues.includes(value)) ?? "";
      return accumulator;
    }

    accumulator[section.id] = visibleValues.includes(currentValue) ? currentValue : "";
    return accumulator;
  }, {});
}

function areValuesEqual(sections, previousValues, nextValues) {
  return sections.every((section) => {
    const previousValue = previousValues[section.id];
    const nextValue = nextValues[section.id];

    if (Array.isArray(previousValue) || Array.isArray(nextValue)) {
      return Array.isArray(previousValue)
        && Array.isArray(nextValue)
        && previousValue.length === nextValue.length
        && previousValue.every((value, index) => value === nextValue[index]);
    }

    return previousValue === nextValue;
  });
}

export function normalizeFormValuesUntilStable(sections, values) {
  let normalizedValues = values;

  for (let pass = 0; pass < sections.length; pass += 1) {
    const nextValues = normalizeFormValues(sections, normalizedValues);

    if (areValuesEqual(sections, normalizedValues, nextValues)) {
      return nextValues;
    }

    normalizedValues = nextValues;
  }

  return normalizedValues;
}

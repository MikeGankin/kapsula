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

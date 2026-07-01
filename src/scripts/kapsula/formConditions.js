function toValueList(value) {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}

function matchesFieldRule(currentValue, rule) {
  const selectedValues = toValueList(currentValue);

  if (rule.includes) {
    return rule.includes.some((value) => selectedValues.includes(value));
  }

  if (rule.excludes) {
    return rule.excludes.every((value) => !selectedValues.includes(value));
  }

  return true;
}

function matchesRules(rules, values) {
  return Object.entries(rules).every(([sectionId, rule]) => matchesFieldRule(values[sectionId], rule));
}

export function isOptionVisible(option, values = {}) {
  if (option.visibleWhen && !matchesRules(option.visibleWhen, values)) {
    return false;
  }

  if (option.hiddenWhen && matchesRules(option.hiddenWhen, values)) {
    return false;
  }

  return true;
}

export function getVisibleOptions(section, values = {}) {
  return section.options.filter((option) => isOptionVisible(option, values));
}

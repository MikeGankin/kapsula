import formConfig from "../formConfig.js";

export function getFormConfig() {
  return formConfig;
}

export function buildCapsuleMap(config = formConfig) {
  return new Map(Object.entries(config.capsules ?? {}));
}

export function getFormSubmitEndpoint(config = formConfig) {
  return config.submitEndpoint ?? "";
}

export function getDefaultCapsuleId(config = formConfig) {
  return config.defaultCapsule ?? Object.keys(config.capsules ?? {})[0];
}

export function getInitialCapsuleId(capsuleMap, initialCapsuleId, config = formConfig) {
  if (initialCapsuleId && capsuleMap.has(initialCapsuleId)) {
    return initialCapsuleId;
  }

  return getDefaultCapsuleId(config);
}

export function getCapsule(capsuleMap, capsuleId) {
  const capsule = capsuleMap.get(capsuleId);

  if (!capsule) {
    throw new Error(`Missing form schema for capsule "${capsuleId}"`);
  }

  return capsule;
}

export function buildInitialValues(sections, currentValues = {}) {
  return sections.reduce((accumulator, section) => {
    if (section.type === "textarea") {
      accumulator[section.id] = currentValues[section.id] ?? "";
      return accumulator;
    }

    accumulator[section.id] = currentValues[section.id] ?? (section.multiple ? [] : "");
    return accumulator;
  }, {});
}

export function buildExpandedState(sections, currentExpanded = {}) {
  return sections.reduce((accumulator, section, index) => {
    const fallbackExpanded = section.expanded ?? index === 0;
    accumulator[section.id] = currentExpanded[section.id] ?? fallbackExpanded;
    return accumulator;
  }, {});
}

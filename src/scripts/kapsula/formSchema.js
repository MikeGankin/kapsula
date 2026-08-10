import formConfig from "../formConfig.json";

export function getFormConfig() {
  return formConfig;
}

export function buildCapsuleMap(config = formConfig) {
  return new Map(Object.entries(config.capsules ?? {}));
}

export function getFormSubmitEndpoint(config = formConfig) {
  return config.submitEndpoint ?? "";
}

/**
 * Тема письма и адрес получателя живут в конфиге, а не на бэке: ручка
 * `manager-lead-mail` принимает `subject` и `to`, но при их отсутствии молча
 * подставляет свои дефолты. Пока фронт их не слал, любая правка темы или
 * почты требовала релиза бэка.
 */
export function getMailSubject(config = formConfig) {
  return config.mailSubject ?? "";
}

export function getMailTo(config = formConfig) {
  return config.mailTo ?? "";
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

/**
 * Отбрасывает значения, которых больше нет в конфиге.
 *
 * Секции отсеиваются самим `reduce` (ключи берутся из схемы), а вот опции
 * раньше проходили как есть: сохранённая в сессии опция, удалённая из
 * `formConfig.json`, оставалась в состоянии и попадала в summary и в лид.
 */
function keepKnownOptionValues(section, savedValue) {
  const knownValues = new Set((section.options ?? []).map((option) => option.value));

  if (section.multiple) {
    return Array.isArray(savedValue)
      ? savedValue.filter((value) => knownValues.has(value))
      : [];
  }

  return knownValues.has(savedValue) ? savedValue : "";
}

export function buildInitialValues(sections, currentValues = {}) {
  return sections.reduce((accumulator, section) => {
    if (section.type === "textarea") {
      accumulator[section.id] = currentValues[section.id] ?? "";
      return accumulator;
    }

    const savedValue = currentValues[section.id];

    accumulator[section.id] = savedValue === undefined
      ? (section.multiple ? [] : "")
      : keepKnownOptionValues(section, savedValue);

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

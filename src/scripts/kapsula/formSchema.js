import formConfig from "./kapsulaFormConfig.ts";
import {
  buildExpandedState as buildCoreExpandedState,
  buildInitialValues as buildCoreInitialValues,
} from "../../modules/form-configurator/core/values.ts";

export function getFormConfig() {
  return formConfig;
}

export function buildCapsuleMap(config = formConfig) {
  return new Map(
    Object.entries(config.capsules ?? {}).map(([capsuleId, capsule]) => [
      capsuleId,
      {...capsule, sections: getRenderedSections(capsule.sections)},
    ]),
  );
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

export function getPopupFields(config = formConfig) {
  return config.popupFields ?? {};
}

export function getHotelsSettings(config = formConfig) {
  return config.hotels ?? {};
}

export function isFieldRendered(field) {
  return field?.render === true;
}

export function getRenderedSections(sections = []) {
  return sections.filter(isFieldRendered);
}

export function filterRenderedFields(values, fields = getPopupFields()) {
  return Object.entries(fields).reduce((result, [fieldName, field]) => {
    if (isFieldRendered(field) && fieldName in values) {
      result[fieldName] = values[fieldName];
    }

    return result;
  }, {});
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
export function buildInitialValues(sections, currentValues = {}) {
  return buildCoreInitialValues(sections, currentValues);
}

export function buildExpandedState(sections, currentExpanded = {}) {
  return buildCoreExpandedState(sections, currentExpanded);
}

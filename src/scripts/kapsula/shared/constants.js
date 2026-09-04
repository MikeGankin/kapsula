/**
 * Единственный источник правды для значений, которые раньше были
 * продублированы по модулям (медиазапросы, id счётчика, селекторы хедера,
 * ключи sessionStorage).
 */

export const DESKTOP_MEDIA_QUERY = "(min-width: 993px)";
export const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

export const METRIKA_COUNTER_ID = 96674199;

export const HEADER_CONTACT_SELECTOR = "[data-kapsula-header-contact]";
export const JIVO_WIDGET_TOGGLE_SELECTOR = 'jdiv[class*="iconWrap__"]';

export const KAPSULA_ROOT_SELECTOR = "[data-kapsula-hero]";

/**
 * Версия схемы сохранённого состояния.
 *
 * Ключи без версии остались от прежнего формата: значения оттуда применялись
 * к изменившемуся конфигу, из-за чего в форму попадали секции и опции,
 * которых в ней больше нет. Поднимайте версию при любом несовместимом
 * изменении структуры `formConfig.json`.
 */
export const SESSION_SCHEMA_VERSION = "v2";

export const SESSION_STORAGE_KEYS = {
  screen: "kapsula.currentScreen",
  capsule: "kapsula.selectedCapsule",
  legacyFormValues: "kapsula.formValues",
  formValuesPrefix: `kapsula.${SESSION_SCHEMA_VERSION}.formValues`,
  activeSectionPrefix: `kapsula.${SESSION_SCHEMA_VERSION}.activeSection`,
};

export const URL_SEARCH_KEYS = {
  screen: "screen",
  capsule: "capsule",
};

/**
 * Единственный источник правды для значений, которые раньше были
 * продублированы по модулям (медиазапросы, id счётчика, селекторы хедера,
 * ключи sessionStorage).
 */

export const DESKTOP_MEDIA_QUERY = "(min-width: 993px)";
export const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

export const METRIKA_COUNTER_ID = 96674199;

export const HEADER_SELECTORS = {
  desktopHost: 'div[class*="HeaderMenuBar_container"] > div',
  mobileHost: 'div[class*="HeaderMobile_rightGroup__"]',
  icons: 'div[class*="HeaderTopBar_iconContainer__"]',
  jivoToggle: 'jdiv[class*="iconWrap__"]',
};

export const KAPSULA_ROOT_SELECTOR = "[data-kapsula-hero]";
export const ROUTE_ATTRIBUTE = "data-kapsula-constructor-route";

export const SESSION_STORAGE_KEYS = {
  screen: "kapsula.currentScreen",
  capsule: "kapsula.selectedCapsule",
  legacyFormValues: "kapsula.formValues",
  formValuesPrefix: "kapsula.formValues",
  activeSectionPrefix: "kapsula.activeSection",
};

export const URL_SEARCH_KEYS = {
  screen: "screen",
  capsule: "capsule",
};

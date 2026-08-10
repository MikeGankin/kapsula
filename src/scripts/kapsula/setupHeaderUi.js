import {reachGoal} from "./analytics.js";
import {DESKTOP_MEDIA_QUERY, HEADER_SELECTORS, ROUTE_ATTRIBUTE} from "./constants.js";
import {createCallToActionButton} from "./createCallToActionButton.js";
import {createHeaderLogo} from "./createHeaderLogo.js";
import {getMediaQuery, isDesktopViewport} from "./mediaQuery.js";

const DESKTOP_HEADER_SELECTOR = HEADER_SELECTORS.desktopHost;
const HEADER_ICONS_SELECTOR = HEADER_SELECTORS.icons;
const MOBILE_HEADER_SELECTOR = HEADER_SELECTORS.mobileHost;
const JIVO_WIDGET_TOGGLE_SELECTOR = HEADER_SELECTORS.jivoToggle;
const INJECTED_LOGO_CLASS = "HeaderLogo_container__MHYx4";
const INJECTED_LOGO_LINK_CLASS = "HeaderLogo_headerLogo__caiMB";
const CTA_BUTTON_SELECTOR = ".kapsula-button--header";
const SECONDARY_LOGO_SELECTOR = ".kapsula-header-logo";
const ICONS_ANCHOR_ATTRIBUTE = "data-kapsula-icons-anchor";
const ICONS_ANCHOR_SELECTOR = `[${ICONS_ANCHOR_ATTRIBUTE}]`;

function isTargetRouteActive() {
  return document.body?.hasAttribute(ROUTE_ATTRIBUTE) === true;
}

function openJivoWidget() {
  if (typeof window.jivo_api?.open === "function") {
    window.jivo_api.open();
    reachGoal("capsule_jivo");

    return;
  }

  const widgetToggle = document.querySelector(JIVO_WIDGET_TOGGLE_SELECTOR);

  if (!widgetToggle) {
    return;
  }

  widgetToggle.style.removeProperty("display");
  widgetToggle.click();
}

function bindHeaderButtonAction(button) {
  if (button.dataset.jivoBound === "1") {
    return button;
  }

  button.addEventListener("click", openJivoWidget);
  button.dataset.jivoBound = "1";

  return button;
}

function ensureHeaderButton() {
  const headerButton = document.querySelector(CTA_BUTTON_SELECTOR) ?? createCallToActionButton('Cвязаться с менеджером');

  return bindHeaderButtonAction(headerButton);
}

function moveHeaderButton(desktopHost) {
  if (!isTargetRouteActive()) {
    return;
  }

  const mobileHost = document.querySelector(MOBILE_HEADER_SELECTOR);
  const targetHost = isDesktopViewport() ? desktopHost : mobileHost;

  if (!targetHost) {
    return;
  }

  const ctaButton = ensureHeaderButton();

  if (ctaButton.parentElement !== targetHost) {
    targetHost.append(ctaButton);
  }
}

/**
 * Плейсхолдер на месте иконок хедера.
 *
 * Раньше исходная позиция хранилась ссылкой на `parent` + `nextSibling`, но
 * после ре-рендера React эти узлы отсоединяются (`isConnected === false`),
 * и иконки навсегда оставались в нашем контейнере. Маркер живёт в DOM хоста
 * и переживает ре-рендер вместе с ним.
 */
function createIconsAnchor() {
  const anchor = document.createElement("span");
  anchor.setAttribute(ICONS_ANCHOR_ATTRIBUTE, "");
  anchor.hidden = true;

  return anchor;
}

function rememberIconsPosition(headerIcons) {
  if (document.querySelector(ICONS_ANCHOR_SELECTOR)) {
    return;
  }

  headerIcons.parentElement?.insertBefore(createIconsAnchor(), headerIcons);
}

function restoreIconsPosition() {
  const headerIcons = document.querySelector(HEADER_ICONS_SELECTOR);
  const anchor = document.querySelector(ICONS_ANCHOR_SELECTOR);

  if (headerIcons && anchor?.isConnected) {
    anchor.replaceWith(headerIcons);
    return;
  }

  anchor?.remove();
}

export function createHeaderUi() {
  const desktopMediaQuery = getMediaQuery(DESKTOP_MEDIA_QUERY);
  let isMediaQueryBound = false;

  // Объявлена до `setup` через function declaration: обработчик и `setup`
  // ссылаются друг на друга, и hoisting здесь — единственный способ обойтись
  // без прокси-переменной.
  function handleDesktopMediaChange() {
    if (!isTargetRouteActive()) {
      return;
    }

    setup();
  }

  function setup() {
    if (!isTargetRouteActive()) {
      return;
    }

    const desktopHost = document.querySelector(DESKTOP_HEADER_SELECTOR);
    const headerIcons = document.querySelector(HEADER_ICONS_SELECTOR);
    const isDesktop = isDesktopViewport();

    if (isDesktop && desktopHost && headerIcons && headerIcons.parentElement !== desktopHost) {
      rememberIconsPosition(headerIcons);
      desktopHost.append(headerIcons);
    }

    if (isDesktop && desktopHost && !document.querySelector(SECONDARY_LOGO_SELECTOR)) {
      const secondaryLogo = createHeaderLogo({
        containerClassName: INJECTED_LOGO_CLASS,
        linkClassName: INJECTED_LOGO_LINK_CLASS,
        image: {
          width: 168,
          height: 36,
          alt: 'logo',
          src: 'https://b2ccdn.coral.ru/content/new-elite-service-logo.svg',
          loading: "eager",
        },
      });

      desktopHost.prepend(secondaryLogo);
    }

    moveHeaderButton(desktopHost);

    if (!isMediaQueryBound && desktopMediaQuery) {
      desktopMediaQuery.addEventListener("change", handleDesktopMediaChange);
      isMediaQueryBound = true;
    }
  }

  function cleanup() {
    if (isMediaQueryBound) {
      desktopMediaQuery?.removeEventListener("change", handleDesktopMediaChange);
      isMediaQueryBound = false;
    }

    document.querySelector(SECONDARY_LOGO_SELECTOR)?.remove();
    document.querySelector(CTA_BUTTON_SELECTOR)?.remove();
    restoreIconsPosition();
  }

  return {setup, cleanup};
}

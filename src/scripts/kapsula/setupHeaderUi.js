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
let isHeaderUiBound = false;
let originalHeaderIconsPosition = null;

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

function handleDesktopMediaChange() {
  if (!isTargetRouteActive()) {
    return;
  }

  setupHeaderUi();
}

export function cleanupHeaderUi() {
  const desktopMediaQuery = getMediaQuery(DESKTOP_MEDIA_QUERY);

  if (isHeaderUiBound) {
    desktopMediaQuery?.removeEventListener("change", handleDesktopMediaChange);
    isHeaderUiBound = false;
  }

  document.querySelector(SECONDARY_LOGO_SELECTOR)?.remove();
  document.querySelector(CTA_BUTTON_SELECTOR)?.remove();

  const headerIcons = document.querySelector(HEADER_ICONS_SELECTOR);

  if (headerIcons && originalHeaderIconsPosition?.parent?.isConnected) {
    const {parent, nextSibling} = originalHeaderIconsPosition;
    parent.insertBefore(headerIcons, nextSibling?.parentElement === parent ? nextSibling : null);
  }

  originalHeaderIconsPosition = null;
}

export function setupHeaderUi() {
  if (!isTargetRouteActive()) {
    return;
  }

  const desktopHost = document.querySelector(DESKTOP_HEADER_SELECTOR);
  const headerIcons = document.querySelector(HEADER_ICONS_SELECTOR);
  const desktopMediaQuery = getMediaQuery(DESKTOP_MEDIA_QUERY);
  const isDesktop = isDesktopViewport();

  if (isDesktop && desktopHost && headerIcons && headerIcons.parentElement !== desktopHost) {
    originalHeaderIconsPosition ??= {
      parent: headerIcons.parentElement,
      nextSibling: headerIcons.nextSibling,
    };
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

  if (!isHeaderUiBound && desktopMediaQuery) {
    desktopMediaQuery.addEventListener("change", handleDesktopMediaChange);
    isHeaderUiBound = true;
  }
}

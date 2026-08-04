import {createCallToActionButton} from "./createCallToActionButton.js";
import {createHeaderLogo} from "./createHeaderLogo.js";

const DESKTOP_HEADER_SELECTOR = 'div[class*="HeaderMenuBar_container"] > div';
const HEADER_ICONS_SELECTOR = 'div[class*="HeaderTopBar_iconContainer__"]';
const MOBILE_HEADER_SELECTOR = 'div[class*="HeaderMobile_rightGroup__"]';
const JIVO_WIDGET_TOGGLE_SELECTOR = 'jdiv[class*="iconWrap__"]';
const INJECTED_LOGO_CLASS = "HeaderLogo_container__MHYx4";
const INJECTED_LOGO_LINK_CLASS = "HeaderLogo_headerLogo__caiMB";
const CTA_BUTTON_SELECTOR = ".kapsula-button--header";
const SECONDARY_LOGO_SELECTOR = ".kapsula-header-logo";
const DESKTOP_HEADER_QUERY = "(min-width: 993px)";
const ROUTE_ATTRIBUTE = "data-kapsula-constructor-route";
let isHeaderUiBound = false;
let originalHeaderIconsPosition = null;

function isTargetRouteActive() {
  return document.body?.hasAttribute(ROUTE_ATTRIBUTE) === true;
}

function openJivoWidget() {
  if (typeof window.jivo_api?.open === "function") {
    window.jivo_api.open();
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
  const targetHost = window.matchMedia(DESKTOP_HEADER_QUERY).matches ? desktopHost : mobileHost;

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
  const desktopMediaQuery = window.matchMedia(DESKTOP_HEADER_QUERY);

  if (isHeaderUiBound) {
    desktopMediaQuery.removeEventListener("change", handleDesktopMediaChange);
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
  const desktopMediaQuery = window.matchMedia(DESKTOP_HEADER_QUERY);

  if (desktopMediaQuery.matches && desktopHost && headerIcons && headerIcons.parentElement !== desktopHost) {
    originalHeaderIconsPosition ??= {
      parent: headerIcons.parentElement,
      nextSibling: headerIcons.nextSibling,
    };
    desktopHost.append(headerIcons);
  }

  if (desktopMediaQuery.matches && desktopHost && !document.querySelector(SECONDARY_LOGO_SELECTOR)) {
    const secondaryLogo = createHeaderLogo({
      containerClassName: INJECTED_LOGO_CLASS,
      linkClassName: INJECTED_LOGO_LINK_CLASS,
      image: {
        width: 168,
        height: 36,
        alt: 'logo',
        src: 'https://b2ccdn.coral.ru/content/elite-service-logo.svg',
        loading: "eager",
      },
    });

    desktopHost.prepend(secondaryLogo);
  }

  moveHeaderButton(desktopHost);

  if (!isHeaderUiBound) {
    desktopMediaQuery.addEventListener("change", handleDesktopMediaChange);
    isHeaderUiBound = true;
  }
}

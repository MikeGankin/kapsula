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
let isHeaderUiBound = false;

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

export function setupHeaderUi() {
  const desktopHost = document.querySelector(DESKTOP_HEADER_SELECTOR);
  const headerIcons = document.querySelector(HEADER_ICONS_SELECTOR);
  const desktopMediaQuery = window.matchMedia(DESKTOP_HEADER_QUERY);

  if (desktopMediaQuery.matches && desktopHost && headerIcons && headerIcons.parentElement !== desktopHost) {
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
    desktopMediaQuery.addEventListener("change", () => moveHeaderButton(document.querySelector(DESKTOP_HEADER_SELECTOR)));
    isHeaderUiBound = true;
  }
}

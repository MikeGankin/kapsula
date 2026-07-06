import {createCallToActionButton} from "./createCallToActionButton.js";
import {createHeaderLogo} from "./createHeaderLogo.js";

const HEADER_ICONS_SELECTOR = 'div[class*="HeaderTopBar_iconContainer__"]';
const INJECTED_LOGO_CLASS = "HeaderLogo_container__MHYx4";
const INJECTED_LOGO_LINK_CLASS = "HeaderLogo_headerLogo__caiMB";
const CTA_BUTTON_SELECTOR = ".kapsula-button--header";
const SECONDARY_LOGO_SELECTOR = ".kapsula-header-logo";

export function setupHeaderUi(menuHost) {
  const headerIcons = document.querySelector(HEADER_ICONS_SELECTOR);

  if (headerIcons && headerIcons.parentElement !== menuHost) {
    menuHost.append(headerIcons);
  }

  if (!document.querySelector(SECONDARY_LOGO_SELECTOR)) {
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

    menuHost.prepend(secondaryLogo);
  }

  if (!document.querySelector(CTA_BUTTON_SELECTOR)) {
    const ctaButton = createCallToActionButton('Cвязаться с менеджером');
    menuHost.append(ctaButton);
  }
}

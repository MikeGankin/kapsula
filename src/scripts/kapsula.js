import {hostReactAppReady, reactDomObserver} from "../utils/utils.js";
import {gsap} from "gsap";
import {KAPSULA_ANIMATION} from "./kapsula/animationConfig.js";
import {createCallToActionButton} from "./kapsula/createCallToActionButton.js";
import {createHeaderLogo} from "./kapsula/createHeaderLogo.js";
import {createReactiveForm} from "./kapsula/createReactiveForm.js";
import {
  readCurrentScreen,
  readSelectedCapsule,
  saveSelectedCapsule,
} from "./kapsula/sessionState.js";
import {getScreenNodes} from "./kapsula/screenNodes.js";
import {buildScreenRegistry} from "./kapsula/screenRegistry.js";
import {
  restoreScreen,
  setActiveProgressStep,
  transitionBetweenScreens,
} from "./kapsula/screenTransition.js";

const CTA_HOST_SELECTOR = 'div[class*="HeaderMenuNonProductSearch_nonProductSearchContainer__"]';
const LOGO_HOST_SELECTOR = 'div[class*="HeaderTopBar_headerTopBar"] div';
const INJECTED_LOGO_CLASS = "HeaderLogo_container__MHYx4";
const INJECTED_LOGO_LINK_CLASS = "HeaderLogo_headerLogo__caiMB";
const CTA_BUTTON_SELECTOR = ".kapsula-button--header";
const SECONDARY_LOGO_SELECTOR = ".kapsula-header-logo";
const STEP_TO_SCREEN = {
  steps: "steps",
  styles: "styles",
  capsule: "form",
};

function animateHero() {
  const {selectors, initial, timeline: timelineConfig} = KAPSULA_ANIMATION.heroReveal;

  const hero = document.querySelector(selectors.hero);
  if (!hero || hero.dataset.animated === "1") return;

  const content = hero.querySelector(selectors.content);
  const eyebrow = hero.querySelector(selectors.eyebrow);
  const title = hero.querySelector(selectors.title);
  const subtitle = hero.querySelector(selectors.subtitle);
  const startButton = hero.querySelector(selectors.startButton);
  const backdrop = hero.querySelector(selectors.backdrop);

  if (!content || !eyebrow || !title || !subtitle || !startButton || !backdrop) return;

  hero.dataset.animated = "1";

  gsap.set([title, subtitle, startButton], {
    autoAlpha: 0,
    y: initial.contentY,
  });

  gsap.set(eyebrow, {
    autoAlpha: 1,
    y: 0,
  });

  gsap.set(backdrop, {
    scale: initial.backdropScale,
  });

  const timeline = gsap.timeline({
    defaults: timelineConfig.defaults,
  });

  timeline
    .to(backdrop, timelineConfig.backdrop)
    .to(title, {
      autoAlpha: timelineConfig.title.autoAlpha,
      y: timelineConfig.title.y,
      duration: timelineConfig.title.duration,
    }, timelineConfig.title.at)
    .to(subtitle, {
      autoAlpha: timelineConfig.subtitle.autoAlpha,
      y: timelineConfig.subtitle.y,
      duration: timelineConfig.subtitle.duration,
    }, timelineConfig.subtitle.at)
    .to(startButton, {
      autoAlpha: timelineConfig.startButton.autoAlpha,
      y: timelineConfig.startButton.y,
      duration: timelineConfig.startButton.duration,
    }, timelineConfig.startButton.at);
}

function setupScreenTransition() {
  const hero = document.querySelector(KAPSULA_ANIMATION.heroReveal.selectors.hero);
  if (!hero || hero.dataset.transitionBound === "1") return;

  const {initial, timeline: timelineConfig} = KAPSULA_ANIMATION.screenTransition;
  const screenNodes = getScreenNodes(hero);

  if (!screenNodes) return;

  const {
    heroScreen,
    stepsScreen,
    stylesScreen,
    formScreen,
    stepsTitle,
    stepsCards,
    stepsNote,
    stepsButton,
    stepsProgress,
    stylesTitle,
    styleCards,
    styleCardButtons,
    formTitle,
    formSubtitle,
    formAside,
    formBody,
    progressButtons,
    startButton,
  } = screenNodes;
  const formExperience = formScreen
    ? createReactiveForm(formScreen, {
      initialCapsuleId: readSelectedCapsule(),
    })
    : null;

  if (!formExperience) return;

  hero.dataset.transitionBound = "1";

  gsap.set(stepsScreen, {
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
  });

  gsap.set(stylesScreen, {
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
  });

  gsap.set(formScreen, {
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
  });

  gsap.set([stepsTitle, ...stepsCards, stepsNote, stepsButton, stepsProgress], {
    autoAlpha: 0,
    y: initial.y,
  });

  gsap.set([stylesTitle, ...styleCards], {
    autoAlpha: 0,
    y: initial.y,
  });

  gsap.set([formTitle, formSubtitle, formAside, formBody], {
    autoAlpha: 0,
    y: initial.y,
  });

  setActiveProgressStep(hero, "steps");
  hero.dataset.screen = "hero";

  const screenRegistry = buildScreenRegistry(screenNodes, timelineConfig);
  const transitionToScreen = (fromKey, toKey) => transitionBetweenScreens({
    fromKey,
    hero,
    heroScreen,
    initial,
    screenRegistry,
    timelineConfig,
    toKey,
  });

  startButton.addEventListener("click", () => {
    if (hero.dataset.screen === "steps") return;

    const timeline = transitionToScreen("hero", "steps");

    if (timeline) {
      timeline.to(stepsProgress, {
        autoAlpha: timelineConfig.stepsProgress.autoAlpha,
        y: timelineConfig.stepsProgress.y,
        duration: timelineConfig.stepsProgress.duration,
      }, timelineConfig.stepsProgress.at);
    }
  });

  stepsButton.addEventListener("click", () => {
    if (hero.dataset.screen === "styles") return;

    transitionToScreen("steps", "styles");
  });

  styleCardButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (hero.dataset.screen === "form") return;

      const capsuleId = button.dataset.kapsulaCapsule;

      if (capsuleId && formExperience.setCapsule(capsuleId)) {
        saveSelectedCapsule(capsuleId);
      } else {
        return;
      }

      transitionToScreen("styles", "form");
    });
  });

  progressButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetStep = button.dataset.kapsulaProgressTarget;
      const targetScreen = STEP_TO_SCREEN[targetStep];
      const currentScreen = hero.dataset.screen;

      if (!targetScreen || !currentScreen || currentScreen === "hero" || currentScreen === targetScreen) {
        return;
      }

      transitionToScreen(currentScreen, targetScreen);
    });
  });

  restoreScreen({
    hero,
    heroScreen,
    initial,
    screenKey: readCurrentScreen(),
    screenRegistry,
    stepsProgress,
  });
}

export default async function kapsula() {
  await hostReactAppReady();

  const domWatcher = reactDomObserver();

  if (!document.querySelector(CTA_BUTTON_SELECTOR)) {
    const ctaButton = createCallToActionButton('Cвязаться с менеджером');
    const buttonHost = await domWatcher.waitElement(CTA_HOST_SELECTOR);
    buttonHost.insertAdjacentElement('afterend', ctaButton);
  }

  if (!document.querySelector(SECONDARY_LOGO_SELECTOR)) {
    const logoHost = await domWatcher.waitElement(LOGO_HOST_SELECTOR);
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

    logoHost.prepend(secondaryLogo);
  }

  animateHero();
  setupScreenTransition();
}

import {hostReactAppReady, reactDomObserver} from "../utils/utils.js";
import {gsap} from "gsap";
import {KAPSULA_ANIMATION} from "./kapsula/animationConfig.js";
import {createCallToActionButton} from "./kapsula/createCallToActionButton.js";
import {createHeaderLogo} from "./kapsula/createHeaderLogo.js";
import {createReactiveForm} from "./kapsula/createReactiveForm.js";

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

function setActiveProgressStep(hero, stepName) {
  const progressItems = hero.querySelectorAll(KAPSULA_ANIMATION.screenTransition.selectors.progressItem);

  progressItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.kapsulaProgressItem === stepName);
  });
}

function setScreenState(screenNode, {visible, interactive}) {
  if (!screenNode) return;

  screenNode.style.visibility = visible ? "visible" : "hidden";
  screenNode.style.pointerEvents = interactive ? "auto" : "none";
  screenNode.setAttribute("aria-hidden", visible ? "false" : "true");
}

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

  const {selectors, initial, timeline: timelineConfig} = KAPSULA_ANIMATION.screenTransition;
  const heroScreen = hero.querySelector(selectors.heroScreen);
  const stepsScreen = hero.querySelector(selectors.stepsScreen);
  const stylesScreen = hero.querySelector(selectors.stylesScreen);
  const formScreen = hero.querySelector(selectors.formScreen);
  const stepsTitle = hero.querySelector(selectors.stepsTitle);
  const stepsCards = hero.querySelectorAll(selectors.stepsCards);
  const stepsNote = hero.querySelector(selectors.stepsNote);
  const stepsButton = hero.querySelector(selectors.stepsButton);
  const stepsProgress = hero.querySelector(selectors.stepsProgress);
  const stylesTitle = hero.querySelector(selectors.stylesTitle);
  const styleCards = hero.querySelectorAll(selectors.styleCards);
  const styleCardButtons = hero.querySelectorAll(selectors.styleCardButtons);
  const formTitle = hero.querySelector(selectors.formTitle);
  const formSubtitle = hero.querySelector(selectors.formSubtitle);
  const formAside = hero.querySelector(selectors.formAside);
  const formBody = hero.querySelector(selectors.formBody);
  const progressButtons = hero.querySelectorAll(selectors.progressButton);
  const startButton = hero.querySelector(KAPSULA_ANIMATION.heroReveal.selectors.startButton);
  const formExperience = formScreen ? createReactiveForm(formScreen) : null;

  if (
    !heroScreen ||
    !stepsScreen ||
    !stylesScreen ||
    !formScreen ||
    !stepsTitle ||
    !stepsCards.length ||
    !stepsNote ||
    !stepsButton ||
    !stepsProgress ||
    !stylesTitle ||
    !styleCards.length ||
    !styleCardButtons.length ||
    !formTitle ||
    !formSubtitle ||
    !formAside ||
    !formBody ||
    !progressButtons.length ||
    !startButton ||
    !formExperience
  ) {
    return;
  }

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

  const screenRegistry = {
    steps: {
      stepName: "steps",
      node: stepsScreen,
      elements: [stepsTitle, ...stepsCards, stepsNote, stepsButton],
      reveal: timelineConfig.stepsScreen,
      animations: [
        {node: stepsTitle, config: timelineConfig.stepsTitle},
        {node: stepsCards, config: timelineConfig.stepsCards},
        {node: stepsNote, config: timelineConfig.stepsNote},
        {node: stepsButton, config: timelineConfig.stepsButton},
      ],
    },
    styles: {
      stepName: "styles",
      node: stylesScreen,
      elements: [stylesTitle, ...styleCards],
      reveal: timelineConfig.stylesScreen,
      animations: [
        {node: stylesTitle, config: timelineConfig.stylesTitle},
        {node: styleCards, config: timelineConfig.styleCards},
      ],
    },
    form: {
      stepName: "capsule",
      node: formScreen,
      elements: [formTitle, formSubtitle, formAside, formBody],
      reveal: timelineConfig.formScreen,
      animations: [
        {node: formTitle, config: timelineConfig.formTitle},
        {node: formSubtitle, config: timelineConfig.formSubtitle},
        {node: formAside, config: timelineConfig.formAside},
        {node: formBody, config: timelineConfig.formBody},
      ],
    },
  };

  function transitionBetweenScreens(fromKey, toKey) {
    if (fromKey === toKey) return;

    const fromScreen = fromKey === "hero" ? heroScreen : screenRegistry[fromKey];
    const toScreen = screenRegistry[toKey];

    if (!toScreen) return;

    if (fromKey === "hero") {
      heroScreen.setAttribute("aria-hidden", "true");
    } else {
      setScreenState(fromScreen.node, {visible: false, interactive: false});
    }

    setScreenState(toScreen.node, {visible: true, interactive: true});
    setActiveProgressStep(hero, toScreen.stepName);
    hero.dataset.screen = toKey;

    const timeline = gsap.timeline({
      defaults: timelineConfig.defaults,
    });

    timeline
      .set(toScreen.node, {
        visibility: "visible",
      });

    if (fromKey === "hero") {
      timeline
        .to(heroScreen, timelineConfig.heroScreen)
        .set(heroScreen, {
          visibility: "hidden",
          pointerEvents: "none",
        });
    } else {
      timeline
        .to(fromScreen.node, timelineConfig.heroScreen)
        .set(fromScreen.node, {
          visibility: "hidden",
          pointerEvents: "none",
        });
    }

    gsap.set(toScreen.elements, {
      autoAlpha: 0,
      y: initial.y,
    });

    timeline.to(toScreen.node, {
      opacity: toScreen.reveal.opacity,
      duration: toScreen.reveal.duration,
      pointerEvents: "auto",
    }, toScreen.reveal.at);

    toScreen.animations.forEach(({node, config}) => {
      timeline.to(node, {
        autoAlpha: config.autoAlpha,
        y: config.y,
        duration: config.duration,
        ...(config.stagger ? {stagger: config.stagger} : {}),
      }, config.at);
    });

    return timeline;
  }

  startButton.addEventListener("click", () => {
    if (hero.dataset.screen === "steps") return;

    const timeline = transitionBetweenScreens("hero", "steps");

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

    transitionBetweenScreens("steps", "styles");
  });

  styleCardButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (hero.dataset.screen === "form") return;

      const capsuleId = button.dataset.kapsulaCapsule;

      if (capsuleId) {
        formExperience.setCapsule(capsuleId);
      }

      transitionBetweenScreens("styles", "form");
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

      transitionBetweenScreens(currentScreen, targetScreen);
    });
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

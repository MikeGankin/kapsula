import {gsap} from "gsap";
import {KAPSULA_ANIMATION} from "./animationConfig.js";
import {saveCurrentScreen} from "./sessionState.js";

export function setActiveProgressStep(hero, stepName) {
  const progressItems = hero.querySelectorAll(KAPSULA_ANIMATION.screenTransition.selectors.progressItem);

  progressItems.forEach((item) => {
    const isActive = item.dataset.kapsulaProgressItem === stepName;
    const button = item.querySelector(KAPSULA_ANIMATION.screenTransition.selectors.progressButton);

    item.classList.toggle("is-active", isActive);

    if (!button) return;

    if (isActive) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

export function setScreenState(screenNode, {visible, interactive}) {
  if (!screenNode) return;

  screenNode.style.visibility = visible ? "visible" : "hidden";
  screenNode.style.pointerEvents = interactive ? "auto" : "none";
  screenNode.setAttribute("aria-hidden", visible ? "false" : "true");
}

export function restoreScreen({
  hero,
  heroScreen,
  initial,
  screenKey,
  screenRegistry,
  stepsProgress,
}) {
  if (screenKey === "hero") {
    heroScreen.setAttribute("aria-hidden", "false");
    gsap.set(heroScreen, {
      autoAlpha: 1,
      visibility: "visible",
      pointerEvents: "auto",
    });

    Object.values(screenRegistry).forEach((screen) => {
      setScreenState(screen.node, {visible: false, interactive: false});
      gsap.set(screen.node, {
        opacity: 0,
        y: 0,
      });
      gsap.set(screen.elements, {
        autoAlpha: 0,
        y: initial.y,
      });
    });

    gsap.set(stepsProgress, {
      autoAlpha: 0,
      y: initial.y,
    });

    setActiveProgressStep(hero, "steps");
    hero.dataset.screen = "hero";
    saveCurrentScreen("hero");

    return true;
  }

  const restoredScreen = screenRegistry[screenKey];

  if (!restoredScreen) return false;

  heroScreen.setAttribute("aria-hidden", "true");
  gsap.set(heroScreen, {
    visibility: "hidden",
    pointerEvents: "none",
  });

  Object.values(screenRegistry).forEach((screen) => {
    const isCurrent = screen === restoredScreen;

    setScreenState(screen.node, {visible: isCurrent, interactive: isCurrent});
    gsap.set(screen.node, {
      opacity: isCurrent ? 1 : 0,
      y: 0,
    });
    gsap.set(screen.elements, {
      autoAlpha: isCurrent ? 1 : 0,
      y: isCurrent ? 0 : initial.y,
    });
  });

  gsap.set(stepsProgress, {
    autoAlpha: 1,
    y: 0,
  });

  setActiveProgressStep(hero, restoredScreen.stepName);
  hero.dataset.screen = screenKey;
  saveCurrentScreen(screenKey);

  return true;
}

export function transitionBetweenScreens({
  fromKey,
  hero,
  heroScreen,
  initial,
  screenRegistry,
  timelineConfig,
  toKey,
}) {
  if (fromKey === toKey) return null;

  const fromScreen = fromKey === "hero" ? heroScreen : screenRegistry[fromKey];
  const toScreen = screenRegistry[toKey];

  if (!toScreen) return null;

  if (fromKey === "hero") {
    heroScreen.setAttribute("aria-hidden", "true");
  } else {
    setScreenState(fromScreen.node, {visible: false, interactive: false});
  }

  setScreenState(toScreen.node, {visible: true, interactive: true});
  setActiveProgressStep(hero, toScreen.stepName);
  hero.dataset.screen = toKey;
  saveCurrentScreen(toKey);

  const timeline = gsap.timeline({
    defaults: timelineConfig.defaults,
  });

  timeline
    .set(toScreen.node, {
      visibility: "visible",
      y: 0,
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
        y: 0,
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

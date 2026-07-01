import {gsap} from "gsap";
import {KAPSULA_ANIMATION} from "./animationConfig.js";
import {saveCurrentScreen} from "./sessionState.js";

export function setActiveProgressStep(hero, stepName) {
  const progressItems = hero.querySelectorAll(KAPSULA_ANIMATION.screenTransition.selectors.progressItem);

  progressItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.kapsulaProgressItem === stepName);
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

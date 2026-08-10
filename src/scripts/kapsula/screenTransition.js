import {gsap} from "gsap";
import {saveCurrentScreen} from "./sessionState.js";
import {getMotionDuration, getMotionOffset} from "./motionPreferences.js";

function emitScreenChange(hero, screenKey) {
  hero.dispatchEvent(new CustomEvent("kapsula:screen-change", {
    detail: {screenKey},
  }));
}

export function setScreenState(screenNode, {visible, interactive}) {
  if (!screenNode) return;

  screenNode.style.visibility = visible ? "visible" : "hidden";
  screenNode.style.pointerEvents = interactive ? "auto" : "none";
  screenNode.inert = !interactive;
  screenNode.setAttribute("aria-hidden", visible ? "false" : "true");
}

export function restoreScreen({
  hero,
  heroScreen,
  initial,
  screenKey,
  screenRegistry,
}) {
  if (screenKey === "hero") {
    heroScreen.setAttribute("aria-hidden", "false");
    heroScreen.inert = false;
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
        y: getMotionOffset(initial.y),
      });
    });

    hero.dataset.screen = "hero";
    saveCurrentScreen("hero");
    emitScreenChange(hero, "hero");

    return true;
  }

  const restoredScreen = screenRegistry[screenKey];

  if (!restoredScreen) return false;

  heroScreen.setAttribute("aria-hidden", "true");
  heroScreen.inert = true;
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
      // Смещение скрытых экранов тоже проходит через getMotionOffset:
      // при `prefers-reduced-motion` элементы должны стоять на месте,
      // иначе возврат на такой экран даёт рывок по вертикали.
      y: isCurrent ? 0 : getMotionOffset(initial.y),
    });
  });

  hero.dataset.screen = screenKey;
  saveCurrentScreen(screenKey);
  emitScreenChange(hero, screenKey);

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

  const fromScreen = fromKey === "hero" ? null : screenRegistry[fromKey];
  const fromScreenNode = fromKey === "hero" ? heroScreen : fromScreen?.node;
  const toScreen = screenRegistry[toKey];

  if (!fromScreenNode || !toScreen) return null;

  fromScreenNode.inert = true;
  fromScreenNode.setAttribute("aria-hidden", "true");
  fromScreenNode.style.pointerEvents = "none";

  toScreen.node.inert = true;
  toScreen.node.setAttribute("aria-hidden", "true");
  hero.dataset.screen = toKey;
  saveCurrentScreen(toKey);

  const timeline = gsap.timeline({
    defaults: timelineConfig.defaults,
  });

  gsap.set(toScreen.elements, {
    autoAlpha: 0,
    y: getMotionOffset(initial.y),
  });

  timeline.set(toScreen.node, {
    opacity: 0,
    visibility: "visible",
    pointerEvents: "none",
    y: 0,
  });

  emitScreenChange(hero, toKey);

  const exitConfig = fromKey === "hero"
    ? timelineConfig.heroScreen
    : timelineConfig.exitScreen;

  timeline.to(fromScreenNode, {
    opacity: exitConfig.opacity,
    duration: getMotionDuration(exitConfig.duration),
    pointerEvents: "none",
  }, 0);

  timeline.to(toScreen.node, {
    opacity: toScreen.reveal.opacity,
    duration: getMotionDuration(toScreen.reveal.duration),
  }, getMotionDuration(exitConfig.duration) * 0.45);

  toScreen.animations.forEach(({node, config}) => {
    timeline.to(node, {
      autoAlpha: config.autoAlpha,
      y: config.y,
      duration: getMotionDuration(config.duration),
      ...(config.stagger ? {stagger: config.stagger} : {}),
    }, config.at);
  });

  timeline.call(() => {
    setScreenState(fromScreenNode, {visible: false, interactive: false});
    setScreenState(toScreen.node, {visible: true, interactive: true});
  });

  return timeline;
}

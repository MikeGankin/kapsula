import {KAPSULA_ANIMATION} from "./animationConfig.js";
import {saveSelectedCapsule} from "./sessionState.js";
import {transitionBetweenScreens} from "./screenTransition.js";
import {getMotionDuration} from "./motionPreferences.js";

const STEP_TO_SCREEN = {
  steps: "steps",
  styles: "styles",
  capsule: "form",
};

export function bindScreenActions({
  formExperience,
  hero,
  progressButtons,
  screenRegistry,
  screenNodes,
  timelineConfig,
}) {
  const {
    heroScreen,
    stepsButton,
    stepsProgress,
    startButton,
    styleCardButtons,
  } = screenNodes;
  const initial = KAPSULA_ANIMATION.screenTransition.initial;
  let activeTimeline = null;

  const transitionToScreen = (fromKey, toKey) => {
    if (activeTimeline) {
      return null;
    }

    const timeline = transitionBetweenScreens({
      fromKey,
      hero,
      heroScreen,
      initial,
      screenRegistry,
      timelineConfig,
      toKey,
    });

    if (timeline) {
      activeTimeline = timeline;
      timeline.eventCallback("onComplete", () => {
        if (activeTimeline === timeline) {
          activeTimeline = null;
        }
      });
    }

    return timeline;
  };

  const handleClick = (event) => {
    if (!(event.target instanceof Element)) return;
    const startButtonNode = event.target.closest(".kapsula-button--hero");

    if (startButtonNode) {
      if (hero.dataset.screen === "steps") return;

      const timeline = transitionToScreen("hero", "steps");

      if (timeline) {
        timeline.to(stepsProgress, {
          autoAlpha: timelineConfig.stepsProgress.autoAlpha,
          y: timelineConfig.stepsProgress.y,
          duration: getMotionDuration(timelineConfig.stepsProgress.duration),
        }, timelineConfig.stepsProgress.at);
      }

      return;
    }

    const stepsButtonNode = event.target.closest(".kapsula-button--steps");

    if (stepsButtonNode) {
      if (hero.dataset.screen === "styles") return;

      transitionToScreen("steps", "styles");
      return;
    }

    const styleButtonNode = event.target.closest(".kapsula-style-card .kapsula-button");

    if (styleButtonNode) {
      event.preventDefault();

      if (hero.dataset.screen === "form") return;

      const capsuleId = styleButtonNode.dataset.kapsulaCapsule;

      if (capsuleId && formExperience.setCapsule(capsuleId)) {
        saveSelectedCapsule(capsuleId);
      } else {
        return;
      }

      transitionToScreen("styles", "form");
      return;
    }

    const progressButtonNode = event.target.closest("[data-kapsula-progress-target]");

    if (progressButtonNode) {
      const targetStep = progressButtonNode.dataset.kapsulaProgressTarget;
      const targetScreen = STEP_TO_SCREEN[targetStep];
      const currentScreen = hero.dataset.screen;

      if (!targetScreen || !currentScreen || currentScreen === "hero" || currentScreen === targetScreen) {
        return;
      }

      transitionToScreen(currentScreen, targetScreen);
    }
  };

  hero.addEventListener("click", handleClick);

  return () => {
    hero.removeEventListener("click", handleClick);
    activeTimeline?.kill();
    activeTimeline = null;
  };
}

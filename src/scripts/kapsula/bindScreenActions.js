import {KAPSULA_ANIMATION} from "./animationConfig.js";
import {saveSelectedCapsule} from "./sessionState.js";
import {transitionBetweenScreens} from "./screenTransition.js";

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
    button.addEventListener("click", (event) => {
      event.preventDefault();

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
}

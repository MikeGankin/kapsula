import {KAPSULA_ANIMATION} from "./animationConfig.js";
import {saveSelectedCapsule} from "./sessionState.js";
import {transitionBetweenScreens} from "./screenTransition.js";

export function bindScreenActions({
  formExperience,
  hero,
  screenRegistry,
  screenNodes,
  timelineConfig,
}) {
  const {
    heroScreen,
    stepsButton,
    startButton,
    styleCardButtons,
  } = screenNodes;
  const initial = KAPSULA_ANIMATION.screenTransition.initial;
  let activeTimeline = null;
  let pendingCapsuleId = null;

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

  const handleClick = async (event) => {
    if (!(event.target instanceof Element)) return;
    const backToStylesButtonNode = event.target.closest("[data-kapsula-back-to-styles]");

    if (backToStylesButtonNode) {
      if (hero.dataset.screen !== "form") return;

      transitionToScreen("form", "styles");
      return;
    }

    const startButtonNode = event.target.closest(".kapsula-button--hero");

    if (startButtonNode) {
      if (hero.dataset.screen === "steps") return;

      transitionToScreen("hero", "steps");

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

      if (hero.dataset.screen !== "styles") return;

      const capsuleId = styleButtonNode.dataset.kapsulaCapsule;

      if (!capsuleId) {
        return;
      }

      pendingCapsuleId = capsuleId;
      const isPrepared = await formExperience.prepareCapsule?.(capsuleId) ?? true;

      if (
        !isPrepared ||
        pendingCapsuleId !== capsuleId ||
        hero.dataset.screen !== "styles"
      ) {
        return;
      }

      pendingCapsuleId = null;

      if (!formExperience.setCapsule(capsuleId)) return;

      saveSelectedCapsule(capsuleId);

      transitionToScreen("styles", "form");
      return;
    }

  };

  hero.addEventListener("click", handleClick);

  return () => {
    pendingCapsuleId = null;
    hero.removeEventListener("click", handleClick);
    activeTimeline?.kill();
    activeTimeline = null;
  };
}

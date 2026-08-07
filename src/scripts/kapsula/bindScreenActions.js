import {KAPSULA_ANIMATION} from "./animationConfig.js";
import {saveSelectedCapsule} from "./sessionState.js";
import {transitionBetweenScreens} from "./screenTransition.js";

const METRIKA_STYLE_MAP = {
  asian: "asia",
  oriental: "east",
  island: "island",
};

export function bindScreenActions(
  {
    formExperience,
    hero,
    screenRegistry,
    screenNodes,
    timelineConfig,
  }) {
  const {
    heroScreen,
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

      window.ym?.(
        96674199,
        "reachGoal",
        "capsule_1_screen_button_go"
      );

      transitionToScreen("hero", "steps");

      return;
    }

    const stepsButtonNode = event.target.closest(".kapsula-button--steps");

    if (stepsButtonNode) {
      if (hero.dataset.screen === "styles") return;

      window.ym?.(
        96674199,
        "reachGoal",
        "capsule_2_screen_button_assemble"
      );

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

      const metrikaStyle = METRIKA_STYLE_MAP[capsuleId];

      if (metrikaStyle) {
        window.ym?.(
          96674199,
          "reachGoal",
          "capsule_3_screen_button_select_and_assemble",
          {
            style: metrikaStyle,
          }
        );
      }
      
      transitionToScreen("styles", "form");
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

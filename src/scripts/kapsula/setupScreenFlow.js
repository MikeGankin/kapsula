import {KAPSULA_ANIMATION} from "./animationConfig.js";
import {bindScreenActions} from "./bindScreenActions.js";
import {bindFormPopup} from "./bindFormPopup.js";
import {buildCapsuleHref} from "./buildCapsuleHref.js";
import {createReactiveForm} from "./createReactiveForm.js";
import {getScreenNodes} from "./screenNodes.js";
import {buildScreenRegistry} from "./screenRegistry.js";
import {readCurrentScreen, readSelectedCapsule} from "./sessionState.js";
import {setupInitialScreenState} from "./setupInitialScreenState.js";
import {restoreScreen, setActiveProgressStep} from "./screenTransition.js";
import {syncEmblaCarousel} from "./syncEmblaCarousel.js";
import {bindEmblaDots} from "./syncEmblaDots.js";

function bindStyleCardLinks(styleCardButtons) {
  styleCardButtons.forEach((button) => {
    const capsuleId = button.dataset.kapsulaCapsule;

    if (!capsuleId) return;

    button.setAttribute("href", buildCapsuleHref(capsuleId));
  });
}

export function setupScreenFlow() {
  const hero = document.querySelector(KAPSULA_ANIMATION.heroReveal.selectors.hero);
  if (!hero || hero.dataset.transitionBound === "1") return;

  const {initial, timeline: timelineConfig} = KAPSULA_ANIMATION.screenTransition;
  const screenNodes = getScreenNodes(hero);

  if (!screenNodes) return;

  const formExperience = createReactiveForm(screenNodes.formScreen, {
    initialCapsuleId: readSelectedCapsule(),
  });

  hero.dataset.transitionBound = "1";

  setupInitialScreenState(screenNodes, initial);
  setActiveProgressStep(hero, "steps");
  hero.dataset.screen = "hero";

  const screenRegistry = buildScreenRegistry(screenNodes, timelineConfig);

  bindStyleCardLinks(screenNodes.styleCardButtons);
  const stylesGridNode = hero.querySelector(".kapsula-styles__grid");
  const stylesPaginationNode = hero.querySelector("[data-kapsula-styles-pagination]");
  const stylesCarousel = syncEmblaCarousel(stylesGridNode, {
    align: "start",
    containScroll: "trimSnaps",
  });
  bindEmblaDots(stylesPaginationNode, stylesCarousel, {
    label: "Перейти к стилю",
  });

  const refreshStylesCarousel = () => {
    window.requestAnimationFrame(() => {
      stylesCarousel?.reInit();
    });
  };

  hero.addEventListener("kapsula:screen-change", (event) => {
    if (event.detail?.screenKey === "styles") {
      refreshStylesCarousel();
    }
  });

  if (hero.dataset.screen === "styles") {
    refreshStylesCarousel();
  }
  bindScreenActions({
    formExperience,
    hero,
    progressButtons: screenNodes.progressButtons,
    screenRegistry,
    screenNodes,
    timelineConfig,
  });

  restoreScreen({
    hero,
    heroScreen: screenNodes.heroScreen,
    initial,
    screenKey: readCurrentScreen(),
    screenRegistry,
    stepsProgress: screenNodes.stepsProgress,
  });

  bindFormPopup(formExperience, hero);
}

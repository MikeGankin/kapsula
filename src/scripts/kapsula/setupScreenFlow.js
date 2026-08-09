import {KAPSULA_ANIMATION} from "./animationConfig.js";
import {reachGoal} from "./analytics.js";
import {bindScreenActions} from "./bindScreenActions.js";
import {bindFormPopup} from "./bindFormPopup.js";
import {buildCapsuleHref} from "./buildCapsuleHref.js";
import {createReactiveForm} from "./createReactiveForm.js";
import {logError, logWarning} from "./logger.js";
import {getScreenNodes} from "./screenNodes.js";
import {buildScreenRegistry} from "./screenRegistry.js";
import {readCurrentScreen, readSelectedCapsule} from "./sessionState.js";
import {setupInitialScreenState} from "./setupInitialScreenState.js";
import {setupBackgroundVideo} from "./setupBackgroundVideo.js";
import {restoreScreen} from "./screenTransition.js";
import {destroyEmblaCarousel, syncEmblaCarousel} from "./syncEmblaCarousel.js";
import {bindEmblaDots} from "./syncEmblaDots.js";

/** Контракт: любой выход из `setupScreenFlow` возвращает функцию-cleanup. */
const NOOP_CLEANUP = () => {};

const SCREEN_SHOW_GOALS = {
  hero: "capsule_1_screen_show",
  steps: "capsule_2_screen_show",
  styles: "capsule_3_screen_show",
  form: "capsule_4_screen_show",
};

function bindStyleCardLinks(styleCardButtons) {
  styleCardButtons.forEach((button) => {
    const capsuleId = button.dataset.kapsulaCapsule;

    if (!capsuleId) return;

    button.setAttribute("href", buildCapsuleHref(capsuleId));
  });
}

export function setupScreenFlow(rootNode = document) {
  const hero = rootNode?.matches?.(KAPSULA_ANIMATION.heroReveal.selectors.hero)
    ? rootNode
    : rootNode?.querySelector?.(KAPSULA_ANIMATION.heroReveal.selectors.hero) ?? document.querySelector(KAPSULA_ANIMATION.heroReveal.selectors.hero);

  if (!hero) {
    logWarning("экранный флоу не запущен: корневой узел hero не найден");
    return NOOP_CLEANUP;
  }

  if (hero.dataset.transitionBound === "1") {
    return NOOP_CLEANUP;
  }

  const {initial, timeline: timelineConfig} = KAPSULA_ANIMATION.screenTransition;
  const screenNodes = getScreenNodes(hero);

  if (!screenNodes) {
    // Причину уже объяснил getScreenNodes — здесь только выходим,
    // не выставляя transitionBound, чтобы повторный монтаж мог сработать.
    return NOOP_CLEANUP;
  }

  hero.dataset.transitionBound = "1";

  const cleanupBackgroundVideo = setupBackgroundVideo(hero);

  setupInitialScreenState(screenNodes, initial);
  hero.dataset.screen = "hero";

  const screenRegistry = buildScreenRegistry(screenNodes, timelineConfig);
  const canInitForm = Boolean(
    screenNodes.formScreen &&
    screenNodes.formTitle &&
    screenNodes.formSubtitle &&
    screenNodes.formAside &&
    screenNodes.formBody &&
    screenRegistry.form,
  );

  let formExperience = {
    getSnapshot() {
      return {
        capsuleId: readSelectedCapsule() ?? null,
        capsule: null,
        values: {},
      };
    },
    setCapsule() {
      return false;
    },
  };

  if (canInitForm) {
    try {
      formExperience = createReactiveForm(screenNodes.formScreen, {
        initialCapsuleId: readSelectedCapsule(),
      });
    } catch (error) {
      logError("инициализация формы не удалась", error);
    }
  }

  bindStyleCardLinks(screenNodes.styleCardButtons);
  let stylesCarousel = null;
  let stylesGridNode = null;
  let unbindStylesDots = NOOP_CLEANUP;

  try {
    stylesGridNode = hero.querySelector(".kapsula-styles__grid");
    const stylesPaginationNode = hero.querySelector("[data-kapsula-styles-pagination]");

    stylesCarousel = syncEmblaCarousel(stylesGridNode, {
      align: "start",
      containScroll: "trimSnaps",
    });
    unbindStylesDots = bindEmblaDots(stylesPaginationNode, stylesCarousel, {
      label: "Перейти к стилю",
    });
  } catch (error) {
    logError("инициализация карусели стилей не удалась", error);
  }

  const refreshStylesCarousel = () => {
    window.requestAnimationFrame(() => {
      stylesCarousel?.reInit();
    });
  };

  const trackScreenShow = (screenKey) => {
    reachGoal(SCREEN_SHOW_GOALS[screenKey]);
  };

  const handleScreenChange = (event) => {
    const screenKey = event.detail?.screenKey;

    trackScreenShow(screenKey);

    if (screenKey === "styles") {
      refreshStylesCarousel();
    }
  };

  hero.addEventListener("kapsula:screen-change", handleScreenChange);

  if (hero.dataset.screen === "styles") {
    refreshStylesCarousel();
  }
  const unbindScreenActions = bindScreenActions({
    formExperience,
    hero,
    screenRegistry,
    screenNodes,
    timelineConfig,
  });

  const restoredScreen = readCurrentScreen();

  const didRestoreScreen = restoreScreen({
    hero,
    heroScreen: screenNodes.heroScreen,
    initial,
    screenKey: restoredScreen,
    screenRegistry,
  });

  if (!didRestoreScreen) {
    trackScreenShow("hero");
  }

  const unbindFormPopup = canInitForm
    ? bindFormPopup(formExperience, hero)
    : null;

  return () => {
    hero.removeEventListener("kapsula:screen-change", handleScreenChange);
    unbindScreenActions?.();
    unbindFormPopup?.();
    cleanupBackgroundVideo?.();
    formExperience.destroy?.();
    unbindStylesDots();
    destroyEmblaCarousel(stylesGridNode);
    delete hero.dataset.transitionBound;
  };
}

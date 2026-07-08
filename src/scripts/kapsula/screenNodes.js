import {KAPSULA_ANIMATION} from "./animationConfig.js";

function hasRequiredNodes(nodes) {
  return Boolean(
    nodes.heroScreen &&
      nodes.stepsScreen &&
      nodes.stylesScreen &&
      nodes.formScreen &&
      nodes.stepsTitle &&
      nodes.stepsCards.length &&
      nodes.stepsNote &&
      nodes.stepsButton &&
      nodes.stepsProgress.length &&
      nodes.stylesTitle &&
      nodes.styleCards.length &&
      nodes.styleCardButtons.length &&
      nodes.formTitle &&
      nodes.formSubtitle &&
      nodes.formAside &&
      nodes.formBody &&
      nodes.progressButtons.length &&
      nodes.startButton,
  );
}

export function getScreenNodes(hero) {
  const {selectors} = KAPSULA_ANIMATION.screenTransition;
  const nodes = {
    heroScreen: hero.querySelector(selectors.heroScreen),
    stepsScreen: hero.querySelector(selectors.stepsScreen),
    stylesScreen: hero.querySelector(selectors.stylesScreen),
    formScreen: hero.querySelector(selectors.formScreen),
    stepsTitle: hero.querySelector(selectors.stepsTitle),
    stepsCards: hero.querySelectorAll(selectors.stepsCards),
    stepsNote: hero.querySelector(selectors.stepsNote),
    stepsButton: hero.querySelector(selectors.stepsButton),
    stepsProgress: hero.querySelectorAll(selectors.stepsProgress),
    stylesTitle: hero.querySelector(selectors.stylesTitle),
    styleCards: hero.querySelectorAll(selectors.styleCards),
    styleCardButtons: hero.querySelectorAll(selectors.styleCardButtons),
    formTitle: hero.querySelector(selectors.formTitle),
    formSubtitle: hero.querySelector(selectors.formSubtitle),
    formAside: hero.querySelector(selectors.formAside),
    formBody: hero.querySelector(selectors.formBody),
    progressButtons: hero.querySelectorAll(selectors.progressButton),
    startButton: hero.querySelector(KAPSULA_ANIMATION.heroReveal.selectors.startButton),
  };

  return hasRequiredNodes(nodes) ? nodes : null;
}

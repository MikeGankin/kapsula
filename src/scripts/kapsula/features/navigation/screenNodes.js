import {KAPSULA_ANIMATION} from "../../shared/animationConfig.js";
import {logWarning} from "../../shared/logger.js";

/**
 * Узлы, без которых экранный флоу не имеет смысла.
 * Значение — ключ в `selectors`, нужен для внятной диагностики.
 */
const REQUIRED_NODE_SELECTOR_KEYS = {
  heroScreen: "heroScreen",
  stepsScreen: "stepsScreen",
  stylesScreen: "stylesScreen",
  stepsTitle: "stepsTitle",
  stepsCards: "stepsCards",
  stepsNote: "stepsNote",
  stepsButton: "stepsButton",
  stylesTitle: "stylesTitle",
  styleCards: "styleCards",
  styleCardButtons: "styleCardButtons",
  startButton: "startButton",
};

function isNodeMissing(value) {
  if (value instanceof NodeList) {
    return value.length === 0;
  }

  return !value;
}

function getMissingNodes(nodes, selectors) {
  return Object.keys(REQUIRED_NODE_SELECTOR_KEYS)
    .filter((nodeKey) => isNodeMissing(nodes[nodeKey]))
    .map((nodeKey) => {
      const selectorKey = REQUIRED_NODE_SELECTOR_KEYS[nodeKey];
      const selector = selectorKey === "startButton"
        ? KAPSULA_ANIMATION.heroReveal.selectors.startButton
        : selectors[selectorKey];

      return `${nodeKey} (${selector})`;
    });
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
    stylesTitle: hero.querySelector(selectors.stylesTitle),
    styleCards: hero.querySelectorAll(selectors.styleCards),
    styleCardButtons: hero.querySelectorAll(selectors.styleCardButtons),
    formTitle: hero.querySelector(selectors.formTitle),
    formSubtitle: hero.querySelector(selectors.formSubtitle),
    formAside: hero.querySelector(selectors.formAside),
    formBody: hero.querySelector(selectors.formBody),
    startButton: hero.querySelector(KAPSULA_ANIMATION.heroReveal.selectors.startButton),
  };

  const missingNodes = getMissingNodes(nodes, selectors);

  if (missingNodes.length > 0) {
    logWarning(
      `экранный флоу не запущен, в разметке нет обязательных узлов:\n  ${missingNodes.join("\n  ")}`,
    );

    return null;
  }

  return nodes;
}

import {METRIKA_COUNTER_ID} from "./constants.js";
import {logWarning} from "./logger.js";

/**
 * Тонкая обёртка над Яндекс.Метрикой: счётчик задаётся в одном месте,
 * отсутствие ym на странице не должно ронять пользовательский сценарий.
 */
export function reachGoal(goal, params) {
  if (!goal || typeof window.ym !== "function") {
    return;
  }

  try {
    if (params) {
      window.ym(METRIKA_COUNTER_ID, "reachGoal", goal, params);
      return;
    }

    window.ym(METRIKA_COUNTER_ID, "reachGoal", goal);
  } catch (error) {
    logWarning(`цель «${goal}» не отправлена`, error);
  }
}

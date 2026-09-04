import {reachGoal} from "../../shared/analytics.js";
import {HEADER_CONTACT_SELECTOR, JIVO_WIDGET_TOGGLE_SELECTOR} from "../../shared/constants.js";

function openJivoWidget() {
  if (typeof window.jivo_api?.open === "function") {
    window.jivo_api.open();
    reachGoal("capsule_jivo");

    return;
  }

  const widgetToggle = document.querySelector(JIVO_WIDGET_TOGGLE_SELECTOR);

  if (!widgetToggle) {
    return;
  }

  widgetToggle.style.removeProperty("display");
  widgetToggle.click();
}

export function bindHeaderUi(rootNode = document) {
  const button = rootNode.querySelector(HEADER_CONTACT_SELECTOR);

  if (!button) {
    return () => {};
  }

  button.addEventListener("click", openJivoWidget);

  return () => button.removeEventListener("click", openJivoWidget);
}

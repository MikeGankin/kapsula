import {getScheduleSnapshot} from "./schedule.js";

export function activateTab(root, tabId) {
  root.querySelectorAll("[data-secret-tab]").forEach((tabEl) => {
    const isActive = tabEl.dataset.secretTab === tabId;
    tabEl.classList.toggle("is-active", isActive);
    tabEl.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  root.querySelectorAll("[data-secret-pane]").forEach((paneEl) => {
    const isActive = paneEl.dataset.secretPane === tabId;
    paneEl.classList.toggle("is-active", isActive);
    paneEl.hidden = !isActive;
  });

  root.dataset.activeTab = tabId;
}

export function applyScheduleToDom(root, resolvedSchedule) {
  const detail = getScheduleSnapshot(resolvedSchedule);

  root.dataset.currentDate = detail.currentDate || "";
  root.dataset.nextDate = detail.nextDate || "";
  root.dataset.schedule = JSON.stringify(detail.countries);
  window.secretHotelSchedule = detail;
  root.dispatchEvent(new CustomEvent("secret-hotels:update", {detail, bubbles: true}));
}

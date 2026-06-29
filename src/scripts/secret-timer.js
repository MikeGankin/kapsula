import "./secret-hotels-data.js";
import {
  formatCountdown,
  formatMoscowDate,
  getCurrentDayTimestamp,
  getNextDayTimestamp,
} from "./secret-timer/date.js";
import {activateTab, applyScheduleToDom} from "./secret-timer/dom.js";
import {createHotelPriceStore} from "./secret-timer/hotel-store.js";
import {renderSkeleton, renderTabs} from "./secret-timer/render.js";
import {buildResolvedSchedule} from "./secret-timer/schedule.js";
import {
  initializeSwipers,
  registerSwiperElements,
} from "./secret-timer/swiper.js";

export default function secretTimer(container = document) {
  const root = container.querySelector("[data-secret-timer]");
  if (!root) return;

  registerSwiperElements();

  if (root.__secretTimerIntervalId) {
    window.clearInterval(root.__secretTimerIntervalId);
  }

  const hotelStore = createHotelPriceStore(window.secretHotelsData?.promoDiscountRules);

  const render = async () => {
    root.dataset.loading = "true";
    renderSkeleton(root);

    try {
      const resolvedSchedule = await buildResolvedSchedule(hotelStore);
      const activeTab = root.dataset.activeTab;

      renderTabs(root, resolvedSchedule, activeTab);
      initializeSwipers(root);
      applyScheduleToDom(root, resolvedSchedule);
      activateTab(
        root,
        root.dataset.activeTab || resolvedSchedule.countries?.[0]?.id || "",
      );
      root.dataset.renderDate = formatMoscowDate(getCurrentDayTimestamp());
    } catch (error) {
      console.warn("Secret hotels render failed:", error);
    } finally {
      root.dataset.loading = "false";
    }
  };

  render();

  if (!root.__secretTimerTabsBound) {
    root.addEventListener("click", (event) => {
      const tabEl = event.target.closest("[data-secret-tab]");
      if (!tabEl) return;
      activateTab(root, tabEl.dataset.secretTab);
    });

    root.__secretTimerTabsBound = true;
  }

  const tick = () => {
    const currentDate = formatMoscowDate(getCurrentDayTimestamp());

    if (root.dataset.renderDate !== currentDate && root.dataset.loading !== "true") {
      render();
    }

    const countdown = formatCountdown(getNextDayTimestamp());
    root.querySelectorAll("[data-secret-countdown]").forEach((node) => {
      node.textContent = countdown;
    });
  };

  tick();
  root.__secretTimerIntervalId = window.setInterval(tick, 1000);
}

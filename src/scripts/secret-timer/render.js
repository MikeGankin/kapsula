import {DEFAULT_SECRET_IMAGE} from "./constants.js";
import {escapeHtml, formatPrice} from "./format.js";

export function renderSkeleton(root) {
  const dynamicRoot = root.querySelector("[data-secret-timer-dynamic]");
  if (!dynamicRoot || dynamicRoot.innerHTML.trim()) return;

  const skeletonCards = Array.from(
    {length: 4},
    (_, index) => `
      <div class="secret-timer__skeleton-card${index === 3 ? " secret-timer__skeleton-card--secret" : ""}">
        <div class="secret-timer__skeleton-media"></div>
        <div class="secret-timer__skeleton-line secret-timer__skeleton-line--title"></div>
        <div class="secret-timer__skeleton-stars"></div>
        <div class="secret-timer__skeleton-line"></div>
        <div class="secret-timer__skeleton-line"></div>
        <div class="secret-timer__skeleton-total"></div>
      </div>
    `,
  ).join("");

  dynamicRoot.innerHTML = `
    <div class="secret-timer__skeleton" aria-hidden="true">
      <div class="secret-timer__skeleton-tabs">
        <div class="secret-timer__skeleton-tab"></div>
        <div class="secret-timer__skeleton-tab"></div>
      </div>
      <div class="secret-timer__skeleton-grid">
        ${skeletonCards}
      </div>
    </div>
  `;
}

function renderStars(count) {
  const stars = Math.max(Number(count) || 0, 0);
  return Array.from(
    {length: stars},
    () => `
      <svg class="secret-timer__star" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
        <path d="M15.0733 5.1625L10.5394 4.50358L8.5126 0.394646C8.45725 0.282146 8.36618 0.191075 8.25367 0.135717C7.97153 -0.00356831 7.62867 0.112503 7.4876 0.394646L5.46082 4.50358L0.926889 5.1625C0.801889 5.18036 0.687603 5.23929 0.600103 5.32857C0.494321 5.4373 0.43603 5.58358 0.438039 5.73526C0.440048 5.88694 0.502192 6.03162 0.610817 6.1375L3.89117 9.33572L3.11617 13.8518C3.098 13.9568 3.10963 14.0649 3.14973 14.1637C3.18984 14.2625 3.25682 14.348 3.34308 14.4107C3.42935 14.4733 3.53144 14.5106 3.63778 14.5181C3.74413 14.5257 3.85047 14.5034 3.94475 14.4536L8.0001 12.3214L12.0555 14.4536C12.1662 14.5125 12.2947 14.5321 12.418 14.5107C12.7287 14.4571 12.9376 14.1625 12.884 13.8518L12.109 9.33572L15.3894 6.1375C15.4787 6.05 15.5376 5.93572 15.5555 5.81072C15.6037 5.49822 15.3858 5.20893 15.0733 5.1625Z" fill="#FADB14"/>
      </svg>
    `,
  ).join("");
}

function renderHotelCard(hotel) {
  const oldPrice = Number.isFinite(hotel.oldPrice)
    ? formatPrice(hotel.oldPrice)
    : "Цена по запросу";
  const promoPrice = Number.isFinite(hotel.promoPrice)
    ? `- ${formatPrice(hotel.promoPrice)}`
    : "Уточняется";
  const finalPrice = Number.isFinite(hotel.finalPrice)
    ? formatPrice(hotel.finalPrice)
    : "Уточняется";
  const tagName = hotel.href ? "a" : "article";
  const linkAttrs = hotel.href
    ? ` href="${escapeHtml(hotel.href)}" target="_blank" rel="noopener noreferrer"`
    : "";

  return `
    <${tagName} class="secret-timer__card secret-timer__card--hotel"${linkAttrs}>
      <div class="secret-timer__card-media">
        <img src="${escapeHtml(hotel.image || DEFAULT_SECRET_IMAGE)}" alt="${escapeHtml(hotel.name)}">
      </div>
      <div class="secret-timer__card-body">
        <h3 class="secret-timer__card-title">${escapeHtml(hotel.name)}</h3>
        <div class="secret-timer__card-footer">
          <div class="secret-timer__stars" aria-label="${escapeHtml(String(hotel.stars || 0))} звезд">
            ${renderStars(hotel.stars)}
          </div>
          <dl class="secret-timer__prices">
            <div class="secret-timer__prices-row">
              <dt>Цена</dt>
              <dd>${escapeHtml(oldPrice)}</dd>
            </div>
            <div class="secret-timer__prices-row secret-timer__prices-row--promo">
              <dt>Промокод</dt>
              <dd>${escapeHtml(promoPrice)}</dd>
            </div>
            <div class="secret-timer__prices-total">
              <div class="secret-timer__prices-meta">
                <strong>Цена</strong>
                <span>за ${escapeHtml(String(hotel.nights || 7))} ночей • ${escapeHtml(String(hotel.adults || 2))} взр.</span>
              </div>
              <strong>${escapeHtml(finalPrice)}</strong>
            </div>
          </dl>
        </div>
      </div>
    </${tagName}>
  `;
}

function renderSecretCard(country, nextHotel) {
  const image = nextHotel?.image || DEFAULT_SECRET_IMAGE;

  return `
    <article class="secret-timer__card secret-timer__card--secret" data-secret-card="${escapeHtml(country.id)}">
      <div class="secret-timer__card-media secret-timer__card-media--secret">
        <img src="${escapeHtml(image)}" alt="">
        <div class="secret-timer__secret-lock" aria-hidden="true">
          <span class="secret-timer__secret-lock-icon">🔒</span>
        </div>
      </div>
      <div class="secret-timer__card-body">
        <p class="secret-timer__secret-badge">
          Новый отель через
          <strong data-secret-countdown="${escapeHtml(country.id)}">00:00:00</strong>
        </p>
        <h3 class="secret-timer__card-title">Секретный отель</h3>
      </div>
    </article>
  `;
}

function renderCountryPane(country, isActive) {
  const slides = [
    ...country.state.visibleHotels.map((hotel) => `
      <swiper-slide class="secret-timer__slide">
        ${renderHotelCard(hotel)}
      </swiper-slide>
    `),
    country.state.nextHotel
      ? `
      <swiper-slide class="secret-timer__slide">
        ${renderSecretCard(country, country.state.nextHotel)}
      </swiper-slide>
    `
      : "",
  ].join("");

  return `
    <section
      class="secret-timer__pane${isActive ? " is-active" : ""}"
      id="secret-pane-${escapeHtml(country.id)}"
      role="tabpanel"
      aria-labelledby="secret-tab-${escapeHtml(country.id)}"
      ${isActive ? "" : "hidden"}
      data-secret-pane="${escapeHtml(country.id)}"
    >
      <div class="secret-timer__slider-shell">
        <button
          class="custom-slider-nav-btn slider-bnt-prev secret-timer__slider-arrow secret-timer__slider-arrow--prev"
          type="button"
          aria-label="Предыдущие отели"
          data-secret-prev="${escapeHtml(country.id)}"
        >
          <svg fill="none" height="9" viewBox="0 0 6 9" width="6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M1.25 1.16504L4.58333 4.49837L1.25 7.83171" stroke="#535353" stroke-linejoin="round"></path>
          </svg>
        </button>
        <button
          class="custom-slider-nav-btn slider-bnt-next secret-timer__slider-arrow secret-timer__slider-arrow--next"
          type="button"
          aria-label="Следующие отели"
          data-secret-next="${escapeHtml(country.id)}"
        >
          <svg fill="none" height="9" viewBox="0 0 6 9" width="6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M1.25 1.16504L4.58333 4.49837L1.25 7.83171" stroke="#535353" stroke-linejoin="round"></path>
          </svg>
        </button>
        <swiper-container
          class="secret-timer__slider"
          init="false"
          data-secret-swiper="${escapeHtml(country.id)}"
        >
          ${slides}
        </swiper-container>
      </div>
    </section>
  `;
}

export function renderTabs(root, resolvedSchedule, activeTabId) {
  const countries = resolvedSchedule.countries || [];
  const dynamicRoot = root.querySelector("[data-secret-timer-dynamic]");

  if (!dynamicRoot) {
    return;
  }

  if (!countries.length) {
    dynamicRoot.innerHTML = "";
    return;
  }

  const resolvedActiveId = countries.some((country) => country.id === activeTabId)
    ? activeTabId
    : countries[0].id;

  const navMarkup = countries.map((country) => {
    const isActive = country.id === resolvedActiveId;

    return `
      <button
        id="secret-tab-${escapeHtml(country.id)}"
        class="secret-timer__tab${isActive ? " is-active" : ""}"
        type="button"
        role="tab"
        aria-selected="${isActive ? "true" : "false"}"
        aria-controls="secret-pane-${escapeHtml(country.id)}"
        data-secret-tab="${escapeHtml(country.id)}"
      >
        ${escapeHtml(country.label)}
      </button>
    `;
  }).join("");

  const panesMarkup = countries.map((country) => {
    return renderCountryPane(country, country.id === resolvedActiveId);
  }).join("");

  dynamicRoot.innerHTML = `
    <div class="secret-timer__top">
      <div class="secret-timer__tabs" role="tablist" aria-label="Секретные отели по странам">
        ${navMarkup}
      </div>
    </div>
      <div class="secret-timer__panes">
        ${panesMarkup}
      </div>
  `;
}

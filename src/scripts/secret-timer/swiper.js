import {register} from "swiper/element/bundle";

let isSwiperRegistered = false;

export function registerSwiperElements() {
  if (isSwiperRegistered) return;
  register();
  isSwiperRegistered = true;
}

export function initializeSwipers(root) {
  root.querySelectorAll("[data-secret-swiper]").forEach((swiperEl) => {
    if (swiperEl.dataset.swiperReady === "true") {
      return;
    }

    const countryId = swiperEl.dataset.secretSwiper;
    const prevEl = root.querySelector(`[data-secret-prev="${countryId}"]`);
    const nextEl = root.querySelector(`[data-secret-next="${countryId}"]`);

    Object.assign(swiperEl, {
      slidesPerView: 1.2,
      spaceBetween: 16,
      pagination: {
        clickable: true,
      },
      navigation: prevEl && nextEl ? {
        prevEl,
        nextEl,
      } : undefined,
      breakpoints: {
        768: {
          slidesPerView: 2.1,
          spaceBetween: 18,
        },
        1100: {
          slidesPerView: 4,
          spaceBetween: 18,
        },
      }
    });

    swiperEl.initialize();
    swiperEl.dataset.swiperReady = "true";
  });
}

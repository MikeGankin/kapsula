import {fetchKapsulaHotels} from "./fetchKapsulaHotel.js";
import {getConfiguredHotelsByCountries} from "./kapsulaHotelsConfig.js";

function createSkeletonNode(hotel) {
  const skeletonNode = document.createElement("article");
  skeletonNode.className = "kapsula-popup-card kapsula-popup-card--skeleton";
  skeletonNode.dataset.kapsulaHotelSkeleton = hotel.id;
  skeletonNode.setAttribute("aria-hidden", "true");

  return skeletonNode;
}

/**
 * Ссылка на отель приходит из отдельного redirect-запроса и может отсутствовать.
 * Пустой href у <a> ведёт на текущую страницу и перезагружает её по клику,
 * поэтому в таком случае снимаем интерактивность, оставляя карточку как контент.
 */
function applyHotelCardLink(cardNode, url) {
  if (url) {
    cardNode.setAttribute("href", url);
    cardNode.removeAttribute("aria-disabled");
    delete cardNode.dataset.kapsulaHotelLinkless;
    return;
  }

  cardNode.removeAttribute("href");
  cardNode.removeAttribute("target");
  cardNode.removeAttribute("rel");
  cardNode.setAttribute("role", "group");
  cardNode.dataset.kapsulaHotelLinkless = "";
}

function createHotelCard(templateNode, hotel) {
  if (!(templateNode instanceof HTMLTemplateElement)) return null;

  const fragment = templateNode.content.cloneNode(true);
  const cardNode = fragment.querySelector(".kapsula-popup-card");
  const imageNode = fragment.querySelector(".kapsula-popup-card__image");
  const titleNode = fragment.querySelector(".kapsula-popup-card__title");
  const locationNode = fragment.querySelector(".kapsula-popup-card__location span");

  if (!(cardNode instanceof HTMLElement)) return null;

  cardNode.dataset.kapsulaHotelId = hotel.id;
  applyHotelCardLink(cardNode, hotel.url);

  if (imageNode instanceof HTMLImageElement) {
    if (hotel.imageUrl) {
      imageNode.src = hotel.imageUrl;
      imageNode.alt = hotel.name;
    } else {
      imageNode.remove();
    }
  }

  if (titleNode) titleNode.textContent = hotel.name;
  if (locationNode) locationNode.textContent = hotel.location;

  return cardNode;
}

export function createPopupHotelsLoader({
  cardsNode,
  errorNode,
  templateNode,
  onUpdate,
}) {
  if (!(cardsNode instanceof HTMLElement)) {
    return {
      load: () => Promise.resolve([]),
      destroy() {},
    };
  }

  let loadRevision = 0;
  let abortController = null;
  const asideNode = errorNode?.closest?.(".kapsula-popup__aside");

  const syncCarousel = () => {
    window.requestAnimationFrame(() => onUpdate?.());
  };

  const showError = (visible) => {
    if (errorNode instanceof HTMLElement) {
      errorNode.hidden = !visible;
    }

    if (asideNode instanceof HTMLElement) {
      asideNode.dataset.hotelsState = visible ? "error" : "content";
    }
  };

  const load = (countries) => {
    loadRevision += 1;
    const currentRevision = loadRevision;
    abortController?.abort();
    abortController = new AbortController();
    const currentAbortController = abortController;

    const configuredHotels = getConfiguredHotelsByCountries(countries);
    const skeletonNodes = configuredHotels.map(createSkeletonNode);

    cardsNode.replaceChildren(...skeletonNodes);
    cardsNode.setAttribute("aria-busy", "true");
    showError(false);
    syncCarousel();

    if (configuredHotels.length === 0) {
      console.warn("Kapsula hotels request skipped: no configured hotels", {countries});
      cardsNode.setAttribute("aria-busy", "false");
      showError(true);
      return Promise.resolve([]);
    }


    return fetchKapsulaHotels(configuredHotels, {
      signal: currentAbortController.signal,
    }).then((hotels) => {
      if (currentRevision !== loadRevision) return [];

      const cardNodes = hotels
        .map((hotel) => createHotelCard(templateNode, hotel))
        .filter(Boolean);

      cardsNode.replaceChildren(...cardNodes);
      cardsNode.setAttribute("aria-busy", "false");
      showError(cardNodes.length === 0);
      syncCarousel();

      return hotels;
    }).catch((error) => {
      if (currentRevision !== loadRevision || error?.name === "AbortError") {
        return [];
      }

      cardsNode.replaceChildren();
      cardsNode.setAttribute("aria-busy", "false");
      showError(true);
      console.warn("Failed to load Kapsula hotels", error);
      syncCarousel();
      return [];
    });
  };

  return {
    load,
    destroy() {
      loadRevision += 1;
      abortController?.abort();
      abortController = null;
      cardsNode.replaceChildren();
      cardsNode.setAttribute("aria-busy", "false");
      showError(false);
    },
  };
}

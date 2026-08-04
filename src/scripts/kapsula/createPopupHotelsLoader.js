import {fetchKapsulaHotel} from "./fetchKapsulaHotel.js";
import {getConfiguredHotelsByCountries} from "./kapsulaHotelsConfig.js";

function createSkeletonNode(hotel) {
  const skeletonNode = document.createElement("article");
  skeletonNode.className = "kapsula-popup-card kapsula-popup-card--skeleton";
  skeletonNode.dataset.kapsulaHotelSkeleton = hotel.id;
  skeletonNode.setAttribute("aria-hidden", "true");

  return skeletonNode;
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

function insertBeforeSkeletons(containerNode, cardNode) {
  const firstSkeletonNode = containerNode.querySelector("[data-kapsula-hotel-skeleton]");
  containerNode.insertBefore(cardNode, firstSkeletonNode);
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

  const syncCarousel = () => {
    window.requestAnimationFrame(() => onUpdate?.());
  };

  const showError = (visible) => {
    if (errorNode instanceof HTMLElement) {
      errorNode.hidden = !visible;
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
      cardsNode.setAttribute("aria-busy", "false");
      showError(true);
      return Promise.resolve([]);
    }

    let loadedCount = 0;

    const requests = configuredHotels.map(async (configuredHotel) => {
      try {
        const hotel = await fetchKapsulaHotel(configuredHotel, {
          signal: currentAbortController.signal,
        });

        if (currentRevision !== loadRevision) return null;

        const skeletonNode = cardsNode.querySelector(
          `[data-kapsula-hotel-skeleton="${configuredHotel.id}"]`,
        );
        const cardNode = createHotelCard(templateNode, hotel);

        skeletonNode?.remove();

        if (cardNode) {
          insertBeforeSkeletons(cardsNode, cardNode);
          loadedCount += 1;
          syncCarousel();
        }

        return hotel;
      } catch (error) {
        if (currentRevision !== loadRevision || error?.name === "AbortError") {
          return null;
        }

        cardsNode.querySelector(
          `[data-kapsula-hotel-skeleton="${configuredHotel.id}"]`,
        )?.remove();
        console.warn(`Failed to load Kapsula hotel ${configuredHotel.id}`, error);
        syncCarousel();
        return null;
      }
    });

    return Promise.all(requests).then((hotels) => {
      if (currentRevision !== loadRevision) return [];

      cardsNode.setAttribute("aria-busy", "false");
      showError(loadedCount === 0);
      syncCarousel();

      return hotels.filter(Boolean);
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

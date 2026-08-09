import {fetchKapsulaHotels} from "./hotels/fetchKapsulaHotels.js";
import {getConfiguredHotelsByCountries} from "./kapsulaHotelsConfig.js";
import {logWarning} from "./logger.js";

function createSkeletonNode(hotel) {
  const skeletonNode = document.createElement("article");
  skeletonNode.className = "kapsula-popup-card kapsula-popup-card--skeleton";
  skeletonNode.dataset.kapsulaHotelSkeleton = hotel.id;
  skeletonNode.setAttribute("aria-hidden", "true");

  return skeletonNode;
}

/**
 * Ссылка приходит из отдельного redirect-запроса и может отсутствовать.
 * Карточка без ссылки бесполезна (пустой href перезагружает страницу),
 * поэтому такие отели не рендерим — как и при ошибке основного запроса.
 */
function hasHotelLink(hotel) {
  return Boolean(hotel?.url);
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
  cardNode.href = hotel.url;

  if (imageNode instanceof HTMLImageElement) {
    if (hotel.imageUrl) {
      imageNode.src = hotel.imageUrl;
      imageNode.alt = hotel.name;

      // Ссылка на фото может быть битой или отдать 404 уже после рендера —
      // тогда убираем картинку и оставляем фоновую заглушку карточки.
      imageNode.addEventListener("error", () => {
        imageNode.remove();
        cardNode.dataset.hotelImage = "fallback";
      }, {once: true});
    } else {
      imageNode.remove();
      cardNode.dataset.hotelImage = "fallback";
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
      logWarning("запрос отелей пропущен: для стран нет конфигурации", {countries});
      cardsNode.setAttribute("aria-busy", "false");
      showError(true);
      return Promise.resolve([]);
    }


    return fetchKapsulaHotels(configuredHotels, {
      signal: currentAbortController.signal,
    }).then((hotels) => {
      if (currentRevision !== loadRevision) return [];

      const linkedHotels = hotels.filter(hasHotelLink);

      if (linkedHotels.length !== hotels.length) {
        logWarning(
          "отели без ссылки не показаны",
          hotels.filter((hotel) => !hasHotelLink(hotel)).map(({id}) => id),
        );
      }

      const cardNodes = linkedHotels
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
      logWarning("не удалось загрузить отели", error);
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

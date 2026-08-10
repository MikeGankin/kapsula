import {logWarning} from "../logger.js";

const RESPONSE_HOTELS_PATHS = [
  (data) => (Array.isArray(data) ? data : null),
  (data) => data?.result?.products,
  (data) => data?.hotels,
  (data) => data?.items,
  (data) => data?.products,
  (data) => data?.data?.hotels,
  (data) => data?.data?.items,
  (data) => data?.data?.products,
];

/**
 * Формат ответа поиска исторически различается между окружениями,
 * поэтому список отелей ищем по нескольким известным путям.
 */
export function getResponseHotels(responseData) {
  for (const getPath of RESPONSE_HOTELS_PATHS) {
    const hotels = getPath(responseData);

    if (Array.isArray(hotels)) {
      return hotels;
    }
  }

  return [];
}

function getHotelId(product) {
  return String(
    product?.hotel?.id
    ?? product?.hotel?.location?.id
    ?? product?.hotelId
    ?? product?.id
    ?? "",
  );
}

/**
 * Идентификатор отеля — это только первый сегмент до дефиса. Всё остальное —
 * метаданные локации: тип (`-7` — отель) и, иногда, родительское место
 * (`-875-6`). Поэтому "13708", "13708-7" и "13708-7-875-6" — один и тот же
 * отель, и сравнивать их нужно по этому сегменту, иначе отель из ответа
 * не находится и карточка остаётся без фото.
 */
function getHotelMatchKey(id) {
  return String(id ?? "").split("-")[0];
}

/**
 * Основной путь к фото — `hotel.images[0].sizes[0].url` (формат PriceSearchList).
 * Остальные варианты оставлены как запасные: структура ответа исторически
 * отличается между окружениями. Среди `sizes` берём самый крупный вариант,
 * если у размеров указана ширина, — карточка растягивается на всю ширину.
 */
function getSizeUrl(size) {
  if (typeof size === "string") return size;

  return size?.url ?? size?.src ?? "";
}

function getLargestSizeUrl(sizes) {
  if (!Array.isArray(sizes) || sizes.length === 0) return "";

  const withWidth = sizes.filter((size) => typeof size?.width === "number");

  if (withWidth.length > 0) {
    const largest = withWidth.reduce(
      (best, size) => (size.width > best.width ? size : best),
    );

    return getSizeUrl(largest);
  }

  return getSizeUrl(sizes[0]);
}

function getHotelImageUrl(hotel) {
  const fromImages = getLargestSizeUrl(hotel?.images?.[0]?.sizes);

  return String(
    fromImages
    || getSizeUrl(hotel?.images?.[0])
    || hotel?.imageUrl
    || hotel?.image?.url
    || "",
  );
}

function normalizeHotel(product, configuredHotel) {
  const hotel = product?.hotel ?? product;

  // id берём из конфигурации в исходном виде ("13708-7-875-6"): по нему
  // строится кеш сессии (hotelsCache.js) и redirect-запрос за ссылкой.
  return {
    id: String(configuredHotel.id ?? hotel?.id ?? product?.hotelId ?? ""),
    name: String(
      hotel?.name ?? hotel?.hotelName ?? configuredHotel.name ?? "",
    ),
    imageUrl: getHotelImageUrl(hotel),
    location: String(
      hotel?.locationSummary
      ?? hotel?.location
      ?? hotel?.countryName
      ?? configuredHotel.country
      ?? "",
    ),
    url: "",
  };
}

export function normalizeHotelsResponse(responseData, configuredHotels) {
  const responseHotels = getResponseHotels(responseData);
  const responseHotelsByKey = new Map(
    responseHotels.map((product) => [getHotelMatchKey(getHotelId(product)), product]),
  );

  // Сопоставляем строго по id: фолбэк по индексу подставлял в карточку
  // произвольный отель из ответа с чужим названием и фотографией.
  //
  // Отели, которых нет в ответе, отбрасываем: без данных сервера у карточки
  // остаются только название и страна из конфига, без фото и актуальной
  // локации. Проблема с одним отелем не должна ломать выдачу целиком —
  // остальные карточки рендерятся как обычно. Если же не осталось ни одной,
  // попап покажет текстовую заглушку (см. createPopupHotelsLoader).
  return configuredHotels.flatMap((configuredHotel) => {
    const responseHotel = responseHotelsByKey.get(
      getHotelMatchKey(configuredHotel.id),
    ) ?? null;

    if (!responseHotel) {
      logWarning(`отель ${configuredHotel.id} отсутствует в ответе поиска`);

      return [];
    }

    return [normalizeHotel(responseHotel, configuredHotel)];
  });
}

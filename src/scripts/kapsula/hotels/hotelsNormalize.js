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
    product?.hotel?.id ?? product?.hotelId ?? product?.id ?? "",
  );
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

  return {
    id: String(hotel?.id ?? product?.hotelId ?? configuredHotel.id),
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
  const responseHotelsById = new Map(
    responseHotels.map((product) => [getHotelId(product), product]),
  );

  // Сопоставляем строго по id: фолбэк по индексу подставлял в карточку
  // произвольный отель из ответа с чужим названием и фотографией.
  return configuredHotels.map((configuredHotel) => {
    const responseHotel = responseHotelsById.get(String(configuredHotel.id)) ?? null;

    if (!responseHotel) {
      logWarning(
        `отель ${configuredHotel.id} отсутствует в ответе поиска`,
      );
    }

    return normalizeHotel(responseHotel, configuredHotel);
  });
}

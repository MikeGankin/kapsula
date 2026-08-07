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

function getHotelImageUrl(hotel) {
  const imageSize = hotel?.images?.[0]?.sizes?.[0];

  if (typeof imageSize === "string") {
    return imageSize;
  }

  return String(
    imageSize?.url
    ?? imageSize?.src
    ?? hotel?.imageUrl
    ?? hotel?.image?.url
    ?? "",
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
      console.warn(
        `Kapsula hotel ${configuredHotel.id} is missing in the search response`,
      );
    }

    return normalizeHotel(responseHotel, configuredHotel);
  });
}

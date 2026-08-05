const KAPSULA_HOTELS_ENDPOINT = "/endpoints/PackageTourHotelProduct/PriceSearchList";
const KAPSULA_HOTELS_CACHE_PREFIX = "kapsula:hotels:";

function getHotelsCacheKey(configuredHotels) {
  const hotelIds = configuredHotels.map(({id}) => id).sort();

  return `${KAPSULA_HOTELS_CACHE_PREFIX}${hotelIds.join(",")}`;
}

function readCachedHotels(configuredHotels) {
  try {
    const cachedValue = window.sessionStorage.getItem(getHotelsCacheKey(configuredHotels));
    const cachedHotels = cachedValue ? JSON.parse(cachedValue) : null;

    if (!Array.isArray(cachedHotels)) return null;

    const cachedHotelsById = new Map(cachedHotels.map((hotel) => [hotel.id, hotel]));
    const orderedHotels = configuredHotels.map(({id}) => cachedHotelsById.get(id));

    return orderedHotels.every(Boolean) ? orderedHotels : null;
  } catch (error) {
    console.warn("Failed to read Kapsula hotels cache", error);
    return null;
  }
}

function cacheHotels(configuredHotels, hotels) {
  try {
    window.sessionStorage.setItem(
      getHotelsCacheKey(configuredHotels),
      JSON.stringify(hotels),
    );
  } catch (error) {
    console.warn("Failed to cache Kapsula hotels", error);
  }
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createBeginDates() {
  const today = new Date();
  const weekLater = new Date(today);

  weekLater.setDate(weekLater.getDate() + 7);

  return [formatLocalDate(today), formatLocalDate(weekLater)];
}

function createArrivalLocations(configuredHotels) {
  return configuredHotels.map(({id}) => ({
    id,
    name: "",
    friendlyUrl: "",
    type: 7,
  }));
}

function getResponseHotels(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.result?.products)) return responseData.result.products;
  if (Array.isArray(responseData?.hotels)) return responseData.hotels;
  if (Array.isArray(responseData?.items)) return responseData.items;
  if (Array.isArray(responseData?.products)) return responseData.products;
  if (Array.isArray(responseData?.data?.hotels)) return responseData.data.hotels;
  if (Array.isArray(responseData?.data?.items)) return responseData.data.items;
  if (Array.isArray(responseData?.data?.products)) return responseData.data.products;

  return [];
}

function getHotelId(product) {
  return String(product?.hotel?.id ?? product?.hotelId ?? product?.id ?? "");
}

function getHotelImageUrl(hotel) {
  const imageSize = hotel?.images?.[0]?.sizes?.[0];

  if (typeof imageSize === "string") return imageSize;

  return String(imageSize?.url ?? imageSize?.src ?? hotel?.imageUrl ?? hotel?.image?.url ?? "");
}

function normalizeHotel(product, configuredHotel) {
  const hotel = product?.hotel ?? product;

  return {
    id: String(hotel?.id ?? product?.hotelId ?? configuredHotel.id),
    name: String(hotel?.name ?? hotel?.hotelName ?? configuredHotel.name),
    imageUrl: getHotelImageUrl(hotel),
    location: String(
      hotel?.locationSummary ?? hotel?.location ?? hotel?.countryName ?? configuredHotel.country,
    ),
    url: String(hotel?.url ?? product?.url ?? ""),
  };
}

function normalizeHotelsResponse(responseData, configuredHotels) {
  const responseHotels = getResponseHotels(responseData);
  const responseHotelsById = new Map(
    responseHotels.map((product) => [getHotelId(product), product]),
  );

  return configuredHotels.map((configuredHotel, index) => {
    const responseHotel = responseHotelsById.get(configuredHotel.id) ?? responseHotels[index];
    return normalizeHotel(responseHotel, configuredHotel);
  });
}

export async function fetchKapsulaHotels(configuredHotels, {signal} = {}) {
  if (!Array.isArray(configuredHotels) || configuredHotels.length === 0) {
    return [];
  }

  const cachedHotels = readCachedHotels(configuredHotels);

  if (cachedHotels) {
    console.log("Kapsula hotels loaded from session cache", cachedHotels);
    return cachedHotels;
  }

  const payload = {
    searchSource: 1,
    searchCriterias: {
      additionalFilters: [],
      arrivalLocations: createArrivalLocations(configuredHotels),
      beginDates: createBeginDates(),
      datePickerMode: 0,
      departureLocations: [
        {
          id: "2671-5",
          name: "Москва",
          friendlyUrl: "moskva",
          type: 5,
        },
      ],
      flightType: 2,
      nights: [{value: 7}],
      paging: {
        hasNextPage: false,
        hasPreviousPage: false,
        pageNumber: 1,
        pageSize: 20,
        sortType: 0,
      },
      reservationType: 0,
      roomCriterias: [
        {
          passengers: [
            {age: 20, passengerType: 0},
            {age: 20, passengerType: 0},
          ],
        },
      ],
    },
  };

  const response = await fetch(KAPSULA_HOTELS_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  console.log("Kapsula hotels response received", {
    ok: response.ok,
    status: response.status,
  });

  if (!response.ok) {
    throw new Error(`Kapsula hotels request failed with status ${response.status}`);
  }

  const responseData = await response.json();

  console.log("Kapsula hotels response data", responseData);

  const hotels = normalizeHotelsResponse(responseData, configuredHotels);

  cacheHotels(configuredHotels, hotels);

  return hotels;
}

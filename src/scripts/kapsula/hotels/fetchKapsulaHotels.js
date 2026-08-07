import {fetchHotelRedirectUrl, fetchHotelsSearch} from "./hotelsApi.js";
import {cacheHotels, readCachedHotels} from "./hotelsCache.js";
import {normalizeHotelsResponse} from "./hotelsNormalize.js";

async function resolveHotelUrls(configuredHotels, hotels, {signal} = {}) {
  const redirectResults = await Promise.allSettled(
    configuredHotels.map(
      (configuredHotel) => fetchHotelRedirectUrl(configuredHotel, {signal}),
    ),
  );

  return hotels.map((hotel, index) => {
    const redirectResult = redirectResults[index];

    if (redirectResult.status === "fulfilled") {
      return {...hotel, url: redirectResult.value};
    }

    console.warn(
      `Failed to get redirect URL for hotel ${hotel.id}`,
      redirectResult.reason,
    );

    return {...hotel, url: ""};
  });
}

export async function fetchKapsulaHotels(configuredHotels, {signal} = {}) {
  if (!Array.isArray(configuredHotels) || configuredHotels.length === 0) {
    return [];
  }

  const cachedHotels = readCachedHotels(configuredHotels);

  if (cachedHotels) {
    return cachedHotels;
  }

  const responseData = await fetchHotelsSearch(configuredHotels, {signal});
  const hotels = normalizeHotelsResponse(responseData, configuredHotels);
  const hotelsWithUrls = await resolveHotelUrls(configuredHotels, hotels, {signal});

  cacheHotels(configuredHotels, hotelsWithUrls);

  return hotelsWithUrls;
}

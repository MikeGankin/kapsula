import {logDebug, logWarning} from "../logger.js";
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

    logWarning(
      `не удалось получить ссылку для отеля ${hotel.id}`,
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
    logDebug("отели из кеша сессии", cachedHotels);
    return cachedHotels;
  }

  const responseData = await fetchHotelsSearch(configuredHotels, {signal});

  logDebug("ответ поиска отелей (сырой)", responseData);

  const hotels = normalizeHotelsResponse(responseData, configuredHotels);
  const hotelsWithUrls = await resolveHotelUrls(configuredHotels, hotels, {signal});

  // Именно эти объекты уходят в карточки попапа.
  logDebug("отели для карточек попапа (после маппинга и ссылок)", hotelsWithUrls);

  cacheHotels(configuredHotels, hotelsWithUrls);

  return hotelsWithUrls;
}

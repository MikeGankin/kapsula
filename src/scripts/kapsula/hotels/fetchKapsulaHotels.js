import {logDebug, logWarning} from "../logger.js";
import {fetchHotelRedirectUrl, fetchHotelsSearch} from "./hotelsApi.js";
import {cacheHotels, readCachedHotels} from "./hotelsCache.js";
import {normalizeHotelsResponse} from "./hotelsNormalize.js";

/**
 * Ссылки запрашиваем ровно для тех отелей, что остались после нормализации:
 * отсутствующие в ответе поиска отбрасываются, поэтому сопоставление по
 * индексу исходного конфига дало бы карточкам чужие ссылки.
 */
async function resolveHotelUrls(hotels, {signal} = {}) {
  const redirectResults = await Promise.allSettled(
    hotels.map((hotel) => fetchHotelRedirectUrl(hotel, {signal})),
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
  const hotelsWithUrls = await resolveHotelUrls(hotels, {signal});

  // Именно эти объекты уходят в карточки попапа.
  logDebug("отели для карточек попапа (после маппинга и ссылок)", hotelsWithUrls);

  cacheHotels(configuredHotels, hotelsWithUrls);

  return hotelsWithUrls;
}

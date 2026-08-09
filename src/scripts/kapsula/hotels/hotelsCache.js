import {logWarning} from "../logger.js";

const CACHE_PREFIX = "kapsula:hotels:v5:";

// Подписанные redirect-URL живут недолго, поэтому кеш обязан протухать,
// иначе в рамках сессии карточки уводят на «мёртвые» ссылки.
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCacheKey(configuredHotels) {
  const hotelIds = configuredHotels.map(({id}) => id).sort();

  return `${CACHE_PREFIX}${hotelIds.join(",")}`;
}

export function readCachedHotels(configuredHotels) {
  const cacheKey = getCacheKey(configuredHotels);

  try {
    const cachedValue = window.sessionStorage.getItem(cacheKey);
    const cachedEntry = cachedValue ? JSON.parse(cachedValue) : null;
    const cachedHotels = cachedEntry?.hotels ?? null;

    if (!Array.isArray(cachedHotels)) {
      return null;
    }

    const isExpired = typeof cachedEntry.savedAt !== "number"
      || Date.now() - cachedEntry.savedAt > CACHE_TTL_MS;

    if (isExpired) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    const cachedHotelsById = new Map(
      cachedHotels.map((hotel) => [String(hotel.id), hotel]),
    );
    const orderedHotels = configuredHotels.map(
      ({id}) => cachedHotelsById.get(String(id)),
    );

    return orderedHotels.every(Boolean) ? orderedHotels : null;
  } catch (error) {
    logWarning("не удалось прочитать кеш отелей", error);

    return null;
  }
}

export function cacheHotels(configuredHotels, hotels) {
  try {
    window.sessionStorage.setItem(
      getCacheKey(configuredHotels),
      JSON.stringify({savedAt: Date.now(), hotels}),
    );
  } catch (error) {
    logWarning("не удалось записать кеш отелей", error);
  }
}

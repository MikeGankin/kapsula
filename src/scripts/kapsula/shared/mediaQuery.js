import {DESKTOP_MEDIA_QUERY, REDUCED_MOTION_MEDIA_QUERY} from "./constants.js";

const mediaQueryCache = new Map();

/**
 * matchMedia переиспользуется между модулями: один и тот же запрос
 * не создаёт новых объектов, а подписки снимаются возвращаемой функцией.
 */
export function getMediaQuery(query) {
  if (typeof window.matchMedia !== "function") {
    return null;
  }

  const cachedQuery = mediaQueryCache.get(query);

  if (cachedQuery) {
    return cachedQuery;
  }

  const mediaQuery = window.matchMedia(query);

  mediaQueryCache.set(query, mediaQuery);

  return mediaQuery;
}

export function matchesMediaQuery(query) {
  return Boolean(getMediaQuery(query)?.matches);
}

export function observeMediaQuery(query, listener) {
  const mediaQuery = getMediaQuery(query);

  if (!mediaQuery) {
    return () => {};
  }

  mediaQuery.addEventListener("change", listener);

  return () => mediaQuery.removeEventListener("change", listener);
}

export function isDesktopViewport() {
  return matchesMediaQuery(DESKTOP_MEDIA_QUERY);
}

export function observeDesktopViewport(listener) {
  return observeMediaQuery(DESKTOP_MEDIA_QUERY, listener);
}

export function prefersReducedMotion() {
  return matchesMediaQuery(REDUCED_MOTION_MEDIA_QUERY);
}

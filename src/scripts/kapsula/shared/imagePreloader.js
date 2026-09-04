const imageLoadCache = new Map();

/**
 * Единый кеш прелоада: раньше свои Map держали и animateFormImageOverlay,
 * и formResponsiveImages, поэтому одна и та же картинка грузилась дважды.
 */
export function preloadImageSrc(imageSrc) {
  if (!imageSrc) {
    return Promise.resolve();
  }

  const cachedPromise = imageLoadCache.get(imageSrc);

  if (cachedPromise) {
    return cachedPromise;
  }

  const imageNode = new Image();
  imageNode.decoding = "async";

  const preloadPromise = new Promise((resolve) => {
    let isResolved = false;

    const finalize = async () => {
      if (isResolved) return;
      isResolved = true;

      try {
        await imageNode.decode?.();
      } catch {
        // Завершённой загрузки достаточно, если decode недоступен или отклонён.
      }

      resolve();
    };

    if (imageNode.complete && imageNode.naturalWidth > 0) {
      finalize();
      return;
    }

    imageNode.addEventListener("load", finalize, {once: true});
    imageNode.addEventListener("error", finalize, {once: true});
    imageNode.src = imageSrc;
  });

  imageLoadCache.set(imageSrc, preloadPromise);

  return preloadPromise;
}

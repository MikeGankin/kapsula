const FORM_BASE_IMAGE_MOBILE_SOURCES = {
  // Add explicit mobile sources for base form images here when they are available.
};
const responsiveImageLoadCache = new Map();

function deriveOverlayMobileSrc(imageSrc) {
  if (typeof imageSrc !== "string") {
    return null;
  }

  if (imageSrc.includes("-desktop/")) {
    return imageSrc.replace("-desktop/", "-mobile/");
  }

  return null;
}

export function getResponsiveImageSources(imageSrc, mobileSrcOverride = null) {
  const explicitMobileSrc = mobileSrcOverride ?? FORM_BASE_IMAGE_MOBILE_SOURCES[imageSrc] ?? null;
  const derivedMobileSrc = explicitMobileSrc ?? deriveOverlayMobileSrc(imageSrc);

  return {
    desktopSrc: imageSrc,
    mobileSrc: derivedMobileSrc && derivedMobileSrc !== imageSrc ? derivedMobileSrc : null,
  };
}

function getCurrentResponsiveSrc({desktopSrc, mobileSrc}) {
  const isDesktop = window.matchMedia?.("(min-width: 993px)").matches;

  return !isDesktop && mobileSrc ? mobileSrc : desktopSrc;
}

export function preloadResponsiveImage(sources) {
  const imageSrc = getCurrentResponsiveSrc(sources);

  if (!imageSrc) {
    return Promise.resolve();
  }

  const cachedPromise = responsiveImageLoadCache.get(imageSrc);

  if (cachedPromise) {
    return cachedPromise;
  }

  const imageNode = new Image();
  imageNode.decoding = "async";

  const loadPromise = new Promise((resolve) => {
    const finalize = async () => {
      try {
        await imageNode.decode?.();
      } catch {
        // A load event is enough when decode is unavailable or rejected.
      }
      resolve();
    };

    imageNode.addEventListener("load", finalize, {once: true});
    imageNode.addEventListener("error", resolve, {once: true});
    imageNode.src = imageSrc;

    if (imageNode.complete) {
      finalize();
    }
  });

  responsiveImageLoadCache.set(imageSrc, loadPromise);
  return loadPromise;
}

function ensureDesktopSourceNode(pictureNode) {
  let sourceNode = pictureNode.querySelector('source[data-kapsula-desktop-source]');

  if (sourceNode instanceof HTMLSourceElement) {
    return sourceNode;
  }

  sourceNode = document.createElement("source");
  sourceNode.dataset.kapsulaDesktopSource = "";
  sourceNode.media = "(min-width: 993px)";
  pictureNode.prepend(sourceNode);

  return sourceNode;
}

export function syncResponsivePicture(imageNode, {desktopSrc, mobileSrc, alt} = {}) {
  if (!(imageNode instanceof HTMLImageElement)) {
    return;
  }

  const pictureNode = imageNode.closest("picture");

  if (pictureNode instanceof HTMLPictureElement) {
    const existingSourceNode = pictureNode.querySelector('source[data-kapsula-desktop-source]');

    if (mobileSrc) {
      const sourceNode = ensureDesktopSourceNode(pictureNode);
      sourceNode.srcset = desktopSrc;
    } else {
      existingSourceNode?.remove();
    }
  }

  if (mobileSrc || desktopSrc) {
    imageNode.src = mobileSrc ?? desktopSrc;
  }

  if (typeof alt === "string") {
    imageNode.alt = alt;
  }
}

export function createResponsivePictureNode({
  desktopSrc,
  mobileSrc,
  alt = "",
  pictureClassName = "",
  imageClassName = "",
  decoding = "async",
  loading = "lazy",
} = {}) {
  const pictureNode = document.createElement("picture");
  const imageNode = document.createElement("img");

  if (pictureClassName) {
    pictureNode.className = pictureClassName;
  }

  if (imageClassName) {
    imageNode.className = imageClassName;
  }

  imageNode.decoding = decoding;
  imageNode.loading = loading;
  pictureNode.append(imageNode);

  syncResponsivePicture(imageNode, {
    desktopSrc,
    mobileSrc,
    alt,
  });

  return {
    pictureNode,
    imageNode,
  };
}

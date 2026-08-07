import {preloadImageSrc} from "./imagePreloader.js";
import {isDesktopViewport} from "./mediaQuery.js";
import {DESKTOP_MEDIA_QUERY} from "./constants.js";

const FORM_BASE_IMAGE_MOBILE_SOURCES = {
  // Add explicit mobile sources for base form images here when they are available.
};

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

export function getCurrentResponsiveSrc({desktopSrc, mobileSrc}) {
  return !isDesktopViewport() && mobileSrc ? mobileSrc : desktopSrc;
}

export function preloadResponsiveImage(sources) {
  return preloadImageSrc(getCurrentResponsiveSrc(sources));
}

function ensureDesktopSourceNode(pictureNode) {
  let sourceNode = pictureNode.querySelector('source[data-kapsula-desktop-source]');

  if (sourceNode instanceof HTMLSourceElement) {
    return sourceNode;
  }

  sourceNode = document.createElement("source");
  sourceNode.dataset.kapsulaDesktopSource = "";
  sourceNode.media = DESKTOP_MEDIA_QUERY;
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

import {gsap} from "gsap";
import {
  createResponsivePictureNode,
  getResponsiveImageSources,
  preloadResponsiveImage,
} from "./formResponsiveImages.js";
import {prefersReducedMotion} from "../../../shared/motionPreferences.js";
import {getOverlayImageAlt} from "./overlay/overlayAlts.js";
import {
  getCollapsedClipFromStart,
  getCollapsedSliceClip,
  getParallaxOffset,
  getSegmentParallaxOffset,
  getSliceClip,
  getVisibleRange,
  HIDDEN_CLIP,
  shouldAnimateParallax,
} from "./overlay/overlayGeometry.js";

const DURATION = 1;
const EASE = "power3.out";
const IMAGE_SELECTOR = ".kapsula-form-screen__overlay-image";

function getAnimationDuration() {
  return prefersReducedMotion() ? 0 : DURATION;
}

function preloadImage(imageSrc) {
  return preloadResponsiveImage(getResponsiveImageSources(imageSrc));
}

function createLayer(sectionId) {
  const layerNode = document.createElement("div");

  layerNode.className = "kapsula-form-screen__overlay-layer";
  layerNode.dataset.overlaySectionId = sectionId;
  layerNode.dataset.overlayAnimation = "segments";
  layerNode.dataset.isVisible = "0";

  gsap.set(layerNode, {autoAlpha: 0});

  return layerNode;
}

function createSegment(imageSrc) {
  const segmentNode = document.createElement("div");
  const {pictureNode} = createResponsivePictureNode({
    ...getResponsiveImageSources(imageSrc),
    alt: getOverlayImageAlt(imageSrc),
    pictureClassName: "kapsula-form-screen__overlay-picture",
    imageClassName: "kapsula-form-screen__overlay-image",
    loading: "eager",
  });

  segmentNode.className = "kapsula-form-screen__overlay-segment";
  segmentNode.dataset.overlayImageSrc = imageSrc;
  segmentNode.dataset.isVisible = "0";
  segmentNode.dataset.clipStart = "0";
  segmentNode.append(pictureNode);

  return segmentNode;
}

function waitForSegmentImage(segmentNode) {
  const imageNode = segmentNode.querySelector(IMAGE_SELECTOR);

  if (!(imageNode instanceof HTMLImageElement)) {
    return Promise.resolve();
  }

  const decodeImage = async () => {
    try {
      await imageNode.decode?.();
    } catch {
      // Анимация должна остаться доступной, даже если декодирование не удалось.
    }
  };

  if (imageNode.complete) {
    return decodeImage();
  }

  return new Promise((resolve) => {
    imageNode.addEventListener("load", () => decodeImage().then(resolve), {once: true});
    imageNode.addEventListener("error", resolve, {once: true});
  });
}

function getOrCreateLayer(overlayNode, layerMap, sectionId) {
  const existingLayer = layerMap.get(sectionId);

  if (existingLayer) {
    return existingLayer;
  }

  const layerNode = createLayer(sectionId);

  overlayNode.append(layerNode);
  layerMap.set(sectionId, layerNode);

  return layerNode;
}

function getOrCreateSegment(layerNode, segmentMap, imageSrc) {
  const existingSegment = segmentMap.get(imageSrc);

  if (existingSegment) {
    return existingSegment;
  }

  const segmentNode = createSegment(imageSrc);

  gsap.set(segmentNode, {clipPath: HIDDEN_CLIP});
  layerNode.append(segmentNode);
  segmentMap.set(imageSrc, segmentNode);

  return segmentNode;
}

function createSegmentMap(layerNode) {
  return new Map(
    Array.from(layerNode.children).map(
      (segmentNode) => [segmentNode.dataset.overlayImageSrc, segmentNode],
    ),
  );
}

function animateLayerVisibility(layerNode, isVisible) {
  layerNode.dataset.isVisible = isVisible ? "1" : "0";
  gsap.killTweensOf(layerNode);

  if (isVisible) {
    gsap.set(layerNode, {autoAlpha: 1});
    return;
  }

  gsap.to(layerNode, {
    autoAlpha: 0,
    duration: 0,
    delay: getAnimationDuration(),
  });
}

function animateImageParallax(segmentNode, {offsetOverride, direction = -1, multiplier = 1} = {}) {
  const imageNode = segmentNode.querySelector(IMAGE_SELECTOR);

  if (!imageNode) return;

  const baseOffset = offsetOverride
    ?? getParallaxOffset(segmentNode.dataset.overlayImageSrc ?? "");

  gsap.killTweensOf(imageNode);
  gsap.fromTo(imageNode, {
    x: direction * baseOffset * multiplier,
  }, {
    x: 0,
    duration: getAnimationDuration(),
    ease: EASE,
  });
}

function isSegmentAnimationActual(segmentNode, animationRevision) {
  return segmentNode.dataset.isVisible === "1"
    && segmentNode.dataset.animationRevision === animationRevision;
}

function animateSegmentClip(segmentNode, clipPath, {
  isVisible,
  start,
  withParallax = false,
  parallaxOffset,
  parallaxDirection,
  parallaxMultiplier,
  animationRevision = null,
}) {
  const nextAnimationRevision = animationRevision
    ?? String(Number(segmentNode.dataset.animationRevision ?? 0) + 1);

  segmentNode.dataset.animationRevision = nextAnimationRevision;
  segmentNode.dataset.isVisible = isVisible ? "1" : "0";

  if (typeof start === "number") {
    segmentNode.dataset.clipStart = String(start);
  }

  gsap.killTweensOf(segmentNode);
  gsap.to(segmentNode, {
    clipPath,
    duration: getAnimationDuration(),
    ease: EASE,
  });

  if (!withParallax) return;

  preloadImage(segmentNode.dataset.overlayImageSrc ?? "").then(() => {
    if (!isSegmentAnimationActual(segmentNode, nextAnimationRevision)) return;

    animateImageParallax(segmentNode, {
      offsetOverride: parallaxOffset,
      direction: parallaxDirection,
      multiplier: parallaxMultiplier,
    });
  });
}

function revealSegmentWhenReady(segmentNode, clipPath, options) {
  const animationRevision = String(
    Number(segmentNode.dataset.animationRevision ?? 0) + 1,
  );

  segmentNode.dataset.animationRevision = animationRevision;
  segmentNode.dataset.isVisible = "1";

  if (typeof options.start === "number") {
    segmentNode.dataset.clipStart = String(options.start);
  }

  gsap.killTweensOf(segmentNode);

  Promise.all([
    preloadImage(segmentNode.dataset.overlayImageSrc ?? ""),
    waitForSegmentImage(segmentNode),
  ]).then(() => {
    if (!isSegmentAnimationActual(segmentNode, animationRevision)) return;

    animateSegmentClip(segmentNode, clipPath, {
      ...options,
      isVisible: true,
      animationRevision,
    });
  });
}

function hideSegment(segmentNode, animationOptions = {}) {
  const clipPath = segmentNode.dataset.isVisible === "1"
    ? getCollapsedClipFromStart(segmentNode.dataset.clipStart)
    : HIDDEN_CLIP;

  animateSegmentClip(segmentNode, clipPath, {
    isVisible: false,
    ...animationOptions,
  });
}

function prepareSegments(layerNode, segmentMap, sources) {
  sources.forEach((imageSrc) => {
    getOrCreateSegment(layerNode, segmentMap, imageSrc);
    preloadImage(imageSrc);
  });
}

function toSourceList(sources) {
  return Array.isArray(sources) ? sources.filter(Boolean) : [];
}

function animateLayerSegments(layerNode, {
  availableSources = [],
  selectedSources = [],
  parallaxDirection = -1,
  parallaxMultiplier = 1,
} = {}) {
  const nextSources = toSourceList(selectedSources);
  const segmentMap = createSegmentMap(layerNode);
  const previousVisibleCount = Array.from(segmentMap.values()).filter(
    (segmentNode) => segmentNode.dataset.isVisible === "1",
  ).length;

  prepareSegments(layerNode, segmentMap, toSourceList(availableSources));

  const nextSourceSet = new Set(nextSources);

  segmentMap.forEach((segmentNode, imageSrc) => {
    if (nextSourceSet.has(imageSrc)) return;

    hideSegment(segmentNode, {parallaxDirection, parallaxMultiplier});
  });

  nextSources.forEach((imageSrc, index) => {
    const segmentNode = getOrCreateSegment(layerNode, segmentMap, imageSrc);
    const {start} = getVisibleRange(index, nextSources.length);
    const wasVisible = segmentNode.dataset.isVisible === "1";

    if (!wasVisible) {
      gsap.set(segmentNode, {
        clipPath: getCollapsedSliceClip(index, nextSources.length),
      });
    }

    revealSegmentWhenReady(segmentNode, getSliceClip(index, nextSources.length), {
      start,
      withParallax: shouldAnimateParallax({
        nextVisibleCount: nextSources.length,
        wasVisible,
      }),
      parallaxOffset: getSegmentParallaxOffset({
        previousVisibleCount,
        nextVisibleCount: nextSources.length,
      }),
      parallaxDirection,
      parallaxMultiplier,
    });
  });
}

function animateSingleLayerImage(layerNode, {
  availableSources = [],
  selectedSources = [],
} = {}) {
  const preparedSources = toSourceList(availableSources);
  const nextImageSrc = toSourceList(selectedSources)[0] ?? preparedSources[0] ?? null;
  const segmentMap = createSegmentMap(layerNode);

  prepareSegments(layerNode, segmentMap, preparedSources);

  segmentMap.forEach((segmentNode, imageSrc) => {
    if (imageSrc === nextImageSrc) return;

    hideSegment(segmentNode);
  });

  if (!nextImageSrc) return;

  const segmentNode = getOrCreateSegment(layerNode, segmentMap, nextImageSrc);

  if (segmentNode.dataset.isVisible !== "1") {
    gsap.set(segmentNode, {clipPath: HIDDEN_CLIP});
  }

  revealSegmentWhenReady(segmentNode, getSliceClip(0, 1), {start: 0});
}

function animateLayer(layerNode, layer) {
  const animate = layer.animation === "single"
    ? animateSingleLayerImage
    : animateLayerSegments;

  animate(layerNode, {
    availableSources: layer.availableSources,
    selectedSources: layer.selectedSources,
  });
}

/**
 * @param {HTMLElement | null} overlayNode
 * @param {import("../legacyFormEffects").OverlayOptions} [options]
 */
export function animateFormImageOverlay(overlayNode, {layers = []} = {}) {
  if (!overlayNode) return;

  const normalizedLayers = Array.isArray(layers) ? layers : [];
  const layerMap = new Map(
    Array.from(overlayNode.children).map(
      (layerNode) => [layerNode.dataset.overlaySectionId, layerNode],
    ),
  );
  const visibleLayerIds = new Set(normalizedLayers.map((layer) => layer.sectionId));

  normalizedLayers.forEach((layer, index) => {
    const layerNode = getOrCreateLayer(overlayNode, layerMap, layer.sectionId);

    layerNode.dataset.overlayAnimation = layer.animation ?? "segments";
    layerNode.style.zIndex = String(index + 1);
    animateLayerVisibility(layerNode, true);
    animateLayer(layerNode, layer);
  });

  layerMap.forEach((layerNode, sectionId) => {
    if (visibleLayerIds.has(sectionId)) return;

    animateLayer(layerNode, {
      animation: layerNode.dataset.overlayAnimation,
      availableSources: [],
      selectedSources: [],
    });
    animateLayerVisibility(layerNode, false);
  });
}

/** @param {HTMLElement | null} overlayNode */
export function destroyFormImageOverlay(overlayNode) {
  if (!overlayNode) return;

  gsap.killTweensOf([overlayNode, ...overlayNode.querySelectorAll("*")]);
  overlayNode.replaceChildren();
}

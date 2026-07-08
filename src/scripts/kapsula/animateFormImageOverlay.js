import {gsap} from "gsap";
import {createResponsivePictureNode, getResponsiveImageSources} from "./formResponsiveImages.js";

const HIDDEN_CLIP = "inset(0 100% 0 0)";
const DURATION = 1;
const EASE = "power3.out";
const PARALLAX_VALUES = [8, 11, 14];
const SECOND_SEGMENT_PARALLAX_OFFSET = 8;
const imageLoadCache = new Map();
const OVERLAY_IMAGE_ALTS = {
  "/asia-desktop/thailand.webp": "Завтрак у бассейна с видом на море и пальмы",
  "/asia-desktop/bali.webp": "Тропическое побережье с волнами, скалами и деревянной лестницей",
  "/asia-desktop/china.webp": "Песчаный пляж и пальмы у бирюзового моря, вид сверху",
  "/asia-desktop/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/asia-desktop/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/asia-desktop/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/asia-mobile/thailand.webp": "Завтрак у бассейна с видом на море и пальмы",
  "/asia-mobile/bali.webp": "Тропическое побережье с волнами, скалами и деревянной лестницей",
  "/asia-mobile/china.webp": "Песчаный пляж и пальмы у бирюзового моря, вид сверху",
  "/asia-mobile/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/asia-mobile/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/asia-mobile/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/oriental-desktop/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/oriental-desktop/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/oriental-desktop/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/oriental-desktop/turkey.webp": "Пляжный курорт с бассейном и террасами у моря в Турции",
  "/oriental-desktop/egypt.webp": "Курорт у побережья Красного моря с песчаным берегом и пальмами в Египте",
  "/oriental-desktop/uae.webp": "Современный курорт у побережья с мариной и архитектурой ОАЭ",
  "/oriental-desktop/suite.webp": "Светлый люкс с зоной отдыха и панорамными окнами курортного отеля",
  "/oriental-desktop/family.webp": "Просторный семейный номер курортного отеля с большой кроватью и мягкой зоной",
  "/oriental-desktop/villa.webp": "Уединенная вилла с личной террасой и бассейном среди курортного сада",
  "/oriental-desktop/flight.webp": "Салон самолета с креслами разных классов обслуживания",
  "/oriental-desktop/transfer.webp": "Премиальный трансфер к отелю на фоне курортной инфраструктуры",
  "/oriental-desktop/food.webp": "Сервировка завтрака и блюда курортного ресторана у воды",
  "/oriental-desktop/sea.webp": "Яхта и морское побережье для отдыха на воде",
  "/oriental-desktop/spa.webp": "Спа-пространство с массажем и расслабляющей атмосферой",
  "/oriental-desktop/nature.webp": "Живописная природная локация для экскурсий и прогулок",
  "/oriental-desktop/city.webp": "Оживленный городской курортный район с вечерними огнями",
  "/oriental-mobile/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/oriental-mobile/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/oriental-mobile/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/oriental-mobile/turkey.webp": "Пляжный курорт с бассейном и террасами у моря в Турции",
  "/oriental-mobile/egypt.webp": "Курорт у побережья Красного моря с песчаным берегом и пальмами в Египте",
  "/oriental-mobile/uae.webp": "Современный курорт у побережья с мариной и архитектурой ОАЭ",
  "/oriental-mobile/suite.webp": "Светлый люкс с зоной отдыха и панорамными окнами курортного отеля",
  "/oriental-mobile/family.webp": "Просторный семейный номер курортного отеля с большой кроватью и мягкой зоной",
  "/oriental-mobile/villa.webp": "Уединенная вилла с личной террасой и бассейном среди курортного сада",
  "/oriental-mobile/flight.webp": "Салон самолета с креслами разных классов обслуживания",
  "/oriental-mobile/transfer.webp": "Премиальный трансфер к отелю на фоне курортной инфраструктуры",
  "/oriental-mobile/food.webp": "Сервировка завтрака и блюда курортного ресторана у воды",
  "/oriental-mobile/sea.webp": "Яхта и морское побережье для отдыха на воде",
  "/oriental-mobile/spa.webp": "Спа-пространство с массажем и расслабляющей атмосферой",
  "/oriental-mobile/nature.webp": "Живописная природная локация для экскурсий и прогулок",
  "/oriental-mobile/city.webp": "Оживленный городской курортный район с вечерними огнями",
  "/island-desktop/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/island-desktop/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/island-desktop/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/island-desktop/maldives.webp": "Виллы над водой и лагуна с бирюзовой водой на Мальдивах",
  "/island-desktop/seychelles.webp": "Тропический пляж с гранитными валунами и пальмами на Сейшелах",
  "/island-desktop/mauritius.webp": "Побережье с белым песком и курортными отелями на Маврикии",
  "/island-desktop/suite.webp": "Светлый люкс курортного островного отеля с мягкой зоной отдыха",
  "/island-desktop/family.webp": "Просторный семейный номер островного отеля с двумя зонами отдыха",
  "/island-desktop/villa.webp": "Островная вилла с приватным бассейном и выходом к пляжу",
  "/island-desktop/flight.webp": "Салон самолета для дальнего перелета на островной курорт",
  "/island-desktop/transfer.webp": "Трансфер к островному отелю на фоне моря и причала",
  "/island-desktop/food.webp": "Блюда и сервировка в ресторане островного курорта",
  "/island-desktop/sea.webp": "Лодка у лазурной воды для морских впечатлений и снорклинга",
  "/island-desktop/spa.webp": "Островное спа с массажем и видом на тропическую природу",
  "/island-desktop/nature.webp": "Тропическая природная локация для прогулок и экскурсий",
  "/island-desktop/city.webp": "Городской ритм островного направления с набережной и огнями",
  "/island-mobile/minimal.webp": "Минималистичный курортный интерьер с бассейном у моря",
  "/island-mobile/boho.webp": "Курортная вилла в стиле бохо с природными материалами и зеленью",
  "/island-mobile/high-tech.webp": "Современная вилла в стиле хай-тек на склоне у моря",
  "/island-mobile/maldives.webp": "Виллы над водой и лагуна с бирюзовой водой на Мальдивах",
  "/island-mobile/seychelles.webp": "Тропический пляж с гранитными валунами и пальмами на Сейшелах",
  "/island-mobile/mauritius.webp": "Побережье с белым песком и курортными отелями на Маврикии",
  "/island-mobile/suite.webp": "Светлый люкс курортного островного отеля с мягкой зоной отдыха",
  "/island-mobile/family.webp": "Просторный семейный номер островного отеля с двумя зонами отдыха",
  "/island-mobile/villa.webp": "Островная вилла с приватным бассейном и выходом к пляжу",
  "/island-mobile/flight.webp": "Салон самолета для дальнего перелета на островной курорт",
  "/island-mobile/transfer.webp": "Трансфер к островному отелю на фоне моря и причала",
  "/island-mobile/food.webp": "Блюда и сервировка в ресторане островного курорта",
  "/island-mobile/sea.webp": "Лодка у лазурной воды для морских впечатлений и снорклинга",
  "/island-mobile/spa.webp": "Островное спа с массажем и видом на тропическую природу",
  "/island-mobile/nature.webp": "Тропическая природная локация для прогулок и экскурсий",
  "/island-mobile/city.webp": "Городской ритм островного направления с набережной и огнями",
};

function getOverlayImageAlt(imageSrc) {
  return OVERLAY_IMAGE_ALTS[imageSrc] ?? "Фрагмент путешествия";
}

function getParallaxOffset(imageSrc) {
  const charSum = Array.from(imageSrc).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return PARALLAX_VALUES[charSum % PARALLAX_VALUES.length];
}

function shouldAnimateParallax({nextVisibleCount, wasVisible}) {
  return nextVisibleCount > 1 && !wasVisible;
}

function getSegmentParallaxOffset({previousVisibleCount, nextVisibleCount}) {
  if (previousVisibleCount === 1 && nextVisibleCount === 2) {
    return SECOND_SEGMENT_PARALLAX_OFFSET;
  }

  return undefined;
}

function formatPercent(value) {
  return Number(value.toFixed(4));
}

function getVisibleRange(index, total) {
  if (total === 1) {
    return {start: 0, end: 100};
  }

  if (total === 2) {
    return index === 0
      ? {start: 70, end: 100}
      : {start: 0, end: 70};
  }

  const ranges = [
    {start: 75, end: 100},
    {start: 50, end: 75},
    {start: 0, end: 50},
  ];

  return ranges[index] ?? {start: 0, end: 0};
}

function getSliceClip(index, total) {
  const {start, end} = getVisibleRange(index, total);
  const left = formatPercent(start);
  const right = formatPercent(100 - end);

  return `inset(0 ${right}% 0 ${left}%)`;
}

function getCollapsedSliceClip(index, total) {
  const {start} = getVisibleRange(index, total);
  const left = formatPercent(start);

  return `inset(0 ${100 - left}% 0 ${left}%)`;
}

function getCollapsedCurrentClip(segmentNode) {
  const left = Number(segmentNode.dataset.clipStart ?? 0);

  return `inset(0 ${100 - left}% 0 ${left}%)`;
}

function createLayer(sectionId) {
  const layerNode = document.createElement("div");

  layerNode.className = "kapsula-form-screen__overlay-layer";
  layerNode.dataset.overlaySectionId = sectionId;
  layerNode.dataset.overlayAnimation = "segments";
  layerNode.dataset.isVisible = "0";

  gsap.set(layerNode, {
    autoAlpha: 0,
  });

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

function preloadSingleImage(imageSrc) {
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
    const finalize = () => resolve();

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

function preloadImage(imageSrc) {
  const {desktopSrc, mobileSrc} = getResponsiveImageSources(imageSrc);

  return Promise.all(
    [desktopSrc, mobileSrc].filter(Boolean).map((src) => preloadSingleImage(src)),
  );
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

  gsap.set(segmentNode, {
    clipPath: HIDDEN_CLIP,
  });
  layerNode.append(segmentNode);
  segmentMap.set(imageSrc, segmentNode);

  return segmentNode;
}

function animateLayerVisibility(layerNode, isVisible) {
  layerNode.dataset.isVisible = isVisible ? "1" : "0";
  gsap.killTweensOf(layerNode);

  if (isVisible) {
    gsap.set(layerNode, {
      autoAlpha: 1,
    });
    return;
  }

  gsap.to(layerNode, {
    autoAlpha: 0,
    duration: 0,
    delay: DURATION,
  });
}

function animateImageParallax(segmentNode, {offsetOverride, direction = -1, multiplier = 1} = {}) {
  const imageNode = segmentNode.querySelector(".kapsula-form-screen__overlay-image");

  if (!imageNode) return;

  const baseOffset = offsetOverride ?? getParallaxOffset(segmentNode.dataset.overlayImageSrc ?? "");
  const offset = direction * baseOffset * multiplier;

  gsap.killTweensOf(imageNode);
  gsap.fromTo(imageNode, {
    x: offset,
  }, {
    x: 0,
    duration: DURATION,
    ease: EASE,
  });
}

function animateSegmentClip(segmentNode, clipPath, {
  isVisible,
  start,
  withParallax = false,
  parallaxOffset,
  parallaxDirection,
  parallaxMultiplier,
}) {
  segmentNode.dataset.isVisible = isVisible ? "1" : "0";

  if (typeof start === "number") {
    segmentNode.dataset.clipStart = String(start);
  }

  gsap.killTweensOf(segmentNode);

  gsap.to(segmentNode, {
    clipPath,
    duration: DURATION,
    ease: EASE,
  });

  if (withParallax) {
    preloadImage(segmentNode.dataset.overlayImageSrc ?? "")
      .then(() => {
        if (segmentNode.dataset.isVisible !== "1") return;
        animateImageParallax(segmentNode, {
          offsetOverride: parallaxOffset,
          direction: parallaxDirection,
          multiplier: parallaxMultiplier,
        });
      });
  }
}

function animateLayerSegments(layerNode, {
  availableSources = [],
  selectedSources = [],
  parallaxDirection = -1,
  parallaxMultiplier = 1,
} = {}) {
  const preparedSources = Array.isArray(availableSources) ? availableSources.filter(Boolean) : [];
  const nextSources = Array.isArray(selectedSources) ? selectedSources.filter(Boolean) : [];
  const segmentMap = new Map(
    Array.from(layerNode.children).map((segmentNode) => [segmentNode.dataset.overlayImageSrc, segmentNode]),
  );
  const previousVisibleCount = Array.from(segmentMap.values()).filter(
    (segmentNode) => segmentNode.dataset.isVisible === "1",
  ).length;

  preparedSources.forEach((imageSrc) => {
    getOrCreateSegment(layerNode, segmentMap, imageSrc);
    preloadImage(imageSrc);
  });

  const nextSourceSet = new Set(nextSources);

  segmentMap.forEach((segmentNode, imageSrc) => {
    if (nextSourceSet.has(imageSrc)) return;

    const clipPath = segmentNode.dataset.isVisible === "1"
      ? getCollapsedCurrentClip(segmentNode)
      : HIDDEN_CLIP;

    animateSegmentClip(segmentNode, clipPath, {
      isVisible: false,
      parallaxDirection,
      parallaxMultiplier,
    });
  });

  nextSources.forEach((imageSrc, index) => {
    const segmentNode = getOrCreateSegment(layerNode, segmentMap, imageSrc);
    const targetClip = getSliceClip(index, nextSources.length);
    const {start} = getVisibleRange(index, nextSources.length);
    const wasVisible = segmentNode.dataset.isVisible === "1";

    if (!wasVisible) {
      gsap.set(segmentNode, {
        clipPath: getCollapsedSliceClip(index, nextSources.length),
      });
    }

    animateSegmentClip(segmentNode, targetClip, {
      isVisible: true,
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
  const preparedSources = Array.isArray(availableSources) ? availableSources.filter(Boolean) : [];
  const nextImageSrc = selectedSources.find(Boolean) ?? preparedSources[0] ?? null;
  const segmentMap = new Map(
    Array.from(layerNode.children).map((segmentNode) => [segmentNode.dataset.overlayImageSrc, segmentNode]),
  );

  preparedSources.forEach((imageSrc) => {
    getOrCreateSegment(layerNode, segmentMap, imageSrc);
    preloadImage(imageSrc);
  });

  segmentMap.forEach((segmentNode, imageSrc) => {
    if (imageSrc === nextImageSrc) return;

    const clipPath = segmentNode.dataset.isVisible === "1"
      ? getCollapsedCurrentClip(segmentNode)
      : HIDDEN_CLIP;

    animateSegmentClip(segmentNode, clipPath, {
      isVisible: false,
    });
  });

  if (!nextImageSrc) {
    return;
  }

  const segmentNode = getOrCreateSegment(layerNode, segmentMap, nextImageSrc);
  const wasVisible = segmentNode.dataset.isVisible === "1";

  if (!wasVisible) {
    gsap.set(segmentNode, {
      clipPath: HIDDEN_CLIP,
    });
  }

  animateSegmentClip(segmentNode, getSliceClip(0, 1), {
    isVisible: true,
    start: 0,
  });
}

export function animateFormImageOverlay(overlayNode, {layers = []} = {}) {
  if (!overlayNode) return;

  const normalizedLayers = Array.isArray(layers) ? layers : [];
  const layerMap = new Map(
    Array.from(overlayNode.children).map((layerNode) => [layerNode.dataset.overlaySectionId, layerNode]),
  );
  const visibleLayerIds = new Set(normalizedLayers.map((layer) => layer.sectionId));

  normalizedLayers.forEach((layer, index) => {
    const layerNode = getOrCreateLayer(overlayNode, layerMap, layer.sectionId);

    layerNode.dataset.overlayAnimation = layer.animation ?? "segments";
    layerNode.style.zIndex = String(index + 1);
    animateLayerVisibility(layerNode, true);
    if (layer.animation === "single") {
      animateSingleLayerImage(layerNode, {
        availableSources: layer.availableSources,
        selectedSources: layer.selectedSources,
      });
      return;
    }

    animateLayerSegments(layerNode, {
      availableSources: layer.availableSources,
      selectedSources: layer.selectedSources,
    });
  });

  layerMap.forEach((layerNode, sectionId) => {
    if (visibleLayerIds.has(sectionId)) return;

    if (layerNode.dataset.overlayAnimation === "single") {
      animateSingleLayerImage(layerNode, {
        availableSources: [],
        selectedSources: [],
      });
    } else {
      animateLayerSegments(layerNode, {
        availableSources: [],
        selectedSources: [],
      });
    }

    animateLayerVisibility(layerNode, false);
  });
}

import {gsap} from "gsap";

const HIDDEN_CLIP = "inset(0 100% 0 0)";
const VISIBLE_CLIP = "inset(0 0% 0 0)";
const REVEAL_DURATION = 0.95;
const RESIZE_DURATION = 0.75;
const HIDE_DURATION = 0.48;

function createSegment(imageSrc) {
  const segmentNode = document.createElement("div");
  const imageNode = document.createElement("img");

  segmentNode.className = "kapsula-form-screen__overlay-segment";
  segmentNode.dataset.overlayImageSrc = imageSrc;
  imageNode.className = "kapsula-form-screen__overlay-image";
  imageNode.src = imageSrc;
  imageNode.alt = "";

  segmentNode.append(imageNode);

  return segmentNode;
}

function revealSegment(segmentNode, imageSrc) {
  if (segmentNode.dataset.overlayImageSrc !== imageSrc) return;

  gsap.killTweensOf(segmentNode);
  gsap.fromTo(segmentNode, {
    autoAlpha: 1,
    clipPath: HIDDEN_CLIP,
  }, {
    autoAlpha: 1,
    clipPath: VISIBLE_CLIP,
    duration: REVEAL_DURATION,
    ease: "power3.inOut",
  });
}

function setSegmentVisibility(segmentNode, imageSrc) {
  const imageNode = segmentNode.querySelector("img");

  if (!imageNode || imageNode.complete) {
    revealSegment(segmentNode, imageSrc);
    return;
  }

  imageNode.addEventListener("load", () => revealSegment(segmentNode, imageSrc), {
    once: true,
  });
}

export function animateFormImageOverlay(overlayNode, imageSources) {
  if (!overlayNode) return;

  const nextSources = Array.isArray(imageSources) ? imageSources.filter(Boolean) : [];
  const segmentMap = new Map(
    Array.from(overlayNode.children).map((segmentNode) => [segmentNode.dataset.overlayImageSrc, segmentNode]),
  );

  if (!nextSources.length) {
    gsap.killTweensOf(overlayNode);
    gsap.to(overlayNode, {
      autoAlpha: 0,
      duration: HIDE_DURATION,
      ease: "power3.inOut",
      onComplete: () => {
        overlayNode.replaceChildren();
      },
    });
    return;
  }

  gsap.killTweensOf(overlayNode);
  gsap.to(overlayNode, {
    autoAlpha: 1,
    duration: 0.24,
    ease: "power3.out",
  });

  const nextSegments = [];

  nextSources.forEach((imageSrc) => {
    let segmentNode = segmentMap.get(imageSrc);
    const isNewSegment = !segmentNode;

    if (!segmentNode) {
      segmentNode = createSegment(imageSrc);
      gsap.set(segmentNode, {
        autoAlpha: 0,
        clipPath: HIDDEN_CLIP,
        flexBasis: 0,
      });
    }

    overlayNode.append(segmentNode);
    nextSegments.push(segmentNode);
    segmentMap.delete(imageSrc);

    if (isNewSegment) {
      setSegmentVisibility(segmentNode, imageSrc);
    } else {
      gsap.to(segmentNode, {
        clipPath: VISIBLE_CLIP,
        autoAlpha: 1,
        duration: RESIZE_DURATION,
        ease: "power3.inOut",
      });
    }
  });

  const segmentWidth = `${100 / nextSources.length}%`;

  nextSegments.forEach((segmentNode) => {
    gsap.to(segmentNode, {
      flexBasis: segmentWidth,
      duration: RESIZE_DURATION,
      ease: "power3.inOut",
    });
  });

  segmentMap.forEach((segmentNode) => {
    gsap.killTweensOf(segmentNode);
    gsap.to(segmentNode, {
      autoAlpha: 0,
      flexBasis: 0,
      duration: HIDE_DURATION,
      ease: "power3.inOut",
      onComplete: () => {
        segmentNode.remove();
      },
    });
  });
}

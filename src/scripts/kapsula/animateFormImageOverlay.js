import {gsap} from "gsap";

const HIDDEN_CLIP = "inset(0 100% 0 0)";
const DURATION = 1;
const EASE = "power3.out";
const PARALLAX_VALUES = [8, 11, 14];

function getParallaxOffset(imageSrc) {
    const charSum = Array.from(imageSrc).reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return PARALLAX_VALUES[charSum % PARALLAX_VALUES.length];
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

function createSegment(imageSrc) {
    const segmentNode = document.createElement("div");
    const imageNode = document.createElement("img");

    segmentNode.className = "kapsula-form-screen__overlay-segment";
    segmentNode.dataset.overlayImageSrc = imageSrc;
    segmentNode.dataset.isVisible = "0";
    segmentNode.dataset.clipStart = "0";
    imageNode.className = "kapsula-form-screen__overlay-image";
    imageNode.src = imageSrc;
    imageNode.alt = "";

    segmentNode.append(imageNode);

    return segmentNode;
}

function getOrCreateSegment(overlayNode, segmentMap, imageSrc) {
    const existingSegment = segmentMap.get(imageSrc);

    if (existingSegment) return existingSegment;

    const segmentNode = createSegment(imageSrc);

    gsap.set(segmentNode, {
        clipPath: HIDDEN_CLIP,
    });
    overlayNode.append(segmentNode);
    segmentMap.set(imageSrc, segmentNode);

    return segmentNode;
}

function animateImageParallax(segmentNode) {
    const imageNode = segmentNode.querySelector("img");

    if (!imageNode) return;

    gsap.killTweensOf(imageNode);
    gsap.fromTo(imageNode, {
        x: 0,
    }, {
        x: -getParallaxOffset(segmentNode.dataset.overlayImageSrc ?? ""),
        duration: DURATION,
        ease: EASE,
        onComplete: () => {
            gsap.set(imageNode, {
                x: 0
            });
        },
    });
}

function animateSegmentClip(segmentNode, clipPath, {isVisible, start, withParallax = false}) {
    segmentNode.dataset.isVisible = isVisible ? "1" : "0";

    if (typeof start === "number") {
        segmentNode.dataset.clipStart = String(start);
    }

    gsap.killTweensOf(segmentNode);

    if (withParallax) {
        animateImageParallax(segmentNode);
    }

    gsap.to(segmentNode, {
        clipPath,
        duration: DURATION,
        ease: EASE,
    });
}

export function animateFormImageOverlay(overlayNode, {availableSources = [], selectedSources = []} = {}) {
    if (!overlayNode) return;

    const preparedSources = Array.isArray(availableSources) ? availableSources.filter(Boolean) : [];
    const nextSources = Array.isArray(selectedSources) ? selectedSources.filter(Boolean) : [];
    const segmentMap = new Map(
        Array.from(overlayNode.children).map((segmentNode) => [segmentNode.dataset.overlayImageSrc, segmentNode]),
    );

    preparedSources.forEach((imageSrc) => {
        getOrCreateSegment(overlayNode, segmentMap, imageSrc);
    });

    const nextSourceSet = new Set(nextSources);

    segmentMap.forEach((segmentNode, imageSrc) => {
        if (nextSourceSet.has(imageSrc)) return;

        const clipPath = segmentNode.dataset.isVisible === "1"
            ? getCollapsedCurrentClip(segmentNode)
            : HIDDEN_CLIP;

        animateSegmentClip(segmentNode, clipPath, {
            isVisible: false,
        });
    });

    nextSources.forEach((imageSrc, index) => {
        const segmentNode = getOrCreateSegment(overlayNode, segmentMap, imageSrc);
        const targetClip = getSliceClip(index, nextSources.length);
        const {start} = getVisibleRange(index, nextSources.length);
        const previousStart = Number(segmentNode.dataset.clipStart ?? 0);
        const wasVisible = segmentNode.dataset.isVisible === "1";

        if (!wasVisible) {
            gsap.set(segmentNode, {
                clipPath: getCollapsedSliceClip(index, nextSources.length),
            });
        }

        animateSegmentClip(segmentNode, targetClip, {
            isVisible: true,
            start,
            withParallax: !wasVisible || start > previousStart,
        });
    });
}

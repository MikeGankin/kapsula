import {createEmblaCarousel} from "./createEmblaCarousel.js";

const carouselRegistry = new WeakMap();

function resolveOptions(containerNode, userOptions) {
    const baseOptions = typeof userOptions === "function"
        ? userOptions(containerNode)
        : userOptions;

    return {
        breakpoints: {
            "(min-width: 993px)": {
                active: false,
            },
        },
        ...baseOptions,
        container: containerNode,
    };
}

export function syncEmblaCarousel(containerNode, userOptions = {}) {
  if (!containerNode) {
    return null;
  }

  const options = resolveOptions(containerNode, userOptions);
  const existingCarousel = carouselRegistry.get(containerNode);

  if (existingCarousel) {
    existingCarousel.api.reInit(options);
    return existingCarousel.api;
  }

  const carousel = createEmblaCarousel(containerNode, options);



  if (!carousel) {
    return null;
  }

  carouselRegistry.set(containerNode, carousel);
  return carousel.api;
}

export function destroyEmblaCarousel(containerNode) {
  const carousel = containerNode ? carouselRegistry.get(containerNode) : null;

  if (!carousel) {
    return false;
  }

  carousel.api.destroy();
  carouselRegistry.delete(containerNode);
  return true;
}

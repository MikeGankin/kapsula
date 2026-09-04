function updateEmblaDotsState(paginationNode, emblaApi) {
  if (!(paginationNode instanceof HTMLElement) || !emblaApi) {
    return;
  }

  const selectedIndex = emblaApi.selectedScrollSnap();
  const dotNodes = paginationNode.querySelectorAll(".embla__dot");

  dotNodes.forEach((dotNode, index) => {
    dotNode.classList.toggle("embla__dot--selected", index === selectedIndex);
    dotNode.setAttribute("aria-current", index === selectedIndex ? "true" : "false");
  });
}

export function syncEmblaDots(paginationNode, emblaApi, {
  label = "Перейти к слайду",
} = {}) {
  if (!(paginationNode instanceof HTMLElement) || !emblaApi) {
    return;
  }

  const scrollSnaps = emblaApi.scrollSnapList();

  paginationNode.replaceChildren();

  if (scrollSnaps.length < 2) {
    paginationNode.hidden = true;
    return;
  }

  scrollSnaps.forEach((_, index) => {
    const dotNode = document.createElement("button");
    dotNode.type = "button";
    dotNode.className = "embla__dot";
    dotNode.setAttribute("aria-label", `${label} ${index + 1}`);
    dotNode.addEventListener("click", () => {
      emblaApi.scrollTo(index);
    });
    paginationNode.append(dotNode);
  });

  paginationNode.hidden = false;
  updateEmblaDotsState(paginationNode, emblaApi);
}

/**
 * @returns {() => void} отписка от событий Embla. Обязательна к вызову:
 * без неё повторный `bindEmblaDots` (после `setCapsule`/`reInit`) копит
 * подписки, и на каждое переключение слайда отрабатывает N обработчиков.
 */
export function bindEmblaDots(paginationNode, emblaApi, options = {}) {
  if (!(paginationNode instanceof HTMLElement) || !emblaApi) {
    return () => {};
  }

  syncEmblaDots(paginationNode, emblaApi, options);

  const handleSelect = () => {
    updateEmblaDotsState(paginationNode, emblaApi);
  };

  const handleReInit = () => {
    syncEmblaDots(paginationNode, emblaApi, options);
  };

  emblaApi.on("select", handleSelect);
  emblaApi.on("reInit", handleReInit);

  return () => {
    emblaApi.off("select", handleSelect);
    emblaApi.off("reInit", handleReInit);
    paginationNode.replaceChildren();
  };
}

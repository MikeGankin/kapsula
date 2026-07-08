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

export function bindEmblaDots(paginationNode, emblaApi, options = {}) {
  if (!(paginationNode instanceof HTMLElement) || !emblaApi) {
    return;
  }

  syncEmblaDots(paginationNode, emblaApi, options);

  emblaApi.on("select", () => {
    updateEmblaDotsState(paginationNode, emblaApi);
  });

  emblaApi.on("reInit", () => {
    syncEmblaDots(paginationNode, emblaApi, options);
  });
}

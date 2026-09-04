import EmblaCarousel from "embla-carousel";

function ensureViewportNode(containerNode) {
  const parentNode = containerNode.parentElement;

  if (parentNode?.classList.contains("kapsula-embla__viewport")) {
    return parentNode;
  }

  const viewportNode = document.createElement("div");
  viewportNode.className = "kapsula-embla__viewport";
  containerNode.before(viewportNode);
  viewportNode.append(containerNode);

  return viewportNode;
}

export function createEmblaCarousel(containerNode, userOptions = {}) {
  if (!containerNode) {
    return null;
  }

  const viewportNode = ensureViewportNode(containerNode);
  containerNode.classList.add("kapsula-embla__container");

    const options = {
        align: "start",
        containScroll: "trimSnaps",
        container: containerNode,
        ...userOptions,
    };

  const api = EmblaCarousel(viewportNode, options);

  return {
    api,
    containerNode,
    viewportNode,
  };
}

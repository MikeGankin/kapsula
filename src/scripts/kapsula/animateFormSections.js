import {gsap} from "gsap";

function setIfPresent(node, properties) {
  if (!node) return;
  gsap.set(node, properties);
}

function toIfPresent(timeline, node, properties, position) {
  if (!node) return timeline;
  return timeline.to(node, properties, position);
}

function hasSummaryContent(node) {
  return Boolean(node?.textContent?.trim());
}

function getSummaryState(node) {
  const hasContent = hasSummaryContent(node);

  return {
    autoAlpha: hasContent ? 1 : 0,
  };
}

function animateSummaryReveal(node) {
  if (!hasSummaryContent(node)) return;

  gsap.fromTo(node, {
    autoAlpha: 0,
  }, {
    autoAlpha: 1,
    duration: 0.24,
    ease: "power2.out",
  });
}

function areSectionValuesEqual(currentValue, previousValue) {
  if (Array.isArray(currentValue) || Array.isArray(previousValue)) {
    if (!Array.isArray(currentValue) || !Array.isArray(previousValue)) return false;
    if (currentValue.length !== previousValue.length) return false;

    return currentValue.every((value, index) => value === previousValue[index]);
  }

  return currentValue === previousValue;
}

function getSectionState(sectionNode) {
  return {
    panel: sectionNode.querySelector(".kapsula-form-section__panel"),
    panelInner: sectionNode.querySelector(".kapsula-form-section__panel-inner"),
    heading: sectionNode.querySelector(".kapsula-form-section__heading"),
    summary: sectionNode.querySelector(".kapsula-form-section__summary"),
    chevron: sectionNode.querySelector(".kapsula-form-section__chevron"),
  };
}

function setSectionState(nodes, isExpanded) {
  gsap.set(nodes.panel, {
    height: isExpanded ? "auto" : 0,
    opacity: isExpanded ? 1 : 0,
  });
  gsap.set(nodes.panelInner, {
    opacity: isExpanded ? 1 : 0,
    y: isExpanded ? 0 : -8,
  });
  gsap.set(nodes.heading, {
    scale: isExpanded ? 1.08 : 1,
  });
  setIfPresent(nodes.summary, getSummaryState(nodes.summary));
  setIfPresent(nodes.chevron, {
    rotation: isExpanded ? 180 : 0,
  });
}

function animateSectionState(nodes, isExpanded) {
  const timeline = gsap.timeline({
    defaults: {
      ease: "power2.out",
    },
  });

  timeline
    .to(nodes.panel, {
      height: isExpanded ? "auto" : 0,
      opacity: isExpanded ? 1 : 0,
      duration: 0.32,
    }, 0)
    .to(nodes.panelInner, {
      opacity: isExpanded ? 1 : 0,
      y: isExpanded ? 0 : -8,
      duration: 0.24,
    }, isExpanded ? 0.08 : 0)
    .to(nodes.heading, {
      scale: isExpanded ? 1.08 : 1,
      duration: 0.24,
    }, 0);

  toIfPresent(timeline, nodes.summary, {
    ...getSummaryState(nodes.summary),
    duration: 0.24,
  }, 0.1);

  toIfPresent(timeline, nodes.chevron, {
    rotation: isExpanded ? 180 : 0,
    duration: 0.28,
  }, 0);
}

export function animateFormSections(
  formNode,
  expandedState,
  previousExpandedState = expandedState,
  values = {},
  previousValues = values,
) {
  formNode.querySelectorAll(".kapsula-form-section").forEach((sectionNode) => {
    const trigger = sectionNode.querySelector("[data-kapsula-section-trigger]");
    const sectionId = trigger?.dataset.sectionId;

    if (!sectionId) return;

    const nodes = getSectionState(sectionNode);
    const isExpanded = Boolean(expandedState[sectionId]);
    const wasExpanded = Boolean(previousExpandedState[sectionId]);
    const valueChanged = !areSectionValuesEqual(values[sectionId], previousValues[sectionId]);

    if (isExpanded === wasExpanded) {
      setSectionState(nodes, isExpanded);
      if (valueChanged) {
        animateSummaryReveal(nodes.summary);
      }
      return;
    }

    setSectionState(nodes, wasExpanded);
    animateSectionState(nodes, isExpanded);
  });
}

import {gsap} from "gsap";

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
  gsap.set(nodes.summary, {
    autoAlpha: isExpanded ? 0 : 1,
  });
  gsap.set(nodes.chevron, {
    rotation: isExpanded ? -135 : 45,
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
    }, 0)
    .to(nodes.summary, {
      autoAlpha: isExpanded ? 0 : 1,
      duration: 0.18,
    }, 0)
    .to(nodes.chevron, {
      rotation: isExpanded ? -135 : 45,
      duration: 0.28,
    }, 0);
}

export function animateFormSections(formNode, expandedState, previousExpandedState = expandedState) {
  formNode.querySelectorAll(".kapsula-form-section").forEach((sectionNode) => {
    const trigger = sectionNode.querySelector("[data-kapsula-section-trigger]");
    const sectionId = trigger?.dataset.sectionId;

    if (!sectionId) return;

    const nodes = getSectionState(sectionNode);
    const isExpanded = Boolean(expandedState[sectionId]);
    const wasExpanded = Boolean(previousExpandedState[sectionId]);

    if (isExpanded === wasExpanded) {
      setSectionState(nodes, isExpanded);
      return;
    }

    setSectionState(nodes, wasExpanded);
    animateSectionState(nodes, isExpanded);
  });
}

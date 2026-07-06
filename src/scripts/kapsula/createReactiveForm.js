import {BehaviorSubject, combineLatest, distinctUntilChanged, fromEvent, map} from "rxjs";
import {
  buildCapsuleMap,
  buildExpandedState,
  buildInitialValues,
  getCapsule,
  getInitialCapsuleId,
} from "./formSchema.js";
import {validateSchema} from "./formValidation.js";
import {normalizeFormValues, toggleOptionValue} from "./formValues.js";
import {renderForm} from "./renderForm.js";
import {animateFormSections} from "./animateFormSections.js";
import {animateFormImageOverlay} from "./animateFormImageOverlay.js";

function getSectionOverlaySources(section) {
  return Array.from(new Set(
    section.options
      ?.map((option) => option.overlayImageSrc)
      .filter(Boolean) ?? [],
  ));
}

function getSelectedSectionOverlayImages(section, values) {
  if (!section) {
    return [];
  }

  const currentValue = values[section.id];
  const selectedValues = Array.isArray(currentValue)
    ? currentValue
    : [currentValue].filter(Boolean);

  return Array.from(new Set(
    selectedValues.flatMap((selectedValue) => {
      const selectedOption = section.options?.find((option) => option.value === selectedValue);

      return selectedOption?.overlayImageSrc ? [selectedOption.overlayImageSrc] : [];
    }),
  ));
}

function getExpandedSectionId(capsule, expandedState) {
  return capsule.sections.find((section) => expandedState[section.id])?.id ?? capsule.sections[0]?.id ?? null;
}

function getFormSnapshot(capsuleMap, capsuleId, values) {
  const capsule = getCapsule(capsuleMap, capsuleId);
  const normalizedValues = normalizeFormValues(capsule.sections, buildInitialValues(capsule.sections, values));

  return {
    capsuleId,
    capsule,
    values: normalizedValues,
  };
}

function getOverlayLayers(capsule, values, expandedState, activeSectionId) {
  const activeSection = capsule.sections.find((section) => section.id === activeSectionId);

  if (activeSection?.overlayPreviewOnEnter && expandedState[activeSection.id]) {
    const selectedSources = getSelectedSectionOverlayImages(activeSection, values);
    const availableSources = getSectionOverlaySources(activeSection);
    const previewSources = selectedSources.length > 0 ? selectedSources : availableSources;

    if (previewSources.length === 0) {
      return [];
    }

    return [{
      sectionId: activeSection.id,
      animation: activeSection.overlayAnimation ?? "segments",
      availableSources,
      selectedSources: previewSources,
    }];
  }

  return capsule.sections.flatMap((section) => {
    const selectedSources = getSelectedSectionOverlayImages(section, values);
    const availableSources = getSectionOverlaySources(section);

    if (selectedSources.length === 0) {
      return [];
    }

    return [{
      sectionId: section.id,
      animation: section.overlayAnimation ?? "segments",
      availableSources,
      selectedSources,
    }];
  });
}

export function createReactiveForm(rootNode, {initialCapsuleId} = {}) {
  const titleNode = rootNode.querySelector("[data-kapsula-form-title]");
  const subtitleNode = rootNode.querySelector("[data-kapsula-form-subtitle]");
  const imageNode = rootNode.querySelector("[data-kapsula-form-image]");
  const overlayImageNode = rootNode.querySelector("[data-kapsula-form-overlay-images]");
  const formNode = rootNode.querySelector("[data-kapsula-form]");

  if (!titleNode || !subtitleNode || !imageNode || !formNode) {
    throw new Error("Kapsula form screen is missing required nodes");
  }

  const capsuleMap = buildCapsuleMap();
  const selectedCapsule$ = new BehaviorSubject(getInitialCapsuleId(capsuleMap, initialCapsuleId));
  const values$ = new BehaviorSubject({});
  const expandedState$ = new BehaviorSubject({});
  const activeSectionId$ = new BehaviorSubject(null);
  let previousExpandedState = {};
  let previousValues = {};
  let previousCapsuleId = null;

  const schema$ = selectedCapsule$.pipe(
    map((capsuleId) => getCapsule(capsuleMap, capsuleId)),
  );

  const validity$ = combineLatest([schema$, values$]).pipe(
    map(([capsule, values]) => validateSchema(capsule, values).success),
    distinctUntilChanged(),
  );

  combineLatest([schema$, values$, expandedState$, activeSectionId$]).subscribe(([capsule, values, expandedState, activeSectionId]) => {
    const capsuleId = selectedCapsule$.value;
    titleNode.textContent = capsule.title;
    subtitleNode.textContent = capsule.subtitle;
    imageNode.src = capsule.imageSrc;
    imageNode.alt = capsule.imageAlt;

    const nextValues = normalizeFormValues(capsule.sections, buildInitialValues(capsule.sections, values));
    const nextExpandedState = buildExpandedState(capsule.sections, expandedState);

    if (JSON.stringify(nextValues) !== JSON.stringify(values)) {
      values$.next(nextValues);
      return;
    }

    if (JSON.stringify(nextExpandedState) !== JSON.stringify(expandedState)) {
      expandedState$.next(nextExpandedState);
      return;
    }

    const hasActiveExpandedSection = activeSectionId && nextExpandedState[activeSectionId];
    const nextActiveSectionId = hasActiveExpandedSection
      ? activeSectionId
      : getExpandedSectionId(capsule, nextExpandedState);

    if (nextActiveSectionId !== activeSectionId) {
      activeSectionId$.next(nextActiveSectionId);
      return;
    }

    const forceFullRender = previousCapsuleId !== capsuleId;

    if (forceFullRender) {
      previousExpandedState = nextExpandedState;
      previousValues = nextValues;
    }

    renderForm(formNode, capsule, nextValues, nextExpandedState, {forceFull: forceFullRender});
    animateFormImageOverlay(overlayImageNode, {
      layers: getOverlayLayers(capsule, nextValues, nextExpandedState, nextActiveSectionId),
    });
    animateFormSections(formNode, nextExpandedState, previousExpandedState, nextValues, previousValues);
    previousExpandedState = nextExpandedState;
    previousValues = nextValues;
    previousCapsuleId = capsuleId;
  });

  validity$.subscribe((isValid) => {
    const submitButton = formNode.querySelector(".kapsula-form__trigger");

    if (submitButton) {
      submitButton.disabled = !isValid;
    }
  });

  fromEvent(formNode, "click").subscribe((event) => {
    const sectionTrigger = event.target.closest("[data-kapsula-section-trigger]");

    if (sectionTrigger) {
      const sectionId = sectionTrigger.dataset.sectionId;
      previousExpandedState = expandedState$.value;
      activeSectionId$.next(sectionId);
      expandedState$.next({
        ...expandedState$.value,
        [sectionId]: !expandedState$.value[sectionId],
      });
      return;
    }
  });

  fromEvent(formNode, "input").subscribe((event) => {
    const choiceInput = event.target.closest("[data-kapsula-choice]");

    if (choiceInput) {
      const sectionId = choiceInput.dataset.sectionId;
      const optionValue = choiceInput.value;
      const capsule = getCapsule(capsuleMap, selectedCapsule$.value);
      const section = capsule.sections.find((item) => item.id === sectionId);

      if (!section) return;

      values$.next({
        ...values$.value,
        [section.id]: toggleOptionValue(section, values$.value[section.id], optionValue),
      });
      return;
    }

    const textarea = event.target.closest("[data-kapsula-textarea]");

    if (!textarea) return;

    const sectionId = textarea.dataset.sectionId;

    values$.next({
      ...values$.value,
      [sectionId]: textarea.value,
    });
  });

  fromEvent(formNode, "submit").subscribe((event) => {
    event.preventDefault();
  });

  return {
    getSnapshot() {
      return getFormSnapshot(capsuleMap, selectedCapsule$.value, values$.value);
    },
    setCapsule(capsuleId) {
      if (!capsuleMap.has(capsuleId)) return false;

      activeSectionId$.next(null);
      selectedCapsule$.next(capsuleId);
      return true;
    },
  };
}

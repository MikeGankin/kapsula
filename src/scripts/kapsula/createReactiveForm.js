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

function getAvailableOverlayImages(capsule) {
  const overlayImages = [];

  capsule.sections.forEach((section) => {
    section.options?.forEach((option) => {
      if (option.overlayImageSrc && !overlayImages.includes(option.overlayImageSrc)) {
        overlayImages.push(option.overlayImageSrc);
      }
    });
  });

  return overlayImages;
}

function getSelectedOverlayImages(capsule, values) {
  const selectedImages = [];

  for (const section of capsule.sections) {
    const currentValue = values[section.id];
    const selectedValues = Array.isArray(currentValue)
      ? currentValue
      : [currentValue].filter(Boolean);

    selectedValues.forEach((selectedValue) => {
      const selectedOption = section.options?.find((option) => option.value === selectedValue);

      if (selectedOption?.overlayImageSrc) {
        selectedImages.push(selectedOption.overlayImageSrc);
      }
    });
  }

  return selectedImages;
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

  combineLatest([schema$, values$, expandedState$]).subscribe(([capsule, values, expandedState]) => {
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

    const forceFullRender = previousCapsuleId !== capsuleId;

    if (forceFullRender) {
      previousExpandedState = nextExpandedState;
      previousValues = nextValues;
    }

    renderForm(formNode, capsule, nextValues, nextExpandedState, {forceFull: forceFullRender});
    animateFormImageOverlay(overlayImageNode, {
      availableSources: getAvailableOverlayImages(capsule),
      selectedSources: getSelectedOverlayImages(capsule, nextValues),
    });
    animateFormSections(formNode, nextExpandedState, previousExpandedState, nextValues, previousValues);
    previousExpandedState = nextExpandedState;
    previousValues = nextValues;
    previousCapsuleId = capsuleId;
  });

  validity$.subscribe((isValid) => {
    const submitButton = formNode.querySelector(".kapsula-form__submit");

    if (submitButton) {
      submitButton.disabled = !isValid;
    }
  });

  fromEvent(formNode, "click").subscribe((event) => {
    const sectionTrigger = event.target.closest("[data-kapsula-section-trigger]");

    if (sectionTrigger) {
      const sectionId = sectionTrigger.dataset.sectionId;
      previousExpandedState = expandedState$.value;
      expandedState$.next({
        ...expandedState$.value,
        [sectionId]: !expandedState$.value[sectionId],
      });
      return;
    }

    const optionButton = event.target.closest("[data-kapsula-option]");

    if (!optionButton) return;

    const sectionId = optionButton.dataset.sectionId;
    const optionValue = optionButton.dataset.optionValue;
    const capsule = getCapsule(capsuleMap, selectedCapsule$.value);
    const section = capsule.sections.find((item) => item.id === sectionId);

    if (!section) return;

    values$.next({
      ...values$.value,
      [section.id]: toggleOptionValue(section, values$.value[section.id], optionValue),
    });
  });

  fromEvent(formNode, "input").subscribe((event) => {
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
    setCapsule(capsuleId) {
      if (!capsuleMap.has(capsuleId)) return false;

      selectedCapsule$.next(capsuleId);
      return true;
    },
  };
}

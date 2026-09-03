import {BehaviorSubject, distinctUntilChanged, map, Subscription} from "rxjs";
import {
  buildCapsuleMap,
  buildInitialValues,
  getCapsule,
  getInitialCapsuleId,
} from "./formSchema.js";
import {normalizeFormValuesUntilStable} from "./formValues.js";
import {
  createFormState as createCoreFormState,
} from "../../modules/form-configurator/core/state.ts";
import {validateSchema} from "./formValidation.js";
import {bindFormEvents} from "../../modules/form-configurator/runtime/bindFormEvents.ts";
import {bindFormPersistence} from "../../modules/form-configurator/runtime/bindFormPersistence.ts";
import {destroyRenderedForm, renderForm, renderFormValidationErrors} from "./renderForm.js";
import {animateFormSections} from "./animateFormSections.js";
import {animateFormImageOverlay, destroyFormImageOverlay} from "./animateFormImageOverlay.js";
import {getResponsiveImageSources, preloadResponsiveImage, syncResponsivePicture,} from "./formResponsiveImages.js";
import {readSavedActiveSection, readSavedFormValues, saveActiveSection, saveFormValues,} from "./sessionState.js";

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

function getFormSnapshot(capsuleMap, capsuleId, values) {
  const capsule = getCapsule(capsuleMap, capsuleId);
  const normalizedValues = normalizeFormValuesUntilStable(
    capsule.sections,
    buildInitialValues(capsule.sections, values),
  );

  return {
    capsuleId,
    capsule,
    values: normalizedValues,
  };
}

function getOverlayLayers(capsule, values, activeSectionId = null) {
  const layers = capsule.sections.flatMap((section) => {
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

  if (!activeSectionId) {
    return layers;
  }

  return [
    ...layers.filter((layer) => layer.sectionId !== activeSectionId),
    ...layers.filter((layer) => layer.sectionId === activeSectionId),
  ];
}

function createRuntimeFormState(capsuleMap, capsuleId, savedValues = null) {
  const capsule = getCapsule(capsuleMap, capsuleId);
  const savedActiveSectionId = readSavedActiveSection(capsuleId);
  return createCoreFormState(capsuleId, capsule, {
    savedValues: savedValues ?? {},
    savedActiveSectionId,
  });
}

function sameRenderState(previous, current) {
  return previous.capsuleId === current.capsuleId
    && previous.values === current.values
    && previous.expandedState === current.expandedState;
}

export function createReactiveForm(rootNode, {initialCapsuleId} = {}) {
  const titleNode = rootNode.querySelector("[data-kapsula-form-title]");
  const subtitleNode = rootNode.querySelector("[data-kapsula-form-subtitle]");
  const imageNode = rootNode.querySelector("[data-kapsula-form-image]");
  const overlayImageNode = rootNode.querySelector("[data-kapsula-form-overlay-images]");
  const formNode = rootNode.querySelector("[data-kapsula-form]");
  const submitButton = rootNode.querySelector(".kapsula-form__trigger");

  if (!titleNode || !subtitleNode || !imageNode || !formNode) {
    throw new Error("Kapsula form screen is missing required nodes");
  }

  const capsuleMap = buildCapsuleMap();
  const initialResolvedCapsuleId = getInitialCapsuleId(capsuleMap, initialCapsuleId);
  const initialSavedValues = readSavedFormValues(initialResolvedCapsuleId);
  const state$ = new BehaviorSubject(
    createRuntimeFormState(capsuleMap, initialResolvedCapsuleId, initialSavedValues),
  );
  const subscriptions = new Subscription();
  let previousExpandedState = {};
  let previousValues = {};
  let previousCapsuleId = null;
  let destroyed = false;

  const updateState = (updater) => {
    const currentState = state$.value;
    const nextState = updater(currentState);

    if (nextState !== currentState) {
      state$.next(nextState);
    }
  };

  subscriptions.add(state$.pipe(
    map((state) => ({
      capsuleId: state.capsuleId,
      capsule: getCapsule(capsuleMap, state.capsuleId),
    })),
    distinctUntilChanged((previous, current) => previous.capsuleId === current.capsuleId),
  ).subscribe(({capsule}) => {
    titleNode.textContent = capsule.title;
    subtitleNode.textContent = capsule.subtitle;
    if (submitButton) submitButton.textContent = capsule.submitLabel;
    syncResponsivePicture(imageNode, {
      ...getResponsiveImageSources(capsule.imageSrc, capsule.imageMobileSrc),
      alt: capsule.imageAlt,
    });
  }));

  subscriptions.add(state$.pipe(
    map((state) => ({
      capsuleId: state.capsuleId,
      capsule: getCapsule(capsuleMap, state.capsuleId),
      values: state.values,
      expandedState: state.expandedState,
    })),
    distinctUntilChanged(sameRenderState),
  ).subscribe(({capsuleId, capsule, values, expandedState}) => {
    const forceFullRender = previousCapsuleId !== capsuleId;
    renderForm(
      formNode,
      capsule,
      values,
      expandedState,
      {
        forceFull: forceFullRender,
        updateState,
      }
    );
    animateFormSections(
      formNode,
      expandedState,
      previousExpandedState,
      values,
      previousValues,
    );
    previousExpandedState = expandedState;
    previousValues = values;
    previousCapsuleId = capsuleId;
  }));

  subscriptions.add(state$.pipe(
    map((state) => ({
      capsule: getCapsule(capsuleMap, state.capsuleId),
      values: state.values,
      activeSectionId: state.activeSectionId,
    })),
    distinctUntilChanged((previous, current) => (
      previous.capsule === current.capsule
      && previous.values === current.values
      && previous.activeSectionId === current.activeSectionId
    )),
  ).subscribe(({capsule, values, activeSectionId}) => {
    animateFormImageOverlay(overlayImageNode, {
      layers: getOverlayLayers(capsule, values, activeSectionId),
    });
  }));

  subscriptions.add(bindFormPersistence(state$, {
    getSnapshot: () => state$.value,
    getCapsule: (state) => getCapsule(capsuleMap, state.capsuleId),
    saveFormValues,
  }));
  subscriptions.add(bindFormEvents(formNode, {
    getCapsule: (state) => getCapsule(capsuleMap, state.capsuleId),
    updateState,
    saveActiveSection,
  }));

  return {
    getSnapshot() {
      const {capsuleId, values} = state$.value;

      const snapshot = getFormSnapshot(
        capsuleMap,
        capsuleId,
        values,
      );

      return snapshot;
    },
    validate() {
      const {capsuleId, values} = state$.value;

      const snapshot = getFormSnapshot(capsuleMap, capsuleId, values);

      return validateSchema(snapshot.capsule, snapshot.values);
    },
    showValidationErrors(validationResult) {
      const capsule = getCapsule(capsuleMap, state$.value.capsuleId);
      const issues = validationResult?.success
        ? []
        : validationResult?.error?.issues ?? [];

      renderFormValidationErrors(formNode, capsule, issues);
    },
    setCapsule(capsuleId) {
      if (!capsuleMap.has(capsuleId)) return false;

      if (state$.value.capsuleId === capsuleId) {
        return true;
      }

      const savedValues = readSavedFormValues(capsuleId);
      previousExpandedState = {};
      previousValues = {};
      state$.next(createRuntimeFormState(capsuleMap, capsuleId, savedValues));
      return true;
    },
    prepareCapsule(capsuleId) {
      if (!capsuleMap.has(capsuleId)) {
        return Promise.resolve(false);
      }

      const capsule = getCapsule(capsuleMap, capsuleId);

      return preloadResponsiveImage(
        getResponsiveImageSources(capsule.imageSrc, capsule.imageMobileSrc),
      ).then(() => true);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      subscriptions.unsubscribe();
      destroyRenderedForm(formNode);
      state$.complete();
      destroyFormImageOverlay(overlayImageNode);
    },
  };
}

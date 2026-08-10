import {BehaviorSubject, debounceTime, distinctUntilChanged, fromEvent, map, Subscription} from "rxjs";
import {
  buildCapsuleMap,
  buildExpandedState,
  buildInitialValues,
  getCapsule,
  getInitialCapsuleId,
} from "./formSchema.js";
import {normalizeFormValuesUntilStable, toggleOptionValue} from "./formValues.js";
import {validateSchema} from "./formValidation.js";
import {renderForm, renderFormValidationErrors} from "./renderForm.js";
import {animateFormSections} from "./animateFormSections.js";
import {animateFormImageOverlay, destroyFormImageOverlay} from "./animateFormImageOverlay.js";
import {
  getResponsiveImageSources,
  preloadResponsiveImage,
  syncResponsivePicture,
} from "./formResponsiveImages.js";
import {
  readSavedActiveSection,
  readSavedFormValues,
  saveActiveSection,
  saveFormValues,
} from "./sessionState.js";

function getPersistedOptionValues(capsule, values = {}) {
  return capsule.sections.reduce((accumulator, section) => {
    if (section.type === "textarea") {
      return accumulator;
    }

    accumulator[section.id] = values[section.id] ?? (section.multiple ? [] : "");
    return accumulator;
  }, {});
}

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
  const expandedSection = capsule.sections.find((section) => expandedState[section.id]);

  return expandedSection?.id ?? capsule.sections[0]?.id ?? null;
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

function createFormState(capsuleMap, capsuleId, savedValues = null) {
  const capsule = getCapsule(capsuleMap, capsuleId);
  const values = normalizeFormValuesUntilStable(
    capsule.sections,
    buildInitialValues(capsule.sections, savedValues ?? {}),
  );
  const savedActiveSectionId = readSavedActiveSection(capsuleId);
  const hasSavedActiveSection = capsule.sections.some(
    (section) => section.id === savedActiveSectionId,
  );
  const savedExpandedState = hasSavedActiveSection
    ? Object.fromEntries(
      capsule.sections.map((section) => [section.id, section.id === savedActiveSectionId]),
    )
    : {};
  const expandedState = buildExpandedState(capsule.sections, savedExpandedState);

  return {
    capsuleId,
    values,
    expandedState,
    activeSectionId: getExpandedSectionId(capsule, expandedState),
    touchedSections: {},
  };
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
    createFormState(capsuleMap, initialResolvedCapsuleId, initialSavedValues),
  );
  const subscriptions = new Subscription();
  let previousExpandedState = {};
  let previousValues = {};
  let previousCapsuleId = null;

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
    renderForm(formNode, capsule, values, expandedState, {forceFull: forceFullRender});
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

  const persistFormValues = () => {
    const {capsuleId, values} = state$.value;
    const capsule = getCapsule(capsuleMap, capsuleId);

    saveFormValues(capsuleId, getPersistedOptionValues(capsule, values));
  };

  subscriptions.add(state$.pipe(
    map((state) => ({capsuleId: state.capsuleId, values: state.values})),
    distinctUntilChanged((previous, current) => (
      previous.capsuleId === current.capsuleId && previous.values === current.values
    )),
    debounceTime(150),
  ).subscribe(persistFormValues));

  // Debounce в 150 мс теряет последние правки, если пользователь уходит
  // со страницы сразу после изменения. Дописываем актуальное состояние
  // синхронно: pagehide покрывает закрытие и переход, visibilitychange —
  // сворачивание вкладки на мобильных, где pagehide может не сработать.
  const handlePageHide = () => {
    persistFormValues();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      persistFormValues();
    }
  };

  window.addEventListener("pagehide", handlePageHide);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  subscriptions.add(() => {
    window.removeEventListener("pagehide", handlePageHide);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  subscriptions.add(fromEvent(formNode, "click").subscribe((event) => {
    if (!(event.target instanceof Element)) return;
    const sectionTrigger = event.target.closest("[data-kapsula-section-trigger]");

    if (sectionTrigger) {
      const {sectionId} = sectionTrigger.dataset;
      updateState((state) => {
        if (!sectionId || !(sectionId in state.expandedState)) {
          return state;
        }

        const isOpening = !state.expandedState[sectionId];
        const expandedState = Object.fromEntries(
          Object.keys(state.expandedState)
            .map((id) => [id, isOpening && id === sectionId]),
        );

        saveActiveSection(state.capsuleId, sectionId);

        return {
          ...state,
          activeSectionId: sectionId,
          expandedState,
        };
      });
      
    }
  }));

  subscriptions.add(fromEvent(formNode, "change").subscribe((event) => {
    if (!(event.target instanceof Element)) return;
    const choiceInput = event.target.closest("[data-kapsula-choice]");

    if (choiceInput) {
      const {sectionId} = choiceInput.dataset;
      const optionValue = choiceInput.value;
      updateState((state) => {
        const capsule = getCapsule(capsuleMap, state.capsuleId);
        const section = capsule.sections.find((item) => item.id === sectionId);

        if (!section) return state;

        const values = normalizeFormValuesUntilStable(capsule.sections, {
          ...state.values,
          [section.id]: toggleOptionValue(section, state.values[section.id], optionValue),
        });

        return {
          ...state,
          activeSectionId: sectionId,
          values,
          touchedSections: {...state.touchedSections, [section.id]: true},
        };
      });
    }
  }));

  subscriptions.add(fromEvent(formNode, "input").subscribe((event) => {
    if (!(event.target instanceof Element)) return;
    const textarea = event.target.closest("[data-kapsula-textarea]");

    if (!textarea) return;

    const {sectionId} = textarea.dataset;
    updateState((state) => ({
      ...state,
      values: {...state.values, [sectionId]: textarea.value},
      touchedSections: {...state.touchedSections, [sectionId]: true},
    }));
  }));

  subscriptions.add(fromEvent(formNode, "submit").subscribe((event) => {
    event.preventDefault();
  }));

  return {
    getSnapshot() {
      const {capsuleId, values} = state$.value;
      return getFormSnapshot(capsuleMap, capsuleId, values);
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
      state$.next(createFormState(capsuleMap, capsuleId, savedValues));
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
      subscriptions.unsubscribe();
      state$.complete();
      destroyFormImageOverlay(overlayImageNode);
    },
  };
}

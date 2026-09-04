import {BehaviorSubject, distinctUntilChanged, map, Subscription} from "rxjs";
import {createFormState} from "../../../../modules/form-configurator/core/state.ts";
import type {CapsuleConfig, ExpandedState, FormConfig, FormState, FormValues, ValidationIssue} from "../../../../modules/form-configurator/core/types.ts";
import {buildInitialValues, normalizeFormValuesUntilStable} from "../../../../modules/form-configurator/core/values.ts";
import {validateFormValues} from "../../../../modules/form-configurator/core/validation.ts";
import type {FormExperience, FormSnapshot} from "../../../../modules/form-configurator/runtime/types.ts";
import {bindFormEvents} from "../../../../modules/form-configurator/runtime/bindFormEvents.ts";
import {bindFormPersistence} from "../../../../modules/form-configurator/runtime/bindFormPersistence.ts";
import {animateFormSections} from "./effects/animateFormSections.js";
import {animateFormImageOverlay, destroyFormImageOverlay} from "./effects/animateFormImageOverlay.js";
import {getResponsiveImageSources, preloadResponsiveImage, syncResponsivePicture} from "./effects/formResponsiveImages.js";
import kapsulaFormConfig from "./kapsulaFormConfig.ts";
import {destroyRenderedForm, renderForm, renderFormValidationErrors} from "./renderForm.ts";
import {readSavedActiveSection, readSavedFormValues, saveActiveSection, saveFormValues} from "../../shared/sessionState.js";

export interface FormSessionAdapter {
  readValues(capsuleId: string): FormValues | null;
  saveValues(capsuleId: string, values: Readonly<FormValues>): void;
  readActiveSection(capsuleId: string): string | null;
  saveActiveSection(capsuleId: string, sectionId: string): void;
}

export interface FormShellNodes {
  titleNode: HTMLElement;
  subtitleNode: HTMLElement;
  imageNode: HTMLImageElement;
  submitButton: HTMLElement | null;
}

export interface FormRendererAdapter {
  render(formNode: HTMLFormElement, capsule: CapsuleConfig, values: FormValues,
    expanded: ExpandedState, options: {forceFull: boolean; updateState: UpdateState}): void;
  showValidationErrors(formNode: HTMLFormElement, capsule: CapsuleConfig,
    issues: ValidationIssue[]): void;
  destroy(formNode: HTMLFormElement): void;
}

type UpdateState = (updater: (state: FormState) => FormState) => void;

export interface FormEffectsAdapter {
  syncCapsuleShell(nodes: FormShellNodes, capsule: CapsuleConfig): void;
  animateSections(formNode: HTMLElement, current: ExpandedState, previous: ExpandedState,
    values: FormValues, previousValues: FormValues): void;
  syncOverlay(overlayNode: HTMLElement | null, capsule: CapsuleConfig, values: FormValues,
    activeSectionId: string | null): void;
  prepareCapsule(capsule: CapsuleConfig): Promise<void>;
  destroy(overlayNode: HTMLElement | null): void;
}

export interface ConfiguredFormDependencies {
  config: FormConfig;
  storage: FormSessionAdapter;
  renderer: FormRendererAdapter;
  effects: FormEffectsAdapter;
}

export interface CreateKapsulaFormOptions {initialCapsuleId?: string | null}

type ElementConstructor<T extends Element> = {new(...args: never[]): T};

function requireElement<T extends Element>(rootNode: ParentNode, selector: string,
  constructor: ElementConstructor<T>): T {
  const node = rootNode.querySelector(selector);
  if (!(node instanceof constructor)) {
    throw new Error(`Kapsula form screen is missing required nodes: expected ${constructor.name}`
      + ` at "${selector}"`);
  }
  return node;
}

function optionalElement<T extends Element>(rootNode: ParentNode, selector: string,
  constructor: ElementConstructor<T>): T | null {
  const node = rootNode.querySelector(selector);
  return node instanceof constructor ? node : null;
}

function buildCapsuleMap(config: FormConfig): Map<string, CapsuleConfig> {
  return new Map(Object.entries(config.capsules).map(([id, capsule]) => [id, {
    ...capsule,
    sections: capsule.sections.filter((section) => section.render === true),
  }]));
}

function getCapsule(capsules: Map<string, CapsuleConfig>, id: string): CapsuleConfig {
  const capsule = capsules.get(id);
  if (!capsule) throw new Error(`Missing form schema for capsule "${id}"`);
  return capsule;
}

function initialId(capsules: Map<string, CapsuleConfig>, config: FormConfig,
  requested?: string | null) {
  if (requested && capsules.has(requested)) return requested;
  const id = config.defaultCapsule ?? capsules.keys().next().value;
  if (!id) throw new Error("Kapsula form config has no capsules");
  return id;
}

function overlayLayers(capsule: CapsuleConfig, values: FormValues, activeId: string | null) {
  const layers = capsule.sections.flatMap((section) => {
    if (section.type !== "cards") return [];
    const value = values[section.id];
    const selected = Array.isArray(value) ? value : [value].filter(Boolean);
    const selectedSources = Array.from(new Set(selected.flatMap((item) => {
      const option = section.options.find((candidate) => candidate.value === item);
      return option?.overlayImageSrc ? [option.overlayImageSrc] : [];
    })));
    if (selectedSources.length === 0) return [];
    return [{
      sectionId: section.id,
      animation: section.overlayAnimation ?? "segments",
      availableSources: Array.from(new Set(section.options
        .flatMap((option) => option.overlayImageSrc ? [option.overlayImageSrc] : []))),
      selectedSources,
    }];
  });
  if (!activeId) return layers;
  return [...layers.filter((layer) => layer.sectionId !== activeId),
    ...layers.filter((layer) => layer.sectionId === activeId)];
}

export function createConfiguredForm(rootNode: ParentNode, dependencies: ConfiguredFormDependencies,
  {initialCapsuleId}: CreateKapsulaFormOptions = {}): FormExperience {
  const titleNode = requireElement(rootNode, "[data-kapsula-form-title]", HTMLElement);
  const subtitleNode = requireElement(rootNode, "[data-kapsula-form-subtitle]", HTMLElement);
  const imageNode = requireElement(rootNode, "[data-kapsula-form-image]", HTMLImageElement);
  const formNode = requireElement(rootNode, "[data-kapsula-form]", HTMLFormElement);
  const overlayNode = optionalElement(rootNode, "[data-kapsula-form-overlay-images]", HTMLElement);
  const submitButton = optionalElement(rootNode, ".kapsula-form__trigger", HTMLElement);
  const mapById = buildCapsuleMap(dependencies.config);
  const firstId = initialId(mapById, dependencies.config, initialCapsuleId);
  const makeState = (id: string) => createFormState(id, getCapsule(mapById, id), {
    savedValues: dependencies.storage.readValues(id) ?? {},
    savedActiveSectionId: dependencies.storage.readActiveSection(id),
  });
  const state$ = new BehaviorSubject(makeState(firstId));
  const subscriptions = new Subscription();
  let previousExpanded: ExpandedState = {};
  let previousValues: FormValues = {};
  let previousCapsuleId: string | null = null;
  let destroyed = false;
  const updateState: UpdateState = (updater) => {
    const current = state$.value;
    const next = updater(current);
    if (next !== current) state$.next(next);
  };

  subscriptions.add(state$.pipe(map((state) => ({
    capsuleId: state.capsuleId, capsule: getCapsule(mapById, state.capsuleId),
  })), distinctUntilChanged((a, b) => a.capsuleId === b.capsuleId))
    .subscribe(({capsule}) => dependencies.effects.syncCapsuleShell({
      titleNode, subtitleNode, imageNode, submitButton,
    }, capsule)));

  subscriptions.add(state$.pipe(map((state) => ({
    ...state, capsule: getCapsule(mapById, state.capsuleId),
  })), distinctUntilChanged((a, b) => a.capsuleId === b.capsuleId && a.values === b.values
    && a.expandedState === b.expandedState))
    .subscribe(({capsuleId, capsule, values, expandedState}) => {
    dependencies.renderer.render(formNode, capsule, values, expandedState, {
      forceFull: previousCapsuleId !== capsuleId, updateState,
    });
    dependencies.effects.animateSections(formNode, expandedState, previousExpanded,
      values, previousValues);
    previousExpanded = expandedState;
    previousValues = values;
    previousCapsuleId = capsuleId;
    }));

  subscriptions.add(state$.pipe(map((state) => ({
    capsule: getCapsule(mapById, state.capsuleId), values: state.values,
    activeSectionId: state.activeSectionId,
  })), distinctUntilChanged((a, b) => a.capsule === b.capsule && a.values === b.values
    && a.activeSectionId === b.activeSectionId)).subscribe(({capsule, values, activeSectionId}) => {
    dependencies.effects.syncOverlay(overlayNode, capsule, values, activeSectionId);
  }));

  subscriptions.add(bindFormPersistence(state$, {
    getSnapshot: () => state$.value,
    getCapsule: (state) => getCapsule(mapById, state.capsuleId),
    saveFormValues: dependencies.storage.saveValues,
  }));
  subscriptions.add(bindFormEvents(formNode, {
    getCapsule: (state) => getCapsule(mapById, state.capsuleId), updateState,
    saveActiveSection: dependencies.storage.saveActiveSection,
  }));

  const snapshot = (): FormSnapshot => {
    const {capsuleId, values} = state$.value;
    const capsule = getCapsule(mapById, capsuleId);
    return {capsuleId, capsule, values: normalizeFormValuesUntilStable(capsule.sections,
      buildInitialValues(capsule.sections, values))};
  };
  return {
    getSnapshot: snapshot,
    validate() {
      const current = snapshot();
      return validateFormValues(current.capsule, current.values);
    },
    showValidationErrors(result) {
      dependencies.renderer.showValidationErrors(formNode,
        getCapsule(mapById, state$.value.capsuleId), result.success ? [] : result.error.issues);
    },
    setCapsule(id) {
      if (!mapById.has(id)) return false;
      if (state$.value.capsuleId === id) return true;
      previousExpanded = {};
      previousValues = {};
      state$.next(makeState(id));
      return true;
    },
    prepareCapsule(id) {
      if (!mapById.has(id)) return Promise.resolve(false);
      return dependencies.effects.prepareCapsule(getCapsule(mapById, id)).then(() => true);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      subscriptions.unsubscribe();
      dependencies.renderer.destroy(formNode);
      state$.complete();
      dependencies.effects.destroy(overlayNode);
    },
  };
}

export const kapsulaFormSessionAdapter: FormSessionAdapter = {
  readValues: readSavedFormValues, saveValues: saveFormValues,
  readActiveSection: readSavedActiveSection, saveActiveSection,
};

export const kapsulaFormRenderer: FormRendererAdapter = {
  render: renderForm, showValidationErrors: renderFormValidationErrors, destroy: destroyRenderedForm,
};

export const kapsulaFormEffects: FormEffectsAdapter = {
  syncCapsuleShell(nodes, capsule) {
    nodes.titleNode.textContent = capsule.title;
    nodes.subtitleNode.textContent = capsule.subtitle;
    if (nodes.submitButton) nodes.submitButton.textContent = capsule.submitLabel;
    const sources = getResponsiveImageSources(capsule.imageSrc, capsule.imageMobileSrc);
    syncResponsivePicture(nodes.imageNode, {
      ...sources, alt: capsule.imageAlt,
    });
  },
  animateSections(formNode, current, previous, values, previousValues) {
    animateFormSections(formNode, current, previous, values, previousValues);
  },
  syncOverlay(node, capsule, values, activeId) {
    animateFormImageOverlay(node, {layers: overlayLayers(capsule, values, activeId)});
  },
  prepareCapsule(capsule) {
    const sources = getResponsiveImageSources(capsule.imageSrc, capsule.imageMobileSrc);
    return preloadResponsiveImage(sources);
  },
  destroy(node) {
    destroyFormImageOverlay(node);
  },
};

export function createKapsulaForm(rootNode: ParentNode,
  options: CreateKapsulaFormOptions = {}): FormExperience {
  return createConfiguredForm(rootNode, {
    config: kapsulaFormConfig, storage: kapsulaFormSessionAdapter,
    renderer: kapsulaFormRenderer, effects: kapsulaFormEffects,
  }, options);
}

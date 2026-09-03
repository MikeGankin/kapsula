import {buildExpandedState, buildInitialValues, normalizeFormValuesUntilStable, toggleOptionValue}
  from "./values.ts";
import type {
  CapsuleConfig,
  CreateFormStateOptions,
  FieldValue,
  FormState,
} from "./types.ts";

function getExpandedSectionId(capsule: CapsuleConfig, expandedState: FormState["expandedState"]) {
  return capsule.sections.find((section) => expandedState[section.id])?.id
    ?? capsule.sections[0]?.id
    ?? null;
}

export function createFormState(
  capsuleId: string,
  capsule: CapsuleConfig,
  {savedValues = {}, savedActiveSectionId = null}: CreateFormStateOptions = {},
): FormState {
  const values = normalizeFormValuesUntilStable(
    capsule.sections,
    buildInitialValues(capsule.sections, savedValues),
  );
  const hasSavedActiveSection = capsule.sections.some(({id}) => id === savedActiveSectionId);
  const savedExpandedState = hasSavedActiveSection
    ? Object.fromEntries(capsule.sections.map(({id}) => [id, id === savedActiveSectionId]))
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

export function toggleSection(state: FormState, sectionId: string): FormState {
  if (!(sectionId in state.expandedState)) return state;
  const isOpening = !state.expandedState[sectionId];
  const expandedState = Object.fromEntries(
    Object.keys(state.expandedState).map((id) => [id, isOpening && id === sectionId]),
  );
  return {...state, activeSectionId: sectionId, expandedState};
}

export function selectOption(
  state: FormState,
  capsule: CapsuleConfig,
  sectionId: string,
  optionValue: string,
): FormState {
  const section = capsule.sections.find(({id}) => id === sectionId);
  if (!section || section.type !== "cards") return state;
  const values = normalizeFormValuesUntilStable(capsule.sections, {
    ...state.values,
    [section.id]: toggleOptionValue(section, state.values[section.id], optionValue),
  });
  return {
    ...state,
    activeSectionId: sectionId,
    values,
    touchedSections: {...state.touchedSections, [sectionId]: true},
  };
}

export function setFieldValue(
  state: FormState,
  sectionId: string,
  value: FieldValue,
): FormState {
  if (!(sectionId in state.values)) return state;
  return {
    ...state,
    values: {...state.values, [sectionId]: value},
    touchedSections: {...state.touchedSections, [sectionId]: true},
  };
}

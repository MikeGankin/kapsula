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

export function createReactiveForm(rootNode, {initialCapsuleId} = {}) {
  const titleNode = rootNode.querySelector("[data-kapsula-form-title]");
  const subtitleNode = rootNode.querySelector("[data-kapsula-form-subtitle]");
  const imageNode = rootNode.querySelector("[data-kapsula-form-image]");
  const formNode = rootNode.querySelector("[data-kapsula-form]");

  if (!titleNode || !subtitleNode || !imageNode || !formNode) {
    throw new Error("Kapsula form screen is missing required nodes");
  }

  const capsuleMap = buildCapsuleMap();
  const selectedCapsule$ = new BehaviorSubject(getInitialCapsuleId(capsuleMap, initialCapsuleId));
  const values$ = new BehaviorSubject({});
  const expandedState$ = new BehaviorSubject({});
  let previousExpandedState = {};

  const schema$ = selectedCapsule$.pipe(
    map((capsuleId) => getCapsule(capsuleMap, capsuleId)),
  );

  const validity$ = combineLatest([schema$, values$]).pipe(
    map(([capsule, values]) => validateSchema(capsule, values).success),
    distinctUntilChanged(),
  );

  combineLatest([schema$, values$, expandedState$]).subscribe(([capsule, values, expandedState]) => {
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

    renderForm(formNode, capsule, nextValues, nextExpandedState);
    animateFormSections(formNode, nextExpandedState, previousExpandedState);
    previousExpandedState = nextExpandedState;
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

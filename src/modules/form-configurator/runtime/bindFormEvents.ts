import type {CapsuleConfig, FormState} from "../core/types.ts";
import {selectOption, setFieldValue, toggleSection} from "../core/state.ts";
import type {UpdateFormState} from "../dom/renderer.ts";

interface BindFormEventsOptions {
  getCapsule(state: FormState): CapsuleConfig;
  updateState: UpdateFormState;
  saveActiveSection(capsuleId: string, sectionId: string): void;
}

export function bindFormEvents(formNode: HTMLElement, options: BindFormEventsOptions): () => void {
  const onClick = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest<HTMLElement>("[data-kapsula-section-trigger]");
    const sectionId = trigger?.dataset.sectionId;
    if (!sectionId) return;
    options.updateState((state) => {
      const next = toggleSection(state, sectionId);
      if (next !== state) options.saveActiveSection(state.capsuleId, sectionId);
      return next;
    });
  };
  const onChange = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const input = event.target.closest<HTMLInputElement>("[data-kapsula-choice]");
    if (!input) return;
    options.updateState((state) => {
      const {sectionId} = input.dataset;
      if (!sectionId) return state;
      return selectOption(state, options.getCapsule(state), sectionId, input.value);
    });
  };
  const onInput = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const input = event.target.closest<HTMLInputElement | HTMLTextAreaElement>(
      "[data-kapsula-textarea], [data-field]",
    );
    if (!input) return;
    options.updateState((state) => {
      const capsule = options.getCapsule(state);
      const textareaId = input.dataset.sectionId;
      const textId = input.dataset.field;
      const fieldId = textareaId ?? textId;
      const field = capsule.sections.find((candidate) => candidate.id === fieldId);
      if (!field || (field.type !== "textarea" && field.type !== "text")) return state;
      return setFieldValue(state, field.id, input.value);
    });
  };
  const onSubmit = (event: Event) => event.preventDefault();
  formNode.addEventListener("click", onClick);
  formNode.addEventListener("change", onChange);
  formNode.addEventListener("input", onInput);
  formNode.addEventListener("submit", onSubmit);
  let bound = true;
  return () => {
    if (!bound) return;
    bound = false;
    formNode.removeEventListener("click", onClick);
    formNode.removeEventListener("change", onChange);
    formNode.removeEventListener("input", onInput);
    formNode.removeEventListener("submit", onSubmit);
  };
}

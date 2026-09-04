import {createFormRendererController} from "../../../../modules/form-configurator/dom/formRenderer.ts";
import type {
  CapsuleConfig,
  ExpandedState,
  FormValues,
  ValidationIssue,
} from "../../../../modules/form-configurator/core/types.ts";
import type {UpdateFormState} from "../../../../modules/form-configurator/dom/renderer.ts";
import {createKapsulaFieldRendererRegistry} from "./kapsulaFieldRenderers.ts";

type RenderOptions = {forceFull?: boolean; updateState?: UpdateFormState};
type RendererController = ReturnType<typeof createFormRendererController>;

const controllers = new WeakMap<HTMLFormElement, RendererController>();

function getController(formNode: HTMLFormElement): RendererController {
  let controller = controllers.get(formNode);
  if (!controller) {
    controller = createFormRendererController(formNode, createKapsulaFieldRendererRegistry());
    controllers.set(formNode, controller);
  }
  return controller;
}

export function renderForm(
  formNode: HTMLFormElement,
  schema: CapsuleConfig,
  values: FormValues,
  expandedState: ExpandedState,
  options: RenderOptions = {},
): void {
  getController(formNode).render(schema, values, expandedState, options);
}

export function renderFormValidationErrors(
  formNode: HTMLFormElement,
  schema: CapsuleConfig,
  issues: ValidationIssue[] = [],
): void {
  getController(formNode).renderValidationErrors(schema, issues);
}

export function destroyRenderedForm(formNode: HTMLFormElement): void {
  const controller = controllers.get(formNode);
  if (!controller) return;
  controller.destroy();
  controllers.delete(formNode);
}

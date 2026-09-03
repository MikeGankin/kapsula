import {createFormRendererController} from "../../modules/form-configurator/dom/formRenderer.ts";
import {createKapsulaFieldRendererRegistry} from "./kapsulaFieldRenderers.ts";

const controllers = new WeakMap();

function getController(formNode) {
  let controller = controllers.get(formNode);
  if (!controller) {
    controller = createFormRendererController(formNode, createKapsulaFieldRendererRegistry());
    controllers.set(formNode, controller);
  }
  return controller;
}

export function renderForm(formNode, schema, values, expandedState, options = {}) {
  getController(formNode).render(schema, values, expandedState, options);
}

export function renderFormValidationErrors(formNode, schema, issues = []) {
  getController(formNode).renderValidationErrors(schema, issues);
}

export function destroyRenderedForm(formNode) {
  const controller = controllers.get(formNode);
  if (!controller) return;
  controller.destroy();
  controllers.delete(formNode);
}

import {createFieldRendererRegistry} from "../../../src/modules/form-configurator/dom/rendererRegistry.ts";
import type {FieldRenderer} from "../../../src/modules/form-configurator/dom/renderer.ts";

const renderer = (type: "text"): FieldRenderer => ({
  type,
  render: () => ({node: document.createElement("input"), sync() {}, destroy() {}}),
});

describe("field renderer registry", () => {
  it("resolves a registered renderer and rejects duplicate/unknown types", () => {
    const text = renderer("text");
    const registry = createFieldRendererRegistry([text]);
    expect(registry.get("text")).toBe(text);
    expect(() => registry.register(text)).toThrow('Field renderer "text" is already registered');
    expect(() => registry.get("calendar")).toThrow("Unknown field renderer: calendar");
  });
});

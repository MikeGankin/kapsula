import * as z from "zod/mini";

import {parseFormConfig} from "../../../src/modules/form-configurator/core/config.ts";
import {
  createFieldTypeRegistry,
  getFieldTypeDefinition,
  summarizeFieldValue,
} from "../../../src/modules/form-configurator/core/fieldTypes.ts";
import type {FieldTypeDefinition} from "../../../src/modules/form-configurator/core/fieldTypes.ts";
import type {
  BaseFieldConfig,
  FieldConfig,
} from "../../../src/modules/form-configurator/core/types.ts";

const fields: FieldConfig[] = [
  {id: "cards", type: "cards", title: "Cards", render: true, options: []},
  {id: "textarea", type: "textarea", title: "Textarea", render: true},
  {id: "text", type: "text", title: "Text", render: true},
  {id: "calendar", type: "calendar", title: "Calendar", render: true},
];

describe("field type registry", () => {
  it("resolves all production field type definitions", () => {
    expect(fields.map((field) => getFieldTypeDefinition(field).type))
      .toEqual(["cards", "textarea", "text", "calendar"]);
  });

  it("rejects duplicate and unknown field types explicitly", () => {
    const registry = createFieldTypeRegistry();
    const definition = getFieldTypeDefinition(fields[2]!);
    registry.register(definition);
    expect(() => registry.register(definition))
      .toThrow('Field type "text" is already registered');
    expect(() => registry.get("unknown")).toThrow("Unknown field type: unknown");
  });

  it("supports a custom definition only in an isolated registry", () => {
    interface RatingField extends BaseFieldConfig {
      type: "rating";
    }
    const definition: FieldTypeDefinition<RatingField> = {
      type: "rating",
      getInitialValue: (_field, saved) => saved ?? "1",
      normalizeValue: (_field, value) => typeof value === "string" ? value : "1",
      createValidationSchema: () => z.string(),
      serializeValue: (_field, value) => value,
      summarizeValue: (_field, value) => `Rating: ${value ?? ""}`,
    };
    const registry = createFieldTypeRegistry();
    registry.register(definition);
    const field: RatingField = {id: "score", type: "rating", title: "Score", render: true};
    const custom = registry.get("rating");

    expect(custom.getInitialValue(field, undefined)).toBe("1");
    expect(custom.normalizeValue(field, ["invalid"], {values: {}})).toBe("1");
    expect(custom.createValidationSchema(field).safeParse("5").success).toBe(true);
    expect(custom.serializeValue(field, "5")).toBe("5");
    expect(custom.summarizeValue(field, "5", {values: {}})).toBe("Rating: 5");
    expect(() => parseFormConfig({capsules: {sample: {
      title: "Form", subtitle: "", imageSrc: "", imageMobileSrc: "", imageAlt: "",
      submitLabel: "Submit", sections: [field],
    }}})).toThrow();
  });
});

describe("built-in field type behavior", () => {
  it("keeps cards labels, fallback values, and visibility in summaries", () => {
    const field: FieldConfig = {
      id: "style", type: "cards", title: "Style", render: true, multiple: true,
      options: [
        {value: "calm", label: "Calm"},
        {value: "hidden", label: "Hidden", hiddenWhen: {trigger: {includes: ["yes"]}}},
      ],
    };
    expect(summarizeFieldValue(field, ["calm", "removed"], {trigger: "yes"})).toBe("Calm");
    expect(summarizeFieldValue(field, ["removed"], {trigger: "yes"})).toBe("removed");
  });

  it("keeps textarea, text, and legacy calendar summaries", () => {
    expect(summarizeFieldValue(fields[1]!, "private", {})).toBe("");
    expect(summarizeFieldValue(fields[2]!, "query", {})).toBe("query");
    expect(summarizeFieldValue(fields[3]!, {from: "2026-09-03", to: "2026-09-03"}, {}))
      .toBe("2026-09-03");
    expect(summarizeFieldValue(fields[3]!, {from: "2026-09-03", to: "2026-09-10"}, {}))
      .toBe("03.09.2026 — 10.09.2026");
  });
});

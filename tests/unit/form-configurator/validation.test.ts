import {validateFormValues} from "../../../src/modules/form-configurator/core/validation.ts";
import type {CapsuleConfig, FieldConfig} from "../../../src/modules/form-configurator/core/types.ts";

const capsule = (sections: FieldConfig[]): CapsuleConfig => ({
  title: "Form", subtitle: "Subtitle", imageSrc: "image.jpg", imageMobileSrc: "mobile.jpg",
  imageAlt: "Image", submitLabel: "Submit", sections,
});
const field = (overrides: Partial<FieldConfig> = {}): FieldConfig => ({
  id: "name", type: "text", title: "Name", render: true, ...overrides,
} as FieldConfig);

describe("form-configurator validation", () => {
  it("validates required and optional strings with issue paths", () => {
    const schema = capsule([field({required: true})]);
    const invalid = validateFormValues(schema, {name: "   "});
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(invalid.error.issues[0]?.path[0]).toBe("name");
    expect(validateFormValues(schema, {name: "Ann"}).success).toBe(true);
    expect(validateFormValues(capsule([field()]), {name: ""}).success).toBe(true);
  });

  it("validates multiple cards and calendar ranges", () => {
    const schema = capsule([
      field({
        id: "extras", type: "cards", required: true, multiple: true,
        options: [{value: "spa", label: "Spa"}],
      }),
      field({id: "dates", type: "calendar", required: true}),
    ]);
    expect(validateFormValues(schema, {extras: [], dates: {from: "", to: ""}}).success)
      .toBe(false);
    expect(validateFormValues(schema, {
      extras: ["spa"], dates: {from: "2026-09-01", to: "2026-09-07"},
    }).success).toBe(true);
  });

  it("reuses the cached schema without changing subsequent results", () => {
    const schema = capsule([field({required: true})]);
    expect(validateFormValues(schema, {name: ""}).success).toBe(false);
    expect(validateFormValues(schema, {name: "Ann"}).success).toBe(true);
  });
});

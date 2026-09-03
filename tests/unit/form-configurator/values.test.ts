import {
  buildExpandedState,
  buildInitialValues,
  normalizeFormValues,
  normalizeFormValuesUntilStable,
} from "../../../src/modules/form-configurator/core/values.ts";
import type {CardsFieldConfig, FieldConfig} from "../../../src/modules/form-configurator/core/types.ts";

const cards = (overrides: Partial<CardsFieldConfig> = {}): CardsFieldConfig => ({
  id: "style", type: "cards", title: "Style", render: true,
  options: [{value: "boho", label: "Boho"}, {value: "minimal", label: "Minimal"}],
  ...overrides,
});

describe("form-configurator values", () => {
  it("builds type-specific initial values and skips render:false", () => {
    const sections: FieldConfig[] = [
      cards(), cards({id: "extras", multiple: true}),
      {id: "wishes", type: "textarea", title: "Wishes", render: true},
      {id: "name", type: "text", title: "Name", render: true},
      {id: "dates", type: "calendar", title: "Dates", render: true},
      {id: "hidden", type: "text", title: "Hidden", render: false},
    ];

    expect(buildInitialValues(sections)).toEqual({
      style: "", extras: [], wishes: "", name: "", dates: {from: "", to: ""},
    });
  });

  it("sanitizes saved cards while preserving text and calendar values", () => {
    const sections: FieldConfig[] = [cards(), cards({id: "extras", multiple: true}),
      {id: "name", type: "text", title: "Name", render: true},
      {id: "dates", type: "calendar", title: "Dates", render: true}];
    const values = buildInitialValues(sections, {
      style: ["minimal"], extras: ["boho", "removed"], name: "  Ann  ", dates: null,
    });

    expect(values).toEqual({
      style: "", extras: ["boho"], name: "  Ann  ", dates: {from: "", to: ""},
    });
    expect(normalizeFormValues([cards()], {style: ["minimal"]})).toEqual({style: "minimal"});
  });

  it("cleans hidden options through a multi-step cascade", () => {
    const sections = [
      cards({id: "trip", options: [{value: "rest", label: "Rest"}]}),
      cards({id: "style", options: [{
        value: "spa", label: "Spa", visibleWhen: {trip: {includes: ["rest"]}},
      }]}),
      cards({id: "extra", options: [{
        value: "massage", label: "Massage", visibleWhen: {style: {includes: ["spa"]}},
      }]}),
    ];

    expect(normalizeFormValuesUntilStable(sections, {
      trip: "unknown", style: "spa", extra: "massage",
    })).toEqual({trip: "", style: "", extra: ""});
  });

  it("builds expanded state from saved values and defaults", () => {
    const sections = [cards(), cards({id: "extras"})];
    expect(buildExpandedState(sections)).toEqual({style: true, extras: false});
    expect(buildExpandedState(sections, {style: false, extras: true}))
      .toEqual({style: false, extras: true});
  });
});

import {getVisibleOptions, isOptionVisible} from "../../../src/modules/form-configurator/core/conditions.ts";
import type {CardsFieldConfig, FieldOption} from "../../../src/modules/form-configurator/core/types.ts";

const option = (overrides: Partial<FieldOption> = {}): FieldOption => ({
  value: "spa",
  label: "Spa",
  ...overrides,
});

describe("form-configurator conditions", () => {
  it("supports scalar, array and empty values for includes/excludes", () => {
    const visible = option({visibleWhen: {trip: {includes: ["rest", "family"]}}});
    const excluded = option({visibleWhen: {trip: {excludes: ["business"]}}});

    expect(isOptionVisible(visible, {trip: "rest"})).toBe(true);
    expect(isOptionVisible(visible, {trip: ["family"]})).toBe(true);
    expect(isOptionVisible(visible, {})).toBe(false);
    expect(isOptionVisible(excluded, {trip: ["rest", "business"]})).toBe(false);
    expect(isOptionVisible(excluded, {})).toBe(true);
  });

  it("requires every field rule and gives hiddenWhen priority", () => {
    const conditional = option({
      visibleWhen: {trip: {includes: ["rest"]}, budget: {excludes: ["low"]}},
      hiddenWhen: {season: {includes: ["winter"]}},
    });

    expect(isOptionVisible(conditional, {trip: "rest", budget: "high"})).toBe(true);
    expect(isOptionVisible(conditional, {trip: "rest", budget: "low"})).toBe(false);
    expect(isOptionVisible(conditional, {
      trip: "rest", budget: "high", season: "winter",
    })).toBe(false);
  });

  it("filters options without changing their order", () => {
    const section: CardsFieldConfig = {
      id: "style", type: "cards", title: "Style", render: true,
      options: [
        option({value: "first"}),
        option({value: "hidden", visibleWhen: {trip: {includes: ["rest"]}}}),
        option({value: "last"}),
      ],
    };

    expect(getVisibleOptions(section, {trip: "business"}).map(({value}) => value))
      .toEqual(["first", "last"]);
  });
});

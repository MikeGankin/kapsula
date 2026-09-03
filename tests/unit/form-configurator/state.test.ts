import {
  createFormState,
  selectOption,
  setFieldValue,
  toggleSection,
} from "../../../src/modules/form-configurator/core/state.ts";
import type {CapsuleConfig} from "../../../src/modules/form-configurator/core/types.ts";

const capsule: CapsuleConfig = {
  title: "Form", subtitle: "Subtitle", imageSrc: "image.jpg", imageMobileSrc: "mobile.jpg",
  imageAlt: "Image", submitLabel: "Submit",
  sections: [
    {id: "style", type: "cards", title: "Style", render: true,
      options: [{value: "boho", label: "Boho"}]},
    {id: "extras", type: "cards", title: "Extras", render: true, multiple: true,
      options: [{value: "spa", label: "Spa"}]},
    {id: "wishes", type: "textarea", title: "Wishes", render: true},
    {id: "dates", type: "calendar", title: "Dates", render: true},
  ],
};

describe("form-configurator state", () => {
  it("restores a saved active section or uses the default expanded section", () => {
    expect(createFormState("island", capsule).activeSectionId).toBe("style");
    const restored = createFormState("island", capsule, {savedActiveSectionId: "extras"});
    expect(restored.expandedState).toEqual({
      style: false, extras: true, wishes: false, dates: false,
    });
    expect(restored.activeSectionId).toBe("extras");
  });

  it("keeps identity for unknown sections and toggles open/closed state", () => {
    const state = createFormState("island", capsule);
    expect(toggleSection(state, "unknown")).toBe(state);
    const closed = toggleSection(state, "style");
    expect(closed.expandedState).toEqual({
      style: false, extras: false, wishes: false, dates: false,
    });
    expect(closed.activeSectionId).toBe("style");
    expect(toggleSection(closed, "extras").expandedState.extras).toBe(true);
  });

  it("selects single and multiple cards and marks sections touched", () => {
    const state = createFormState("island", capsule);
    const selected = selectOption(state, capsule, "style", "boho");
    expect(selected.values.style).toBe("boho");
    expect(selected.touchedSections.style).toBe(true);
    const multiple = selectOption(selected, capsule, "extras", "spa");
    expect(multiple.values.extras).toEqual(["spa"]);
    expect(selectOption(multiple, capsule, "extras", "spa").values.extras).toEqual([]);
    expect(selectOption(state, capsule, "unknown", "x")).toBe(state);
  });

  it("sets textarea and calendar values with fresh references", () => {
    const state = createFormState("island", capsule);
    const text = setFieldValue(state, "wishes", "sea view");
    expect(text).not.toBe(state);
    expect(text.values).not.toBe(state.values);
    expect(text.values.wishes).toBe("sea view");
    const dates = setFieldValue(text, "dates", {from: "2026-09-01", to: "2026-09-07"});
    expect(dates.values.dates).toEqual({from: "2026-09-01", to: "2026-09-07"});
    expect(setFieldValue(state, "unknown", "x")).toBe(state);
  });
});

// @vitest-environment jsdom
/* global window */

import {SESSION_STORAGE_KEYS} from "../../src/scripts/kapsula/shared/constants.js";
import {
  readSavedActiveSection,
  readSavedFormValues,
  saveActiveSection,
  saveFormValues,
} from "../../src/scripts/kapsula/shared/sessionState.js";

const valuesKey = (capsuleId) => `${SESSION_STORAGE_KEYS.formValuesPrefix}.${capsuleId}`;
const activeKey = (capsuleId) => `${SESSION_STORAGE_KEYS.activeSectionPrefix}.${capsuleId}`;

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("session state формы", () => {
  it("изолирует значения и активную секцию по capsule id", () => {
    saveFormValues("first", {style: "calm"});
    saveFormValues("second", {mood: "sea"});
    saveActiveSection("first", "details");
    saveActiveSection("second", "mood");

    expect(readSavedFormValues("first")).toEqual({style: "calm"});
    expect(readSavedFormValues("second")).toEqual({mood: "sea"});
    expect(readSavedActiveSection("first")).toBe("details");
    expect(readSavedActiveSection("second")).toBe("mood");
    expect(window.sessionStorage.getItem(valuesKey("first"))).toBe('{"style":"calm"}');
    expect(window.sessionStorage.getItem(activeKey("second"))).toBe("mood");
  });

  it("предпочитает актуальные versioned values legacy-значениям", () => {
    window.sessionStorage.setItem(valuesKey("first"), '{"style":"current"}');
    window.sessionStorage.setItem(
      `${SESSION_STORAGE_KEYS.legacyFormValues}.first`,
      '{"style":"legacy"}',
    );

    expect(readSavedFormValues("first")).toEqual({style: "current"});
  });

  it.each([
    ["legacy per-capsule", `${SESSION_STORAGE_KEYS.legacyFormValues}.first`, '{"style":"calm"}'],
    ["legacy map", SESSION_STORAGE_KEYS.legacyFormValues, '{"first":{"style":"calm"}}'],
  ])("мигрирует %s в versioned key, не изменяя legacy", (_, legacyKey, rawLegacy) => {
    window.sessionStorage.setItem(legacyKey, rawLegacy);

    expect(readSavedFormValues("first")).toEqual({style: "calm"});
    expect(window.sessionStorage.getItem(valuesKey("first"))).toBe('{"style":"calm"}');
    expect(window.sessionStorage.getItem(legacyKey)).toBe(rawLegacy);
  });

  it("безопасно обрабатывает пустой id, повреждённый JSON и недоступный storage", () => {
    expect(readSavedFormValues("")).toBeNull();
    expect(readSavedActiveSection("")).toBeNull();
    window.sessionStorage.setItem(valuesKey("first"), "not-json");
    expect(readSavedFormValues("first")).toBeNull();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(readSavedFormValues("second")).toBeNull();
    expect(readSavedActiveSection("second")).toBeNull();
    expect(() => saveFormValues("second", {mood: "sea"})).not.toThrow();
    expect(() => saveActiveSection("second", "mood")).not.toThrow();
  });
});

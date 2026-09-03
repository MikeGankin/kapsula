// @vitest-environment jsdom

import {BehaviorSubject} from "rxjs";
import {bindFormEvents} from "../../../src/modules/form-configurator/runtime/bindFormEvents.ts";
import {bindFormPersistence} from "../../../src/modules/form-configurator/runtime/bindFormPersistence.ts";
import type {CapsuleConfig, FormState} from "../../../src/modules/form-configurator/core/types.ts";

const capsule: CapsuleConfig = {
  title: "Test", subtitle: "", imageSrc: "", imageMobileSrc: "", imageAlt: "", submitLabel: "",
  sections: [
    {id: "first", type: "text", title: "First", render: true},
    {id: "second", type: "text", title: "Second", render: true},
    {id: "notes", type: "textarea", title: "Notes", render: true},
  ],
};

function state(): FormState {
  return {capsuleId: "capsule", values: {first: "", second: "", notes: ""},
    expandedState: {first: true, second: false, notes: false}, activeSectionId: "first", touchedSections: {}};
}

describe("runtime bindings", () => {
  it("routes any configured text id and ignores unknown ids after cleanup", () => {
    const form = document.createElement("form");
    const input = document.createElement("input");
    input.dataset.field = "second";
    form.append(input);
    let current = state();
    const cleanup = bindFormEvents(form, {
      getCapsule: () => capsule,
      updateState: (updater) => { current = updater(current); },
      saveActiveSection: vi.fn(),
    });
    input.value = "value";
    input.dispatchEvent(new Event("input", {bubbles: true}));
    expect(current.values).toMatchObject({first: "", second: "value"});
    input.dataset.field = "unknown";
    input.value = "ignored";
    input.dispatchEvent(new Event("input", {bubbles: true}));
    expect(current.values.second).toBe("value");
    cleanup();
    input.dataset.field = "second";
    input.value = "after";
    input.dispatchEvent(new Event("input", {bubbles: true}));
    expect(current.values.second).toBe("value");
  });

  it("debounces serialization and removes lifecycle flush after cleanup", () => {
    vi.useFakeTimers();
    const subject = new BehaviorSubject(state());
    const save = vi.fn();
    const cleanup = bindFormPersistence(subject, {
      getSnapshot: () => subject.value,
      getCapsule: () => capsule,
      saveFormValues: save,
    });
    subject.next({...subject.value, values: {...subject.value.values, first: "one", second: "two"}});
    vi.advanceTimersByTime(150);
    expect(save).toHaveBeenLastCalledWith("capsule", {first: "one", second: "two"});
    cleanup();
    save.mockClear();
    window.dispatchEvent(new Event("pagehide"));
    subject.next({...subject.value, values: {...subject.value.values, first: "after"}});
    vi.advanceTimersByTime(150);
    expect(save).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

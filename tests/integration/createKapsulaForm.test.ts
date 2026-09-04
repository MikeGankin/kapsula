// @vitest-environment jsdom

import kapsulaFormConfig from "../../src/scripts/kapsula/features/form/kapsulaFormConfig.ts";
import {createConfiguredForm} from "../../src/scripts/kapsula/features/form/createKapsulaForm.ts";
import type {FormExperience, FormSnapshot} from "../../src/modules/form-configurator/index.ts";
import {createFormRoot} from "../helpers/createFormRoot.js";

function dependencies() {
  return {
    config: kapsulaFormConfig,
    storage: {
      readValues: vi.fn(() => null),
      saveValues: vi.fn(),
      readActiveSection: vi.fn(() => null),
      saveActiveSection: vi.fn(),
    },
    renderer: {
      render: vi.fn(),
      showValidationErrors: vi.fn(),
      destroy: vi.fn(),
    },
    effects: {
      syncCapsuleShell: vi.fn(),
      animateSections: vi.fn(),
      syncOverlay: vi.fn(),
      prepareCapsule: vi.fn(() => Promise.resolve()),
      destroy: vi.fn(),
    },
  };
}

function acceptsPublicSnapshot(snapshot: FormSnapshot): string {
  return snapshot.capsuleId;
}

describe("createConfiguredForm composition boundary", () => {
  it("инициализирует и переключает все production capsules через injected dependencies", async () => {
    const calls: string[] = [];
    const storage = {
      readValues: vi.fn(() => null),
      saveValues: vi.fn(),
      readActiveSection: vi.fn(() => null),
      saveActiveSection: vi.fn(),
    };
    const renderer = {
      render: vi.fn(() => calls.push("render")),
      showValidationErrors: vi.fn(),
      destroy: vi.fn(() => calls.push("renderer.destroy")),
    };
    const effects = {
      syncCapsuleShell: vi.fn(() => calls.push("shell")),
      animateSections: vi.fn(() => calls.push("sections")),
      syncOverlay: vi.fn(() => calls.push("overlay")),
      prepareCapsule: vi.fn(() => Promise.resolve()),
      destroy: vi.fn(() => calls.push("effects.destroy")),
    };
    const handle: FormExperience = createConfiguredForm(createFormRoot(), {
      config: kapsulaFormConfig,
      storage,
      renderer,
      effects,
    }, {initialCapsuleId: "asian"});

    expect(calls.slice(0, 4)).toEqual(["shell", "render", "sections", "overlay"]);
    expect(handle.getSnapshot().capsuleId).toBe("asian");
    expect(acceptsPublicSnapshot(handle.getSnapshot())).toBe("asian");
    expect(handle.setCapsule("oriental")).toBe(true);
    expect(handle.getSnapshot().capsuleId).toBe("oriental");
    expect(handle.setCapsule("island")).toBe(true);
    expect(handle.getSnapshot().capsuleId).toBe("island");
    expect(handle.setCapsule("missing")).toBe(false);
    await expect(handle.prepareCapsule("asian")).resolves.toBe(true);
    expect(effects.prepareCapsule).toHaveBeenCalledWith(kapsulaFormConfig.capsules.asian);

    handle.destroy();
    handle.destroy();
    expect(renderer.destroy).toHaveBeenCalledTimes(1);
    expect(effects.destroy).toHaveBeenCalledTimes(1);
    expect(calls.slice(-2)).toEqual(["renderer.destroy", "effects.destroy"]);
  });

  it("отклоняет отсутствующий обязательный DOM node", () => {
    expect(() => createConfiguredForm(
      createFormRoot({omit: "data-kapsula-form-title"}),
      dependencies(),
    )).toThrow('expected HTMLElement at "[data-kapsula-form-title]"');
  });

  it("отклоняет обязательный DOM node неверного класса", () => {
    const root = createFormRoot();
    const form = root.querySelector("[data-kapsula-form]");
    const replacement = document.createElement("div");
    replacement.dataset.kapsulaForm = "";
    form?.replaceWith(replacement);

    expect(() => createConfiguredForm(root, dependencies()))
      .toThrow('expected HTMLFormElement at "[data-kapsula-form]"');
  });
});

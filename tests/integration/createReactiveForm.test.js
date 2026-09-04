// @vitest-environment jsdom
/* global document, window, HTMLFormElement */

import {SESSION_STORAGE_KEYS} from "../../src/scripts/kapsula/shared/constants.js";
import {createReactiveForm} from "../../src/scripts/kapsula/features/form/createReactiveForm.js";
import {
  createConfiguredForm,
  createKapsulaForm,
  kapsulaFormEffects,
  kapsulaFormRenderer,
  kapsulaFormSessionAdapter,
} from "../../src/scripts/kapsula/features/form/createKapsulaForm.ts";
import {createMinimalFormConfig} from "../fixtures/formConfigurator.js";
import {createFormRoot} from "../helpers/createFormRoot.js";

const effectMocks = vi.hoisted(() => ({
  animateFormSections: vi.fn(),
  animateFormImageOverlay: vi.fn(),
  destroyFormImageOverlay: vi.fn(),
  getResponsiveImageSources: vi.fn((desktop, mobile) => ({desktop, mobile})),
  preloadResponsiveImage: vi.fn(() => Promise.resolve()),
  syncResponsivePicture: vi.fn(),
  renderForm: vi.fn(),
  renderFormValidationErrors: vi.fn(),
  destroyRenderedForm: vi.fn(),
}));

vi.mock("../../src/scripts/kapsula/features/form/effects/animateFormSections.js", () => ({
  animateFormSections: effectMocks.animateFormSections,
}));
vi.mock("../../src/scripts/kapsula/features/form/effects/animateFormImageOverlay.js", () => ({
  animateFormImageOverlay: effectMocks.animateFormImageOverlay,
  destroyFormImageOverlay: effectMocks.destroyFormImageOverlay,
}));
vi.mock("../../src/scripts/kapsula/features/form/effects/formResponsiveImages.js", () => ({
  getResponsiveImageSources: effectMocks.getResponsiveImageSources,
  preloadResponsiveImage: effectMocks.preloadResponsiveImage,
  syncResponsivePicture: effectMocks.syncResponsivePicture,
}));
vi.mock("../../src/scripts/kapsula/features/form/renderForm.ts", async (importOriginal) => {
  const actual = await importOriginal();
  effectMocks.renderForm.mockImplementation(actual.renderForm);
  effectMocks.renderFormValidationErrors.mockImplementation(actual.renderFormValidationErrors);
  effectMocks.destroyRenderedForm.mockImplementation(actual.destroyRenderedForm);
  return {
    renderForm: effectMocks.renderForm,
    renderFormValidationErrors: effectMocks.renderFormValidationErrors,
    destroyRenderedForm: effectMocks.destroyRenderedForm,
  };
});

const valuesKey = (capsuleId) => `${SESSION_STORAGE_KEYS.formValuesPrefix}.${capsuleId}`;
const activeKey = (capsuleId) => `${SESSION_STORAGE_KEYS.activeSectionPrefix}.${capsuleId}`;
let formConfig;

function createForm(options) {
  const root = createFormRoot();
  const handle = createConfiguredForm(root, {
    config: formConfig,
    storage: kapsulaFormSessionAdapter,
    renderer: kapsulaFormRenderer,
    effects: kapsulaFormEffects,
  }, options);
  return {root, form: root.querySelector("[data-kapsula-form]"), handle};
}

function dispatchChoice(form, sectionId, value) {
  const input = form.querySelector(
    `[data-kapsula-choice][data-section-id="${sectionId}"][value="${value}"]`,
  );
  input.dispatchEvent(new Event("change", {bubbles: true}));
  return input;
}

beforeEach(() => {
  formConfig = createMinimalFormConfig();
  window.sessionStorage.clear();
  document.body.replaceChildren();
  vi.useFakeTimers();
  vi.clearAllMocks();
  effectMocks.preloadResponsiveImage.mockResolvedValue();
  effectMocks.getResponsiveImageSources
    .mockImplementation((desktop, mobile) => ({desktop, mobile}));
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  document.body.replaceChildren();
  window.sessionStorage.clear();
});

describe("createReactiveForm lifecycle", () => {
  it("сохраняет legacy facade как точный alias primary composition root", () => {
    expect(createReactiveForm).toBe(createKapsulaForm);
  });

  it.each([
    "data-kapsula-form-title",
    "data-kapsula-form-subtitle",
    "data-kapsula-form-image",
    "data-kapsula-form",
  ])("явно отклоняет root без обязательного узла %s", (omit) => {
    const root = createFormRoot({omit});
    expect(() => createConfiguredForm(root, {
      config: formConfig,
      storage: kapsulaFormSessionAdapter,
      renderer: kapsulaFormRenderer,
      effects: kapsulaFormEffects,
    }))
      .toThrow("Kapsula form screen is missing required nodes");
  });

  it("восстанавливает values/active section и синхронизирует shell выбранной капсулы", () => {
    window.sessionStorage.setItem(valuesKey("first"), JSON.stringify({
      style: "calm",
      details: ["hat"],
      comment: "Сохранено",
    }));
    window.sessionStorage.setItem(activeKey("first"), "details");

    const {root, handle} = createForm({initialCapsuleId: "first"});

    expect(root.querySelector("[data-kapsula-form-title]").textContent).toBe("Первая капсула");
    expect(root.querySelector("[data-kapsula-form-subtitle]").textContent).toBe("Первое описание");
    expect(root.querySelector(".kapsula-form__trigger").textContent).toBe("Подобрать первую");
    expect(root.querySelector('[data-section-id="details"]').getAttribute("aria-expanded"))
      .toBe("true");
    expect(effectMocks.syncResponsivePicture).toHaveBeenCalledWith(
      root.querySelector("[data-kapsula-form-image]"),
      {desktop: "/first.jpg", mobile: "/first-mobile.jpg", alt: "Первая капсула"},
    );
    expect(handle.getSnapshot()).toMatchObject({
      capsuleId: "first",
      values: {style: "calm", details: ["hat"], comment: "Сохранено"},
    });
    handle.destroy();
  });

  it("обрабатывает delegated click/change/input и предотвращает submit", () => {
    window.sessionStorage.setItem(valuesKey("first"), JSON.stringify({
      style: "calm",
      details: ["hat"],
      comment: "",
    }));
    const {form, handle} = createForm();

    form.querySelector('[data-section-id="details"]').click();
    expect(form.querySelector('[data-section-id="details"]').getAttribute("aria-expanded"))
      .toBe("true");

    dispatchChoice(form, "style", "bright");
    expect(handle.getSnapshot().values).toMatchObject({style: "bright", details: []});

    const textarea = form.querySelector("[data-kapsula-textarea]");
    textarea.value = "Новое пожелание";
    textarea.dispatchEvent(new Event("input", {bubbles: true}));
    expect(handle.getSnapshot().values.comment).toBe("Новое пожелание");

    const submitEvent = new Event("submit", {bubbles: true, cancelable: true});
    expect(form.dispatchEvent(submitEvent)).toBe(false);
    expect(submitEvent.defaultPrevented).toBe(true);
    handle.destroy();
  });

  it("обслуживает несколько config-driven text fields без специальной orchestration", () => {
    formConfig.capsules.first.sections.splice(2, 0,
      {id: "guestName", type: "text", title: "Имя", render: true, required: true},
      {id: "promoCode", type: "text", title: "Промокод", render: true},
    );
    window.sessionStorage.setItem(valuesKey("first"), JSON.stringify({
      style: "calm", details: [], guestName: "Сохранённое имя", promoCode: "OLD",
    }));
    const {form, handle} = createForm();
    const name = form.querySelector('[data-field="guestName"]');
    const promo = form.querySelector('[data-field="promoCode"]');

    expect(name.value).toBe("Сохранённое имя");
    expect(promo.value).toBe("OLD");
    name.value = "   ";
    name.dispatchEvent(new Event("input", {bubbles: true}));
    const invalid = handle.validate();
    expect(invalid.success).toBe(false);
    expect(invalid.error.issues.some((issue) => issue.path[0] === "guestName")).toBe(true);
    name.value = "Анна";
    name.dispatchEvent(new Event("input", {bubbles: true}));
    promo.value = "NEW";
    promo.dispatchEvent(new Event("input", {bubbles: true}));
    expect(handle.getSnapshot().values).toMatchObject({guestName: "Анна", promoCode: "NEW"});
    expect(form.querySelector('[data-kapsula-rendered-section="guestName"] [data-kapsula-section-summary]')
      .textContent).toBe("Анна");

    vi.advanceTimersByTime(150);
    expect(JSON.parse(window.sessionStorage.getItem(valuesKey("first")))).toMatchObject({
      guestName: "Анна", promoCode: "NEW",
    });
    handle.destroy();
    name.value = "После destroy";
    name.dispatchEvent(new Event("input", {bubbles: true}));
    expect(handle.getSnapshot().values.guestName).toBe("Анна");
  });

  it("возвращает Zod validation и делегирует issues renderer-границе", () => {
    const {form, handle} = createForm();
    const result = handle.validate();

    expect(result.success).toBe(false);
    handle.showValidationErrors(result);
    expect(effectMocks.renderFormValidationErrors).toHaveBeenLastCalledWith(
      form,
      expect.objectContaining({title: "Первая капсула"}),
      result.error.issues,
    );
    expect(form.querySelector('[data-kapsula-rendered-section="style"] [role="alert"]')
      .hidden).toBe(false);

    dispatchChoice(form, "style", "calm");
    const validResult = handle.validate();
    expect(validResult.success).toBe(true);
    handle.showValidationErrors(validResult);
    expect(effectMocks.renderFormValidationErrors).toHaveBeenLastCalledWith(
      form,
      expect.any(Object),
      [],
    );
    handle.destroy();
  });

  it("переключает только известную капсулу и восстанавливает её state", () => {
    window.sessionStorage.setItem(valuesKey("second"), JSON.stringify({mood: "sea"}));
    window.sessionStorage.setItem(activeKey("second"), "mood");
    const {root, handle} = createForm();
    const initialSnapshot = handle.getSnapshot();

    expect(handle.setCapsule("missing")).toBe(false);
    expect(handle.getSnapshot()).toEqual(initialSnapshot);
    expect(handle.setCapsule("second")).toBe(true);
    expect(handle.getSnapshot()).toMatchObject({capsuleId: "second", values: {mood: "sea"}});
    expect(root.querySelector("[data-kapsula-form-title]").textContent).toBe("Вторая капсула");
    expect(effectMocks.renderForm).toHaveBeenLastCalledWith(
      expect.any(HTMLFormElement),
      expect.objectContaining({title: "Вторая капсула"}),
      {mood: "sea"},
      {mood: true},
      expect.objectContaining({forceFull: true}),
    );
    handle.destroy();
  });

  it("prepareCapsule отклоняет неизвестную и preload-ит responsive sources известной", async () => {
    const {handle} = createForm();

    await expect(handle.prepareCapsule("missing")).resolves.toBe(false);
    await expect(handle.prepareCapsule("first")).resolves.toBe(true);
    expect(effectMocks.preloadResponsiveImage).toHaveBeenCalledWith({
      desktop: "/first.jpg",
      mobile: "/first-mobile.jpg",
    });
    handle.destroy();
  });

  it("сохраняет option values по debounce/pagehide, исключая textarea", () => {
    const {form, handle} = createForm();
    vi.advanceTimersByTime(150);
    window.sessionStorage.removeItem(valuesKey("first"));

    dispatchChoice(form, "style", "calm");
    const textarea = form.querySelector("[data-kapsula-textarea]");
    textarea.value = "Не сохранять";
    textarea.dispatchEvent(new Event("input", {bubbles: true}));

    expect(window.sessionStorage.getItem(valuesKey("first"))).toBeNull();
    vi.advanceTimersByTime(149);
    expect(window.sessionStorage.getItem(valuesKey("first"))).toBeNull();
    vi.advanceTimersByTime(1);
    expect(JSON.parse(window.sessionStorage.getItem(valuesKey("first")))).toEqual({
      style: "calm",
      details: [],
    });

    dispatchChoice(form, "details", "hat");
    window.dispatchEvent(new Event("pagehide"));
    expect(JSON.parse(window.sessionStorage.getItem(valuesKey("first")))).toEqual({
      style: "calm",
      details: ["hat"],
    });
    handle.destroy();
  });

  it("сохраняет последние values при hidden visibilitychange и снимает listener", () => {
    const visibilityState = vi.spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    const {form, handle} = createForm();
    vi.advanceTimersByTime(150);
    window.sessionStorage.removeItem(valuesKey("first"));

    dispatchChoice(form, "style", "calm");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(JSON.parse(window.sessionStorage.getItem(valuesKey("first")))).toEqual({
      style: "calm",
      details: [],
    });

    window.sessionStorage.removeItem(valuesKey("first"));
    handle.destroy();
    document.dispatchEvent(new Event("visibilitychange"));
    expect(window.sessionStorage.getItem(valuesKey("first"))).toBeNull();
    visibilityState.mockRestore();
  });

  it("destroy отменяет уже запланированное debounce-сохранение", () => {
    const {form, handle} = createForm();
    vi.advanceTimersByTime(150);
    window.sessionStorage.removeItem(valuesKey("first"));

    dispatchChoice(form, "style", "calm");
    handle.destroy();
    vi.advanceTimersByTime(150);

    expect(window.sessionStorage.getItem(valuesKey("first"))).toBeNull();
  });

  it("destroy отменяет effects, persistence и delegated listeners", () => {
    const {root, form, handle} = createForm();
    vi.advanceTimersByTime(150);
    effectMocks.renderForm.mockClear();
    effectMocks.animateFormImageOverlay.mockClear();
    window.sessionStorage.removeItem(valuesKey("first"));

    handle.destroy();
    expect(effectMocks.destroyFormImageOverlay).toHaveBeenCalledWith(
      root.querySelector("[data-kapsula-form-overlay-images]"),
    );

    dispatchChoice(form, "style", "calm");
    form.querySelector('[data-section-id="details"]').click();
    window.dispatchEvent(new Event("pagehide"));
    vi.advanceTimersByTime(200);

    expect(effectMocks.renderForm).not.toHaveBeenCalled();
    expect(effectMocks.animateFormImageOverlay).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(valuesKey("first"))).toBeNull();
  });
});

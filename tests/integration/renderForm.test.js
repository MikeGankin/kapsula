// @vitest-environment jsdom
/* global document */

import {
  destroyRenderedForm,
  renderForm,
  renderFormValidationErrors,
} from "../../src/scripts/kapsula/features/form/renderForm.ts";
import {createAllRendererForm} from "../fixtures/formConfigurator.js";

const calendarMocks = vi.hoisted(() => ({
  destroy: vi.fn(),
  createCalendarContent: vi.fn((section, value, values, updateState) => {
    const node = document.createElement("div");
    node.dataset.calendarMock = section.id;
    node.dataset.value = JSON.stringify(value);
    node.dataset.values = JSON.stringify(values);
    node.dataset.hasUpdateState = String(typeof updateState === "function");
    return node;
  }),
}));

calendarMocks.createCalendarContentHandle = vi.fn((...args) => ({
  node: calendarMocks.createCalendarContent(...args),
  sync: vi.fn(),
  destroy: calendarMocks.destroy,
}));

vi.mock("../../src/scripts/kapsula/features/form/createCalendarContent.ts", () => calendarMocks);

function render(schema, values, expandedState, options = {}) {
  const form = document.createElement("form");
  document.body.append(form);
  renderForm(form, schema, values, expandedState, {forceFull: true, ...options});
  return form;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe("renderForm", () => {
  it("рендерит известные типы в порядке схемы без полного DOM snapshot", () => {
    const schema = createAllRendererForm();
    const values = {
      single: "one",
      multiple: ["alpha"],
      notes: "Текст",
      query: "пляж",
      dates: {from: "2026-09-10", to: "2026-09-12"},
    };
    const form = render(schema, values, {single: true}, {updateState: vi.fn()});

    expect(Array.from(form.querySelectorAll("[data-kapsula-rendered-section]"))
      .map((node) => node.dataset.kapsulaRenderedSection))
      .toEqual(["single", "multiple", "notes", "query", "dates"]);

    const single = form.querySelector('[data-kapsula-rendered-section="single"]');
    const radios = single.querySelectorAll('input[type="radio"]');
    expect(single.querySelector("fieldset legend").textContent).toBe("Один вариант");
    expect(radios).toHaveLength(1);
    expect(radios[0].name).toBe("single");
    expect(radios[0].value).toBe("one");
    expect(radios[0].checked).toBe(true);
    expect(radios[0].dataset.sectionId).toBe("single");

    const checkboxes = form.querySelectorAll(
      '[data-kapsula-rendered-section="multiple"] input[type="checkbox"]',
    );
    expect(Array.from(checkboxes).map((input) => input.value)).toEqual(["alpha", "beta"]);
    expect(checkboxes[0].checked).toBe(true);

    const textarea = form.querySelector("[data-kapsula-textarea]");
    expect(textarea.name).toBe("notes");
    expect(textarea.value).toBe("Текст");
    expect(textarea.placeholder).toBe("Введите текст");
    expect(textarea.getAttribute("aria-describedby")).toBe("kapsula-section-subtitle-notes");
    expect(form.querySelector('label[for="kapsula-field-notes"]').textContent).toBe("Комментарий");

    const text = form.querySelector('[data-field="query"]');
    expect(text.type).toBe("text");
    expect(text.id).toBe("kapsula-field-query");
    expect(text.name).toBe("query");
    expect(text.value).toBe("пляж");
    expect(text.placeholder).toBe("Введите запрос");
    expect(text.getAttribute("aria-describedby")).toBe("kapsula-section-subtitle-query");
    expect(form.querySelector('label[for="kapsula-field-query"]').textContent).toBe("Поиск");

    expect(calendarMocks.createCalendarContentHandle).toHaveBeenCalledWith(
      schema.sections[4],
      values.dates,
      values,
      expect.any(Function),
    );
  });

  it("согласует ARIA section shell и required marker", () => {
    const schema = createAllRendererForm();
    const form = render(schema, {single: "", multiple: [], notes: "", query: "", dates: null}, {
      single: true,
    });
    const section = form.querySelector('[data-kapsula-rendered-section="single"]');
    const trigger = section.querySelector("[data-kapsula-section-trigger]");
    const panel = section.querySelector('[role="region"]');

    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.type).toBe("button");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(section.querySelector(".kapsula-form-section__required-marker")
      .getAttribute("aria-hidden")).toBe("true");
  });

  it("при incremental render сохраняет input и focus, обновляя options, summary и expanded", () => {
    const schema = createAllRendererForm();
    const initialValues = {single: "", multiple: ["alpha"], notes: "", query: "", dates: null};
    const form = render(schema, initialValues, {single: true});
    const input = form.querySelector('[data-kapsula-choice][value="one"]');
    input.focus();

    const nextValues = {...initialValues, single: "one"};
    renderForm(form, schema, nextValues, {single: false});

    expect(form.querySelector('[data-kapsula-choice][value="one"]')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.checked).toBe(true);
    expect(form.querySelector('[data-kapsula-rendered-section="single"]')
      .querySelector("[data-kapsula-section-trigger]").getAttribute("aria-expanded"))
      .toBe("false");
    expect(form.querySelector('[data-kapsula-rendered-section="single"] [data-kapsula-section-summary]')
      .textContent).toBe("Первый");
    expect(form.querySelector('[data-kapsula-choice][value="hidden"]')).toBeNull();
  });

  it("сохраняет identity, focus и caret text input при incremental render", () => {
    const schema = createAllRendererForm();
    const values = {single: "", multiple: [], notes: "", query: "до", dates: null};
    const form = render(schema, values, {}, {updateState: vi.fn()});
    const input = form.querySelector('[data-field="query"]');
    input.focus();
    input.setSelectionRange(2, 2);

    renderForm(form, schema, {...values, query: "пляж"}, {});

    expect(form.querySelector('[data-field="query"]')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("пляж");
  });

  it("показывает ошибки только указанным секциям и сохраняет summary после очистки", () => {
    const schema = createAllRendererForm();
    const form = render(
      schema,
      {single: "one", multiple: [], notes: "", query: "", dates: null},
      {single: true},
    );
    const section = form.querySelector('[data-kapsula-rendered-section="single"]');
    const error = section.querySelector("[data-kapsula-section-error]");
    const summary = section.querySelector("[data-kapsula-section-summary]");

    renderFormValidationErrors(form, schema, [{path: ["single"]}]);
    expect(error.hidden).toBe(false);
    expect(error.getAttribute("role")).toBe("alert");
    expect(error.textContent).toContain("Один вариант");
    expect(form.querySelector('[data-kapsula-rendered-section="multiple"] [role="alert"]')
      .hidden).toBe(true);

    renderFormValidationErrors(form, schema, []);
    expect(error.hidden).toBe(true);
    expect(error.textContent).toBe("");
    expect(section.querySelector("[data-kapsula-section-summary]")).toBe(summary);
  });

  it("явно отклоняет неизвестный тип поля", () => {
    const schema = createAllRendererForm();
    schema.sections.splice(1, 0, {
      id: "unknown",
      type: "unsupported",
      title: "Неизвестный",
      render: true,
      options: [],
    });
    expect(() => render(
      schema,
      {single: "", unknown: "", multiple: [], notes: "", query: "", dates: null},
      {},
    )).toThrow("Unknown field renderer: unsupported");
  });

  it("уничтожает calendar handle при full render и делает root destroy идемпотентным", () => {
    const schema = createAllRendererForm();
    const values = {single: "", multiple: [], notes: "", query: "", dates: null};
    const form = render(schema, values, {}, {updateState: vi.fn()});

    renderForm(form, schema, values, {}, {forceFull: true, updateState: vi.fn()});
    expect(calendarMocks.destroy).toHaveBeenCalledTimes(1);
    destroyRenderedForm(form);
    destroyRenderedForm(form);
    expect(calendarMocks.destroy).toHaveBeenCalledTimes(2);
  });
});

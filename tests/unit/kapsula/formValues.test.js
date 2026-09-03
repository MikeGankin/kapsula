import {
  normalizeFormValues,
  normalizeFormValuesUntilStable,
  toggleOptionValue,
} from "../../../src/scripts/kapsula/formValues.js";

/**
 * Нормализация значений — самая хрупкая часть формы: она чинит состояние
 * после того, как выбор в одной секции скрыл опции в другой. Ошибка здесь
 * не падает, а тихо отправляет менеджеру лид с несуществующими опциями.
 */

function section(overrides = {}) {
  return {
    id: "style",
    type: "cards",
    multiple: false,
    options: [
      {value: "boho"},
      {value: "minimal"},
    ],
    ...overrides,
  };
}

describe("toggleOptionValue", () => {
  it("выбирает опцию в одиночной секции", () => {
    expect(toggleOptionValue(section(), "", "boho")).toBe("boho");
  });

  it("снимает выбор при повторном клике по той же опции", () => {
    expect(toggleOptionValue(section(), "boho", "boho")).toBe("");
  });

  it("добавляет и убирает значения в множественной секции", () => {
    const multiple = section({multiple: true});

    expect(toggleOptionValue(multiple, ["boho"], "minimal")).toEqual(["boho", "minimal"]);
    expect(toggleOptionValue(multiple, ["boho", "minimal"], "boho")).toEqual(["minimal"]);
  });

  it("не падает, когда значение множественной секции ещё не массив", () => {
    // Состояние из sessionStorage предыдущей версии схемы могло хранить строку.
    expect(toggleOptionValue(section({multiple: true}), undefined, "boho")).toEqual(["boho"]);
  });
});

describe("normalizeFormValues", () => {
  it("сбрасывает значение, которого больше нет среди видимых опций", () => {
    const sections = [section()];

    expect(normalizeFormValues(sections, {style: "unknown"})).toEqual({style: ""});
  });

  it("вычищает из множественного выбора скрытые условием опции", () => {
    const sections = [
      section({
        multiple: true,
        options: [
          {value: "boho"},
          {value: "spa", visibleWhen: {trip: {includes: ["rest"]}}},
        ],
      }),
    ];

    const values = normalizeFormValues(sections, {style: ["boho", "spa"], trip: "business"});

    expect(values.style).toEqual(["boho"]);
  });

  it("приводит массив к строке, если секция стала одиночной", () => {
    // Схема правится в formConfig.json, а значения переживают её в сессии.
    const sections = [section()];

    expect(normalizeFormValues(sections, {style: ["minimal"]})).toEqual({style: "minimal"});
  });

  it("оставляет текст в textarea нетронутым", () => {
    const sections = [section({id: "wishes", type: "textarea", options: []})];

    expect(normalizeFormValues(sections, {wishes: " хочу море "}))
      .toEqual({wishes: " хочу море "});
  });
});

describe("normalizeFormValuesUntilStable", () => {
  it("доводит до конца каскад: снятая опция скрывает следующую за ней", () => {
    /*
     * Цепочка: trip → style → extra. Сброс `trip` скрывает опцию в `style`,
     * а это, в свою очередь, скрывает опцию в `extra`. Один проход
     * нормализации почистил бы только первое звено.
     */
    const sections = [
      section({id: "trip", options: [{value: "rest"}]}),
      section({
        id: "style",
        options: [{value: "spa", visibleWhen: {trip: {includes: ["rest"]}}}],
      }),
      section({
        id: "extra",
        options: [{value: "massage", visibleWhen: {style: {includes: ["spa"]}}}],
      }),
    ];

    const values = normalizeFormValuesUntilStable(sections, {
      trip: "unknown",
      style: "spa",
      extra: "massage",
    });

    expect(values).toEqual({trip: "", style: "", extra: ""});
  });

  it("возвращает значения без изменений, если всё уже согласовано", () => {
    const sections = [section()];
    const values = normalizeFormValuesUntilStable(sections, {style: "boho"});

    expect(values).toEqual({style: "boho"});
  });
});

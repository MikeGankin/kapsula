import {
  buildCapsuleMap,
  buildExpandedState,
  buildInitialValues,
  getHotelsSettings,
  getInitialCapsuleId,
  isFieldRendered,
} from "./formSchema.js";

/**
 * Начальное состояние формы собирается из схемы и значений, переживших
 * прошлую сессию. Опция, удалённая контент-менеджером из formConfig.json,
 * не должна воскресать в summary и в письме менеджеру.
 */

const sections = [
  {
    id: "style",
    render: true,
    type: "choice",
    multiple: false,
    options: [{value: "boho"}, {value: "minimal"}],
  },
  {
    id: "extras",
    render: true,
    type: "choice",
    multiple: true,
    options: [{value: "spa"}, {value: "transfer"}],
  },
  {id: "wishes", type: "textarea", render: true},
];

describe("buildInitialValues", () => {
  it("даёт пустое значение нужного типа для каждой секции", () => {
    // Для множественного выбора это массив, для одиночного — строка:
    // иначе ломаются сравнения в условиях видимости.
    expect(buildInitialValues(sections)).toEqual({style: "", extras: [], wishes: ""});
  });

  it("восстанавливает сохранённые значения", () => {
    const values = buildInitialValues(sections, {style: "boho", extras: ["spa"]});

    expect(values.style).toBe("boho");
    expect(values.extras).toEqual(["spa"]);
  });

  it("отбрасывает опции, удалённые из конфига", () => {
    const values = buildInitialValues(sections, {
      style: "removed",
      extras: ["spa", "removed"],
    });

    expect(values.style).toBe("");
    expect(values.extras).toEqual(["spa"]);
  });

  it("не трогает произвольный текст в textarea", () => {
    const values = buildInitialValues(sections, {wishes: "хочу виллу у моря"});

    expect(values.wishes).toBe("хочу виллу у моря");
  });

  it("игнорирует значения секций, которых больше нет в схеме", () => {
    const values = buildInitialValues(sections, {legacySection: "value"});

    expect(values).not.toHaveProperty("legacySection");
  });

  it("не создаёт значение для секции с render: false", () => {
    const hiddenSection = {id: "hidden", type: "textarea", render: false};

    expect(buildInitialValues([...sections, hiddenSection], {hidden: "secret"}))
      .not.toHaveProperty("hidden");
  });
});

describe("buildCapsuleMap", () => {
  it("исключает секции с render: false из рабочей схемы", () => {
    const config = {
      capsules: {
        asian: {sections: [...sections, {id: "hidden", type: "textarea", render: false}]},
      },
    };

    expect(buildCapsuleMap(config).get("asian").sections.map(({id}) => id))
      .toEqual(["style", "extras", "wishes"]);
  });
});

describe("buildExpandedState", () => {
  it("по умолчанию раскрывает только первую секцию", () => {
    expect(buildExpandedState(sections)).toEqual({style: true, extras: false, wishes: false});
  });

  it("уважает уже открытую пользователем секцию", () => {
    const expanded = buildExpandedState(sections, {style: false, extras: true});

    expect(expanded.style).toBe(false);
    expect(expanded.extras).toBe(true);
  });
});

describe("getInitialCapsuleId", () => {
  const capsuleMap = new Map([["island", {}], ["asia", {}]]);

  it("берёт капсулу из ссылки, если такая есть в конфиге", () => {
    expect(getInitialCapsuleId(capsuleMap, "asia", {defaultCapsule: "island"})).toBe("asia");
  });

  it("откатывается на дефолтную, когда в ссылке мусор", () => {
    expect(getInitialCapsuleId(capsuleMap, "unknown", {defaultCapsule: "island"})).toBe("island");
  });

  it("откатывается на дефолтную, когда капсула не указана", () => {
    expect(getInitialCapsuleId(capsuleMap, null, {defaultCapsule: "island"})).toBe("island");
  });
});

describe("hotels render config", () => {
  it("отключает блок отелей единым флагом", () => {
    expect(isFieldRendered(getHotelsSettings({hotels: {render: false}}))).toBe(false);
    expect(isFieldRendered(getHotelsSettings({hotels: {render: true}}))).toBe(true);
  });
});

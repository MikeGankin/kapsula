import {getVisibleOptions, isOptionVisible} from "./formConditions.js";

/**
 * Условная видимость опций: правила `visibleWhen`/`excludes` задаются
 * контент-менеджером в formConfig.json, и ошибка в их трактовке показывает
 * клиенту заведомо несовместимый набор — например, спа в деловой поездке.
 */

describe("isOptionVisible", () => {
  it("показывает опцию без условий", () => {
    expect(isOptionVisible({value: "boho"}, {})).toBe(true);
  });

  it("скрывает опцию, пока не выбрано требуемое значение", () => {
    const option = {value: "spa", visibleWhen: {trip: {includes: ["rest"]}}};

    expect(isOptionVisible(option, {trip: "business"})).toBe(false);
    expect(isOptionVisible(option, {trip: "rest"})).toBe(true);
  });

  it("понимает `includes` как «хотя бы одно из», а не «все»", () => {
    const option = {value: "spa", visibleWhen: {trip: {includes: ["rest", "family"]}}};

    expect(isOptionVisible(option, {trip: ["family"]})).toBe(true);
  });

  it("скрывает опцию по `hiddenWhen` даже при выполненном visibleWhen", () => {
    const option = {
      value: "spa",
      visibleWhen: {trip: {includes: ["rest"]}},
      hiddenWhen: {budget: {includes: ["low"]}},
    };

    expect(isOptionVisible(option, {trip: "rest", budget: "low"})).toBe(false);
  });

  it("трактует `excludes` как «ни одно из выбранных»", () => {
    const option = {value: "spa", visibleWhen: {trip: {excludes: ["business"]}}};

    expect(isOptionVisible(option, {trip: ["business", "rest"]})).toBe(false);
    expect(isOptionVisible(option, {trip: ["rest"]})).toBe(true);
  });

  it("считает условие невыполненным, когда секция ещё не заполнена", () => {
    const option = {value: "spa", visibleWhen: {trip: {includes: ["rest"]}}};

    expect(isOptionVisible(option, {})).toBe(false);
  });
});

describe("getVisibleOptions", () => {
  it("оставляет только подходящие опции и сохраняет их порядок", () => {
    const section = {
      id: "style",
      options: [
        {value: "boho"},
        {value: "spa", visibleWhen: {trip: {includes: ["rest"]}}},
        {value: "minimal"},
      ],
    };

    expect(getVisibleOptions(section, {trip: "business"}).map((option) => option.value))
      .toEqual(["boho", "minimal"]);
  });
});

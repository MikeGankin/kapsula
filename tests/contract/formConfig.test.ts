import {parseFormConfig} from "../../src/modules/form-configurator/index.ts";
import kapsulaFormConfig from "../../src/scripts/kapsula/kapsulaFormConfig.ts";

const capsuleBase = {
  title: "Капсула",
  subtitle: "Описание",
  imageSrc: "/desktop.webp",
  imageMobileSrc: "/mobile.webp",
  imageAlt: "Описание изображения",
  submitLabel: "Продолжить",
};

function createConfig(sections: unknown[]) {
  return {
    capsules: {
      test: {
        ...capsuleBase,
        sections,
      },
    },
  };
}

function expectIssuePath(input: unknown, expectedPath: PropertyKey[]) {
  const result = parseFormConfigResult(input);

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.some(({path}) => (
      expectedPath.every((segment, index) => path[index] === segment)
    ))).toBe(true);
  }
}

function parseFormConfigResult(input: unknown) {
  try {
    return {success: true as const, data: parseFormConfig(input)};
  } catch (error) {
    return {success: false as const, error: error as {issues: {path: PropertyKey[]}[]}};
  }
}

describe("form config contract", () => {
  it("принимает реальный Kapsula config и сохраняет project-specific ключи", () => {
    expect(kapsulaFormConfig.submitEndpoint).toBe(
      "https://postman.trip-mate.ru/manager-lead-mail",
    );
    expect(kapsulaFormConfig.popupFields).toBeDefined();
    expect(kapsulaFormConfig.hotels).toBeDefined();
  });

  it.each([
    {id: "cards", title: "Карточки", type: "cards", render: true, options: []},
    {id: "textarea", title: "Комментарий", type: "textarea", render: true},
    {id: "text", title: "Имя", type: "text", render: true},
    {
      id: "calendar",
      title: "Даты",
      type: "calendar",
      render: true,
      calendar: {mode: "range", minDate: "today"},
    },
  ])("принимает минимальный field типа $type", (field) => {
    expect(() => parseFormConfig(createConfig([field]))).not.toThrow();
  });

  it("отклоняет неизвестный field type с точным issue path", () => {
    expectIssuePath(
      createConfig([{id: "unknown", title: "Unknown", type: "select", render: true}]),
      ["capsules", "test", "sections", 0, "type"],
    );
  });

  it("отклоняет cards option без обязательных value и label", () => {
    expectIssuePath(
      createConfig([{
        id: "cards",
        title: "Карточки",
        type: "cards",
        render: true,
        options: [{}],
      }]),
      ["capsules", "test", "sections", 0, "options", 0],
    );
  });

  it("отклоняет condition с нестроковым массивом", () => {
    expectIssuePath(
      createConfig([{
        id: "cards",
        title: "Карточки",
        type: "cards",
        render: true,
        options: [{
          value: "one",
          label: "One",
          visibleWhen: {country: {includes: [1]}},
        }],
      }]),
      ["capsules", "test", "sections", 0, "options", 0, "visibleWhen", "country", "includes", 0],
    );
  });

  it("сохраняет неизвестные project и presentation ключи", () => {
    const parsed = parseFormConfig({
      ...createConfig([{
        id: "cards",
        title: "Карточки",
        type: "cards",
        render: true,
        options: [{value: "one", label: "One", overlayCustomFlag: true}],
        sectionCustomFlag: true,
      }]),
      popupCustomData: {enabled: true},
    });
    const section = parsed.capsules.test?.sections[0];

    expect(parsed.popupCustomData).toEqual({enabled: true});
    expect(section?.sectionCustomFlag).toBe(true);
    expect(section?.type === "cards" && section.options[0]?.overlayCustomFlag).toBe(true);
  });
});

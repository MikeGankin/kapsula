import {validateSchema} from "../../../src/scripts/kapsula/formValidation.js";

/**
 * Валидация решает, уйдёт ли лид менеджеру. Слишком строгая — блокирует
 * отправку необязательной секцией, слишком мягкая — пропускает заявку
 * без ключевых ответов.
 */

function capsule(sections) {
  return {sections};
}

describe("validateSchema", () => {
  it("пропускает заполненную обязательную секцию", () => {
    const schema = capsule([{id: "style", type: "cards", required: true, multiple: false}]);

    expect(validateSchema(schema, {style: "boho"}).success).toBe(true);
  });

  it("не пропускает пустую обязательную секцию", () => {
    const schema = capsule([{id: "style", type: "cards", required: true, multiple: false}]);

    expect(validateSchema(schema, {style: ""}).success).toBe(false);
  });

  it("считает строку из пробелов незаполненной", () => {
    const schema = capsule([{id: "wishes", type: "textarea", required: true, multiple: false}]);

    expect(validateSchema(schema, {wishes: "   "}).success).toBe(false);
  });

  it("требует хотя бы один выбор в обязательной множественной секции", () => {
    const schema = capsule([{id: "style", type: "cards", required: true, multiple: true}]);

    expect(validateSchema(schema, {style: []}).success).toBe(false);
    expect(validateSchema(schema, {style: ["boho"]}).success).toBe(true);
  });

  it("пропускает пустую необязательную секцию", () => {
    const schema = capsule([{id: "wishes", type: "textarea", required: false, multiple: false}]);

    expect(validateSchema(schema, {wishes: ""}).success).toBe(true);
  });

  it("сообщает путь до незаполненного поля, чтобы подсветить нужную секцию", () => {
    const schema = capsule([
      {id: "style", type: "cards", required: true, multiple: false},
      {id: "trip", type: "cards", required: true, multiple: false},
    ]);

    const result = validateSchema(schema, {style: "boho", trip: ""});

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.path[0])).toContain("trip");
  });

  it("переиспользует одну и ту же схему для повторных проверок капсулы", () => {
    // Схема кешируется в WeakMap: результат не должен зависеть от номера вызова.
    const schema = capsule([{id: "style", type: "cards", required: true, multiple: false}]);

    expect(validateSchema(schema, {style: ""}).success).toBe(false);
    expect(validateSchema(schema, {style: "boho"}).success).toBe(true);
  });
});

// @vitest-environment jsdom
/* global document */

import {
  formatPhoneInput,
  renderPopupContactField,
  syncPopupFieldRendering,
  validatePopupForm,
} from "../../../../src/scripts/kapsula/features/popup/contact/popupContactForm.js";

/**
 * Маска телефона работает на каждое нажатие клавиши, поэтому её поведение
 * на «неудобном» вводе (вставка из буфера, лишняя восьмёрка, удаление цифр)
 * важнее, чем на идеальном.
 */

describe("formatPhoneInput", () => {
  it("расставляет разделители по мере ввода", () => {
    expect(formatPhoneInput("9")).toBe("9");
    expect(formatPhoneInput("999")).toBe("999");
    expect(formatPhoneInput("999123")).toBe("999 123");
    expect(formatPhoneInput("99912345")).toBe("999 123-45");
    expect(formatPhoneInput("9991234567")).toBe("999 123-45-67");
  });

  it("отбрасывает ведущую 7 или 8: код страны подставляется отдельно", () => {
    expect(formatPhoneInput("89991234567")).toBe("999 123-45-67");
    expect(formatPhoneInput("79991234567")).toBe("999 123-45-67");
  });

  it("игнорирует нецифровые символы при вставке из буфера", () => {
    expect(formatPhoneInput("+7 (999) 123-45-67")).toBe("999 123-45-67");
  });

  it("обрезает лишние цифры сверх десяти", () => {
    expect(formatPhoneInput("99912345678888")).toBe("999 123-45-67");
  });

  it("возвращает пустую строку, когда цифр не осталось", () => {
    // Пользователь стёр всё содержимое поля.
    expect(formatPhoneInput("")).toBe("");
    expect(formatPhoneInput("+ ()-")).toBe("");
  });
});

describe("popup fields render config", () => {
  function createForm() {
    document.body.innerHTML = `
      <form data-kapsula-popup-form>
        <fieldset data-kapsula-popup-field="contactMethod">
          <label><input name="contactMethod" type="radio" value="call"></label>
          <label data-kapsula-popup-field="email">
            <input name="contactMethod" type="radio" value="email" checked>
          </label>
        </fieldset>
        <label data-kapsula-popup-field="name"><input name="name" value="Иван"></label>
        <div data-kapsula-contact-field data-kapsula-popup-field="contact"></div>
        <template data-kapsula-phone-template>
          <label class="kapsula-popup-form__field">
            <input name="phone" type="tel" required>
            <span data-field-error="phone"></span>
          </label>
        </template>
        <template data-kapsula-email-template>
          <label class="kapsula-popup-form__field">
            <input name="email" type="email" required>
            <span data-field-error="email"></span>
          </label>
        </template>
        <span data-field-error="name"></span>
        <span data-field-error="contactMethod"></span>
      </form>
    `;

    return document.querySelector("form");
  }

  it("скрывает и отключает email, затем рендерит обязательный телефон", () => {
    const formNode = createForm();

    syncPopupFieldRendering(formNode);
    renderPopupContactField(formNode);

    expect(formNode.querySelector('[data-kapsula-popup-field="email"]').hidden).toBe(true);
    expect(formNode.elements.namedItem("contactMethod").value).toBe("call");
    expect(formNode.elements.namedItem("phone").required).toBe(true);
    expect(formNode.elements.namedItem("email")).toBeNull();
  });

  it("не пропускает отправку без телефона", () => {
    const formNode = createForm();

    syncPopupFieldRendering(formNode);
    renderPopupContactField(formNode);

    expect(validatePopupForm(formNode).success).toBe(false);
    formNode.elements.namedItem("phone").value = "999 123-45-67";
    expect(validatePopupForm(formNode).success).toBe(true);
  });
});

import {formatPhoneInput} from "./popupContactForm.js";

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

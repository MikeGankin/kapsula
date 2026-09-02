import * as z from "zod/mini";
import {getPopupFields, isFieldRendered} from "../formSchema.js";

export const POPUP_FIELD_ERRORS = {
  name: "Введите имя",
  phone: "Введите номер телефона",
  email: "Введите корректный email",
  contactMethod: "Выберите способ связи",
};

const PHONE_DIGITS_LENGTH = 10;

/**
 * Способ связи «Email» — единственный, для которого нужна почта вместо
 * телефона. Значение вынесено в константу: от него зависит и валидация,
 * и переключение полей в форме.
 */
export const EMAIL_CONTACT_METHOD = "email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isFilledPhone(value) {
  return value.replace(/\D/g, "").length === PHONE_DIGITS_LENGTH;
}

/**
 * Обязательным является только то поле, которое реально показано пользователю:
 * требовать телефон, когда на экране поле почты (и наоборот), — значит
 * блокировать отправку ошибкой, которую негде исправить.
 */
const popupContactSchema = z.object({
  name: z.string().check(
    z.trim(),
    z.minLength(2, POPUP_FIELD_ERRORS.name),
  ),
  phone: z.string().check(z.trim()),
  email: z.string().check(z.trim()),
  contactMethod: z.enum(["call", "max", "telegram", "whatsapp", EMAIL_CONTACT_METHOD], {
    error: POPUP_FIELD_ERRORS.contactMethod,
  }),
}).check(
  z.refine(
    (data) => data.contactMethod === EMAIL_CONTACT_METHOD || isFilledPhone(data.phone),
    {error: POPUP_FIELD_ERRORS.phone, path: ["phone"]},
  ),
  z.refine(
    (data) => data.contactMethod !== EMAIL_CONTACT_METHOD || EMAIL_PATTERN.test(data.email),
    {error: POPUP_FIELD_ERRORS.email, path: ["email"]},
  ),
);

export function formatPhoneInput(value) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, PHONE_DIGITS_LENGTH);

  const code = digits.slice(0, 3);
  const firstPart = digits.slice(3, 6);
  const secondPart = digits.slice(6, 8);
  const thirdPart = digits.slice(8, 10);

  if (!code) return "";
  if (!firstPart) return code;
  if (!secondPart) return `${code} ${firstPart}`;
  if (!thirdPart) return `${code} ${firstPart}-${secondPart}`;

  return `${code} ${firstPart}-${secondPart}-${thirdPart}`;
}

function getPopupFormPayload(popupFormNode) {
  return {
    name: popupFormNode.elements.namedItem("name")?.value ?? "",
    phone: popupFormNode.elements.namedItem("phone")?.value ?? "",
    email: popupFormNode.elements.namedItem("email")?.value ?? "",
    contactMethod: popupFormNode.elements.namedItem("contactMethod")?.value ?? "",
  };
}

export function syncPopupFieldRendering(popupFormNode, fields = getPopupFields()) {
  popupFormNode.querySelectorAll("[data-kapsula-popup-field]").forEach((fieldNode) => {
    const {kapsulaPopupField: fieldName} = fieldNode.dataset;

    if (fieldName === "contact") return;

    const shouldRender = isFieldRendered(fields[fieldName]);
    fieldNode.hidden = !shouldRender;
    fieldNode.querySelectorAll("input, textarea, select, button").forEach((controlNode) => {
      controlNode.disabled = !shouldRender;
    });
  });

  const selectedMethod = popupFormNode.querySelector('input[name="contactMethod"]:checked');

  if (selectedMethod?.disabled) {
    const fallbackMethod = popupFormNode.querySelector('input[name="contactMethod"]:not(:disabled)');
    if (fallbackMethod) fallbackMethod.checked = true;
  }
}

/**
 * Рендерит поле контакта под выбранный способ связи: телефон или почту.
 *
 * Поле именно пересоздаётся из шаблона, а не прячется стилями — в DOM всегда
 * живёт ровно одно поле. Значит, ненужный инпут не попадает ни в
 * `form.elements`, ни в автозаполнение, ни в обход по Tab, и в payload не
 * может утечь контакт, которого пользователь не вводил.
 *
 * Ре-рендер пропускается, если нужное поле уже отрисовано: иначе каждое
 * событие change стирало бы уже введённый текст.
 */
export function renderPopupContactField(popupFormNode) {
  const containerNode = popupFormNode.querySelector("[data-kapsula-contact-field]");

  if (!(containerNode instanceof HTMLElement)) return;

  const contactMethod = popupFormNode.elements.namedItem("contactMethod")?.value ?? "";
  const fieldName = contactMethod === EMAIL_CONTACT_METHOD ? "email" : "phone";

  if (!isFieldRendered(getPopupFields()[fieldName])) {
    containerNode.replaceChildren();
    containerNode.dataset.field = fieldName;
    containerNode.hidden = true;
    return;
  }

  containerNode.hidden = false;

  if (containerNode.dataset.field === fieldName) return;

  const templateNode = popupFormNode.querySelector(
    fieldName === "email"
      ? "[data-kapsula-email-template]"
      : "[data-kapsula-phone-template]",
  );

  if (!(templateNode instanceof HTMLTemplateElement)) return;

  containerNode.replaceChildren(templateNode.content.cloneNode(true));
  containerNode.dataset.field = fieldName;
}


function getPopupFieldWrapper(popupFormNode, fieldName, fieldNode) {
  if (fieldNode instanceof HTMLInputElement) {
    return fieldNode.closest(".kapsula-popup-form__field");
  }

  // Радиогруппа возвращается как RadioNodeList, поэтому берём общий fieldset.
  // Проверка по имени обязательна: поле контакта пересоздаётся, и для
  // отсутствующего в DOM телефона (или почты) `namedItem` тоже вернёт null —
  // без неё подсветка ошибки уехала бы на блок способов связи.
  if (fieldName === "contactMethod") {
    return popupFormNode.querySelector(".kapsula-popup-form__contact-method");
  }

  return null;
}

export function setPopupFieldError(popupFormNode, fieldName, message = "") {
  const fieldNode = popupFormNode.elements.namedItem(fieldName);
  const errorNode = popupFormNode.querySelector(`[data-field-error="${fieldName}"]`);
  const fieldWrapper = getPopupFieldWrapper(popupFormNode, fieldName, fieldNode);

  if (fieldWrapper instanceof HTMLElement) {
    if (message) {
      fieldWrapper.dataset.invalid = "true";
    } else {
      delete fieldWrapper.dataset.invalid;
    }
  }

  if (fieldNode instanceof HTMLInputElement) {
    fieldNode.setAttribute("aria-invalid", message ? "true" : "false");
  }

  if (errorNode instanceof HTMLElement) {
    errorNode.textContent = message;
  }
}

export function clearPopupFieldErrors(popupFormNode) {
  Object.keys(POPUP_FIELD_ERRORS).forEach((fieldName) => {
    setPopupFieldError(popupFormNode, fieldName);
  });
}

export function validatePopupForm(popupFormNode) {
  clearPopupFieldErrors(popupFormNode);

  const fields = getPopupFields();
  const payload = getPopupFormPayload(popupFormNode);

  if (!isFieldRendered(fields.name)) payload.name = "скрыто";
  if (!isFieldRendered(fields.phone)) payload.phone = "0000000000";
  if (!isFieldRendered(fields.email)) payload.email = "hidden@example.com";

  const result = popupContactSchema.safeParse(payload);

  if (result.success) {
    return {success: true, data: result.data};
  }

  result.error.issues.forEach((issue) => {
    const fieldName = issue.path[0];

    if (typeof fieldName === "string" && fieldName in POPUP_FIELD_ERRORS) {
      setPopupFieldError(popupFormNode, fieldName, issue.message);
    }
  });

  return {success: false, data: null};
}

export function setPopupSubmitPending(popupFormNode, isPending) {
  const submitButton = popupFormNode.querySelector(".kapsula-popup-form__submit");

  popupFormNode.dataset.pending = isPending ? "true" : "false";
  popupFormNode.setAttribute("aria-busy", isPending ? "true" : "false");

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = isPending;
  }
}

export function setPopupSubmitError(popupFormNode, message = "") {
  const errorNode = popupFormNode.querySelector("[data-kapsula-popup-submit-error]");

  if (!(errorNode instanceof HTMLElement)) return;

  errorNode.textContent = message;
  errorNode.hidden = !message;
}

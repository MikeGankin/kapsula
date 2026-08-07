import * as z from "zod/mini";

export const POPUP_FIELD_ERRORS = {
  name: "Введите имя",
  phone: "Введите номер телефона",
  contactMethod: "Выберите способ связи",
};

const PHONE_DIGITS_LENGTH = 10;

const popupContactSchema = z.object({
  name: z.string().check(
    z.trim(),
    z.minLength(2, POPUP_FIELD_ERRORS.name),
  ),
  phone: z.string().check(
    z.trim(),
    z.refine(
      (value) => value.replace(/\D/g, "").length === PHONE_DIGITS_LENGTH,
      {error: POPUP_FIELD_ERRORS.phone},
    ),
  ),
  contactMethod: z.enum(["call", "max", "telegram", "whatsapp"], {
    error: POPUP_FIELD_ERRORS.contactMethod,
  }),
});

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
    contactMethod: popupFormNode.elements.namedItem("contactMethod")?.value ?? "",
  };
}

function getPopupFieldWrapper(popupFormNode, fieldNode) {
  if (fieldNode instanceof HTMLInputElement) {
    return fieldNode.closest(".kapsula-popup-form__field");
  }

  // Радиогруппа возвращается как RadioNodeList, поэтому берём общий fieldset.
  return popupFormNode.querySelector(".kapsula-popup-form__contact-method");
}

export function setPopupFieldError(popupFormNode, fieldName, message = "") {
  const fieldNode = popupFormNode.elements.namedItem(fieldName);
  const errorNode = popupFormNode.querySelector(`[data-field-error="${fieldName}"]`);
  const fieldWrapper = getPopupFieldWrapper(popupFormNode, fieldNode);

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

  const result = popupContactSchema.safeParse(getPopupFormPayload(popupFormNode));

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

import * as z from "zod/mini";

const POPUP_ID = "coral-popup-kapsula";
const POPUP_FIELD_ERRORS = {
  name: "Введите имя",
  phone: "Введите номер телефона",
};

const popupContactSchema = z.object({
  name: z.string().check(
    z.trim(),
    z.minLength(2, "Введите имя")
  ),
  phone: z.string().check(
    z.trim(),
    z.refine((value) => value.replace(/\D/g, "").length === 10, {
      error: "Введите номер телефона",
    })
  ),
});

function openPopup(popupNode) {
  popupNode.show?.();
}

function formatPhoneInput(value) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  const code = digits.slice(0, 3);
  const firstPart = digits.slice(3, 6);
  const secondPart = digits.slice(6, 8);
  const thirdPart = digits.slice(8, 10);

  if (!code) {
    return "";
  }

  if (!firstPart) {
    return code;
  }

  if (!secondPart) {
    return `${code} ${firstPart}`;
  }

  if (!thirdPart) {
    return `${code} ${firstPart}-${secondPart}`;
  }

  return `${code} ${firstPart}-${secondPart}-${thirdPart}`;
}

function formatSubmittedAt(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function getPopupFormPayload(popupFormNode) {
  return {
    name: popupFormNode.elements.namedItem("name")?.value ?? "",
    phone: popupFormNode.elements.namedItem("phone")?.value ?? "",
  };
}

function getPopupFieldErrorNode(popupFormNode, fieldName) {
  return popupFormNode.querySelector(`[data-field-error="${fieldName}"]`);
}

function setPopupFieldError(popupFormNode, fieldName, message = "") {
  const fieldNode = popupFormNode.elements.namedItem(fieldName);
  const errorNode = getPopupFieldErrorNode(popupFormNode, fieldName);
  const fieldWrapper = fieldNode instanceof HTMLInputElement
    ? fieldNode.closest(".kapsula-popup-form__field")
    : null;

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

function clearPopupFieldErrors(popupFormNode) {
  Object.keys(POPUP_FIELD_ERRORS).forEach((fieldName) => {
    setPopupFieldError(popupFormNode, fieldName);
  });
}

function validatePopupForm(popupFormNode) {
  clearPopupFieldErrors(popupFormNode);

  const payload = getPopupFormPayload(popupFormNode);
  const result = popupContactSchema.safeParse(payload);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  result.error.issues.forEach((issue) => {
    const fieldName = issue.path[0];
    if (typeof fieldName === "string" && fieldName in POPUP_FIELD_ERRORS) {
      setPopupFieldError(popupFormNode, fieldName, issue.message);
    }
  });

  return {
    success: false,
    data: null,
  };
}

export function bindFormPopup(formExperience, hero) {
  const popupNode = document.getElementById(POPUP_ID);

  if (!popupNode || popupNode.dataset.popupBound === "1") {
    return;
  }

  const popupFormNode = popupNode.querySelector("[data-kapsula-popup-form]");

  if (!popupFormNode) {
    return;
  }

  popupNode.dataset.popupBound = "1";
  let boundSubmitButton = null;

  const handleOpenPopup = (event) => {
    event.preventDefault();
    openPopup(popupNode);
  };

  const bindSubmitButton = () => {
    const nextSubmitButton = hero?.querySelector(".kapsula-form__trigger");

    if (!nextSubmitButton || nextSubmitButton === boundSubmitButton) {
      return;
    }

    boundSubmitButton?.removeEventListener("click", handleOpenPopup);
    nextSubmitButton.addEventListener("click", handleOpenPopup);
    boundSubmitButton = nextSubmitButton;
  };

  bindSubmitButton();

  const buttonObserver = new MutationObserver(() => {
    bindSubmitButton();
  });

  if (hero) {
    buttonObserver.observe(hero, {
      childList: true,
      subtree: true,
    });
  }

  popupFormNode.addEventListener("input", (event) => {
    const fieldNode = event.target.closest("input");

    if (!(fieldNode instanceof HTMLInputElement)) {
      return;
    }

    if (fieldNode.name === "phone") {
      fieldNode.value = formatPhoneInput(fieldNode.value);
    }

    if (fieldNode.name in POPUP_FIELD_ERRORS) {
      setPopupFieldError(popupFormNode, fieldNode.name);
    }
  });

  popupFormNode.addEventListener("submit", (event) => {
    event.preventDefault();

    const validationResult = validatePopupForm(popupFormNode);

    if (!validationResult.success) {
      return;
    }

    const snapshot = formExperience.getSnapshot();
    const submittedAt = new Date();
    const payload = {
      ...snapshot.values,
      elite: "Elite",
      submittedAt: formatSubmittedAt(submittedAt),
      pagePath: window.location.pathname,
      contact: {
        name: validationResult.data.name,
        phone: validationResult.data.phone,
      },
    };

    console.log("kapsula form object", payload);
  });
}

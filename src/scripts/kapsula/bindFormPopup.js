import * as z from "zod/mini";
import {reachGoal} from "./analytics.js";
import {destroyEmblaCarousel, syncEmblaCarousel} from "./syncEmblaCarousel.js";
import {bindEmblaDots} from "./syncEmblaDots.js";
import {createPopupHotelsLoader} from "./createPopupHotelsLoader.js";
import {getFormSubmitEndpoint} from "./formSchema.js";
import {sendKapsulaPopupForm} from "./sendKapsulaPopupForm.js";

const POPUP_ID = "coral-popup-kapsula";
const POPUP_FIELD_ERRORS = {
  name: "Введите имя",
  phone: "Введите номер телефона",
  contactMethod: "Выберите способ связи",
};

const popupContactSchema = z.object({
  name: z.string().check(
    z.trim(),
    z.minLength(2, "Введите имя"),
  ),
  phone: z.string().check(
    z.trim(),
    z.refine((value) => value.replace(/\D/g, "").length === 10, {
      error: "Введите номер телефона",
    }),
  ),
  contactMethod: z.enum(["call", "max", "telegram", "whatsapp"], {
    error: "Выберите способ связи",
  }),
});

function openPopup(popupNode) {
  popupNode.show?.();
}

function setPopupState(popupNode, state) {
  const successNode = popupNode.querySelector("[data-kapsula-popup-success]");

  popupNode.dataset.state = state;

  if (successNode instanceof HTMLElement) {
    successNode.hidden = state !== "success";
  }
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

function buildManagerLeadPayload({snapshot, submittedAt, contact}) {
  return {
    format: "html",
    plaintext: "КАПСУЛА",
    lead: {
      capsule: snapshot.capsuleId,
      segment: "Elite",
      submittedAt: formatSubmittedAt(submittedAt),
      name: contact.name,
      phone: `+7 ${contact.phone}`,
      contactMethod: contact.contactMethod,
      ...snapshot.values,
    },
  };
}

function getPopupFormPayload(popupFormNode) {
  return {
    name: popupFormNode.elements.namedItem("name")?.value ?? "",
    phone: popupFormNode.elements.namedItem("phone")?.value ?? "",
    contactMethod: popupFormNode.elements.namedItem("contactMethod")?.value ?? "",
  };
}

function getPopupFieldErrorNode(popupFormNode, fieldName) {
  return popupFormNode.querySelector(`[data-field-error="${fieldName}"]`);
}

function getPopupFieldWrapper(popupFormNode, fieldNode) {
  if (fieldNode instanceof HTMLInputElement) {
    return fieldNode.closest(".kapsula-popup-form__field");
  }

  // Радиогруппа возвращается как RadioNodeList, поэтому берём общий fieldset.
  return popupFormNode.querySelector(".kapsula-popup-form__contact-method");
}

function setPopupFieldError(popupFormNode, fieldName, message = "") {
  const fieldNode = popupFormNode.elements.namedItem(fieldName);
  const errorNode = getPopupFieldErrorNode(popupFormNode, fieldName);
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

function clearPopupFieldErrors(popupFormNode) {
  Object.keys(POPUP_FIELD_ERRORS).forEach((fieldName) => {
    setPopupFieldError(popupFormNode, fieldName);
  });
}

function setPopupSubmitPending(popupFormNode, isPending) {
  const submitButton = popupFormNode.querySelector(".kapsula-popup-form__submit");

  popupFormNode.dataset.pending = isPending ? "true" : "false";
  popupFormNode.setAttribute("aria-busy", isPending ? "true" : "false");

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = isPending;
  }
}

function setPopupSubmitError(popupFormNode, message = "") {
  const errorNode = popupFormNode.querySelector("[data-kapsula-popup-submit-error]");

  if (!(errorNode instanceof HTMLElement)) return;

  errorNode.textContent = message;
  errorNode.hidden = !message;
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
  const homeButtonNode = popupNode.querySelector("[data-kapsula-popup-home]");
  const popupCardsNode = popupNode.querySelector(".kapsula-popup__cards");
  const popupPaginationNode = popupNode.querySelector("[data-kapsula-popup-pagination]");
  const hotelCardTemplateNode = popupNode.querySelector("[data-kapsula-hotel-card-template]");
  const hotelsErrorNode = popupNode.querySelector("[data-kapsula-hotels-error]");

  if (!popupFormNode) {
    return;
  }

  popupNode.dataset.popupBound = "1";
  setPopupState(popupNode, "form");
  const popupCardsCarousel = syncEmblaCarousel(popupCardsNode, {
    align: "start",
    containScroll: "trimSnaps",
  });
  bindEmblaDots(popupPaginationNode, popupCardsCarousel, {
    label: "Перейти к карточке",
  });
  const popupHotelsLoader = createPopupHotelsLoader({
    cardsNode: popupCardsNode,
    errorNode: hotelsErrorNode,
    templateNode: hotelCardTemplateNode,
    onUpdate() {
      popupCardsCarousel?.reInit();
    },
  });
  let boundSubmitButton = null;
  let isSubmitting = false;
  let isFormValidationVisible = false;

  const handleOpenPopup = (event) => {
    event.preventDefault();

    reachGoal("capsule_4_screen_form_a_capsule");

    const validationResult = formExperience.validate?.();

    if (validationResult && !validationResult.success) {
      isFormValidationVisible = true;
      formExperience.showValidationErrors?.(validationResult);
      return;
    }

    isFormValidationVisible = false;
    formExperience.showValidationErrors?.(validationResult);
    const snapshot = formExperience.getSnapshot();

    popupHotelsLoader.load(snapshot.values.countries);
    setPopupState(popupNode, "form");
    setPopupSubmitError(popupFormNode);
    openPopup(popupNode);
    window.requestAnimationFrame(() => {
      popupCardsCarousel?.reInit();
    });
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

  const handleFormChange = (event) => {
    if (
      !isFormValidationVisible ||
      !(event.target instanceof Element) ||
      !event.target.closest("[data-kapsula-form]")
    ) {
      return;
    }

    const validationResult = formExperience.validate?.();

    formExperience.showValidationErrors?.(validationResult);

    if (validationResult?.success) {
      isFormValidationVisible = false;
    }
  };

  const handleInput = (event) => {
    if (!(event.target instanceof Element)) return;
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationResult = validatePopupForm(popupFormNode);

    if (!validationResult.success) {
      return;
    }

    setPopupSubmitError(popupFormNode);

    const snapshot = formExperience.getSnapshot();
    const submittedAt = new Date();
    const payload = buildManagerLeadPayload({
      snapshot,
      submittedAt,
      contact: validationResult.data,
    });

    try {
      isSubmitting = true;
      setPopupSubmitPending(popupFormNode, true);
      await sendKapsulaPopupForm(payload, getFormSubmitEndpoint());
      setPopupState(popupNode, "success");
      reachGoal("capsule_pop_up_final_show");
    } catch (error) {
      console.error("Failed to submit kapsula popup form", error);
      setPopupSubmitError(
        popupFormNode,
        "Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.",
      );
    } finally {
      isSubmitting = false;
      setPopupSubmitPending(popupFormNode, false);
    }
  };

  const handlePopupFieldChange = (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;

    if (event.target.name in POPUP_FIELD_ERRORS) {
      setPopupFieldError(popupFormNode, event.target.name);
    }
  };

  const handleHome = () => {
    window.location.assign(window.location.pathname);
  };

  popupFormNode.addEventListener("input", handleInput);
  popupFormNode.addEventListener("change", handlePopupFieldChange);
  popupFormNode.addEventListener("submit", handleSubmit);
  homeButtonNode?.addEventListener("click", handleHome);
  hero?.addEventListener("change", handleFormChange);

  return () => {
    buttonObserver.disconnect();
    boundSubmitButton?.removeEventListener("click", handleOpenPopup);
    popupFormNode.removeEventListener("input", handleInput);
    popupFormNode.removeEventListener("change", handlePopupFieldChange);
    popupFormNode.removeEventListener("submit", handleSubmit);
    homeButtonNode?.removeEventListener("click", handleHome);
    hero?.removeEventListener("change", handleFormChange);
    popupHotelsLoader.destroy();
    destroyEmblaCarousel(popupCardsNode);
    delete popupNode.dataset.popupBound;
  };
}

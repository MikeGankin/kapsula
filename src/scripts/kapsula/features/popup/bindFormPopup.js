import {reachGoal} from "../../shared/analytics.js";
import {destroyEmblaCarousel, syncEmblaCarousel} from "../../shared/carousel/syncEmblaCarousel.js";
import {bindEmblaDots} from "../../shared/carousel/syncEmblaDots.js";
import {createPopupHotelsLoader} from "./hotels/createPopupHotelsLoader.js";
import {
  getFormSubmitEndpoint,
  getHotelsSettings,
  getMailSubject,
  getMailTo,
  isFieldRendered,
} from "../form/schema/formSchema.js";
import {logDebug, logError} from "../../shared/logger.js";
import {sendKapsulaPopupForm} from "./sendKapsulaPopupForm.js";
import {
  clearPopupFieldErrors,
  formatPhoneInput,
  POPUP_FIELD_ERRORS,
  setPopupFieldError,
  renderPopupContactField,
  syncPopupFieldRendering,
  setPopupSubmitError,
  setPopupSubmitPending,
  validatePopupForm,
} from "./contact/popupContactForm.js";
import {buildManagerLeadPayload} from "./contact/popupLeadPayload.js";

const POPUP_ID = "coral-popup-kapsula";
const SUBMIT_TRIGGER_SELECTOR = ".kapsula-form__trigger";
const SUBMIT_ERROR_MESSAGE =
  "Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.";

function setPopupState(popupNode, state) {
  const successNode = popupNode.querySelector("[data-kapsula-popup-success]");

  popupNode.dataset.state = state;

  if (successNode instanceof HTMLElement) {
    successNode.hidden = state !== "success";
  }
}

export function bindFormPopup(formExperience, hero) {
  const popupNode = document.getElementById(POPUP_ID);

  if (!popupNode || popupNode.dataset.popupBound === "1") {
    return () => {};
  }

  const popupFormNode = popupNode.querySelector("[data-kapsula-popup-form]");

  if (!popupFormNode) {
    return () => {};
  }

  const homeButtonNode = popupNode.querySelector("[data-kapsula-popup-home]");
  const popupCardsNode = popupNode.querySelector(".kapsula-popup__cards");
  const popupPaginationNode = popupNode.querySelector("[data-kapsula-popup-pagination]");
  const hotelCardTemplateNode = popupNode.querySelector("[data-kapsula-hotel-card-template]");
  const hotelsErrorNode = popupNode.querySelector("[data-kapsula-hotels-error]");
  const hotelsAsideNode = popupNode.querySelector("[data-kapsula-popup-hotels]");
  const shouldRenderHotels = isFieldRendered(getHotelsSettings());

  if (hotelsAsideNode instanceof HTMLElement) {
    hotelsAsideNode.hidden = !shouldRenderHotels;
  }

  popupNode.dataset.popupBound = "1";
  setPopupState(popupNode, "form");
  syncPopupFieldRendering(popupFormNode);
  renderPopupContactField(popupFormNode);
  clearPopupFieldErrors(popupFormNode);

  const popupCardsCarousel = shouldRenderHotels
    ? syncEmblaCarousel(popupCardsNode, {
      align: "start",
      containScroll: "trimSnaps",
    })
    : null;
  const unbindPopupDots = shouldRenderHotels
    ? bindEmblaDots(popupPaginationNode, popupCardsCarousel, {
      label: "Перейти к карточке",
    })
    : () => {};

  const popupHotelsLoader = shouldRenderHotels
    ? createPopupHotelsLoader({
      cardsNode: popupCardsNode,
      errorNode: hotelsErrorNode,
      templateNode: hotelCardTemplateNode,
      onUpdate() {
        popupCardsCarousel?.reInit();
      },
    })
    : null;

  let isSubmitting = false;
  let isFormValidationVisible = false;

  const openPopup = () => {
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

    popupHotelsLoader?.load(snapshot.values.countries);
    setPopupState(popupNode, "form");
    setPopupSubmitError(popupFormNode);
    popupNode.show?.();
    window.requestAnimationFrame(() => {
      popupCardsCarousel?.reInit();
    });
  };

  // Делегирование вместо MutationObserver: кнопка статична в разметке,
  // а наблюдатель срабатывал на каждом ре-рендере формы.
  const handleHeroClick = (event) => {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest(SUBMIT_TRIGGER_SELECTOR)) return;

    event.preventDefault();
    openPopup();
  };

  const handleHeroChange = (event) => {
    if (
      !isFormValidationVisible
      || !(event.target instanceof Element)
      || !event.target.closest("[data-kapsula-form]")
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
    const fieldNode = event.target;

    if (!(fieldNode instanceof HTMLInputElement)) return;

    if (fieldNode.name === "phone") {
      fieldNode.value = formatPhoneInput(fieldNode.value);
    }

    if (fieldNode.name in POPUP_FIELD_ERRORS) {
      setPopupFieldError(popupFormNode, fieldNode.name);
    }
  };

  const handleFieldChange = (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;

    // Смена способа связи перерисовывает поле контакта: телефон или почта.
    if (event.target.name === "contactMethod") {
      renderPopupContactField(popupFormNode);
    }

    if (event.target.name in POPUP_FIELD_ERRORS) {
      setPopupFieldError(popupFormNode, event.target.name);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const validationResult = validatePopupForm(popupFormNode);

    if (!validationResult.success) return;

    setPopupSubmitError(popupFormNode);

    const payload = buildManagerLeadPayload({
      snapshot: formExperience.getSnapshot(),
      submittedAt: new Date(),
      contact: validationResult.data,
      subject: getMailSubject(),
      to: getMailTo(),
    });

    // Тело запроса ровно в том виде, в каком уходит менеджеру на почту.
    logDebug("payload заявки (уходит на почту)", payload);

    try {
      isSubmitting = true;
      setPopupSubmitPending(popupFormNode, true);
      const submitResponse = await sendKapsulaPopupForm(payload, getFormSubmitEndpoint());

      logDebug("ответ на отправку заявки", submitResponse);

      setPopupState(popupNode, "success");
      reachGoal("capsule_pop_up_final_show");
    } catch (error) {
      logError("отправка формы попапа не удалась", error);
      setPopupSubmitError(popupFormNode, SUBMIT_ERROR_MESSAGE);
    } finally {
      isSubmitting = false;
      setPopupSubmitPending(popupFormNode, false);
    }
  };

  const handleHome = () => {
    window.location.assign(window.location.pathname);
  };

  popupFormNode.addEventListener("input", handleInput);
  popupFormNode.addEventListener("change", handleFieldChange);
  popupFormNode.addEventListener("submit", handleSubmit);
  homeButtonNode?.addEventListener("click", handleHome);
  hero?.addEventListener("click", handleHeroClick);
  hero?.addEventListener("change", handleHeroChange);

  return () => {
    popupFormNode.removeEventListener("input", handleInput);
    popupFormNode.removeEventListener("change", handleFieldChange);
    popupFormNode.removeEventListener("submit", handleSubmit);
    homeButtonNode?.removeEventListener("click", handleHome);
    hero?.removeEventListener("click", handleHeroClick);
    hero?.removeEventListener("change", handleHeroChange);
    popupHotelsLoader?.destroy();
    unbindPopupDots();
    destroyEmblaCarousel(popupCardsNode);
    delete popupNode.dataset.popupBound;
  };
}

import {EMAIL_CONTACT_METHOD} from "./popupContactForm.js";
import {filterRenderedFields, getPopupFields} from "../formSchema.js";

function formatSubmittedAt(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * `subject` и `to` берём из конфига и отправляем явно. Ручка
 * `manager-lead-mail` умеет их принимать, но при отсутствии подставляет свои
 * дефолты — из-за этого смена темы письма или адреса получателя раньше
 * требовала правок на бэке.
 */
export function buildManagerLeadPayload({
  snapshot,
  submittedAt,
  contact,
  subject,
  to,
  popupFields = getPopupFields(),
}) {
  const renderedContact = filterRenderedFields(contact, popupFields);
  const isEmailMethod = renderedContact.contactMethod === EMAIL_CONTACT_METHOD;

  return {
    subject,
    to,
    format: "html",
    plaintext: "КАПСУЛА",
    lead: {
      capsule: snapshot.capsuleId,
      segment: "Elite",
      submittedAt: formatSubmittedAt(submittedAt),
      ...(renderedContact.name === undefined ? {} : {name: renderedContact.name}),
      // Менеджеру нужен ровно тот контакт, который оставил пользователь:
      // при выборе «Email» телефона нет, и наоборот.
      ...(isEmailMethod && renderedContact.email !== undefined
        ? {email: renderedContact.email}
        : {}),
      ...(!isEmailMethod && renderedContact.phone !== undefinedы
        ? {phone: `+7 ${renderedContact.phone}`}
        : {}),
      ...(renderedContact.contactMethod === undefined
        ? {}
        : {contactMethod: renderedContact.contactMethod}),
      ...snapshot.values,
    },
  };
}

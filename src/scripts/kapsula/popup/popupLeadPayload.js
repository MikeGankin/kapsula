import {EMAIL_CONTACT_METHOD} from "./popupContactForm.js";

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
export function buildManagerLeadPayload({snapshot, submittedAt, contact, subject, to}) {
  const isEmailMethod = contact.contactMethod === EMAIL_CONTACT_METHOD;

  return {
    subject,
    to,
    format: "html",
    plaintext: "КАПСУЛА",
    lead: {
      capsule: snapshot.capsuleId,
      segment: "Elite",
      submittedAt: formatSubmittedAt(submittedAt),
      name: contact.name,
      // Менеджеру нужен ровно тот контакт, который оставил пользователь:
      // при выборе «Email» телефона нет, и наоборот.
      ...(isEmailMethod
        ? {email: contact.email}
        : {phone: `+7 ${contact.phone}`}),
      contactMethod: contact.contactMethod,
      ...snapshot.values,
    },
  };
}

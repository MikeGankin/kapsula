import {buildManagerLeadPayload} from "./popupLeadPayload.js";

/**
 * Payload уходит менеджеру письмом. Ошибка здесь не видна ни в интерфейсе,
 * ни в консоли: лид просто приходит без контакта или с чужим адресом
 * получателя, и потерю замечают уже по отсутствию звонка клиенту.
 */

const snapshot = {
  capsuleId: "island",
  values: {style: "boho", trip: "rest"},
};

const submittedAt = new Date(2026, 0, 5, 9, 7);

const allPopupFieldsRendered = {
  contactMethod: {render: true},
  name: {render: true},
  phone: {render: true},
  email: {render: true},
};

function buildPayload(contact, popupFields = allPopupFieldsRendered) {
  return buildManagerLeadPayload({
    snapshot,
    submittedAt,
    contact,
    subject: "Заявка КАПСУЛА",
    to: "manager@coral.ru",
    popupFields,
  });
}

describe("buildManagerLeadPayload", () => {
  it("шлёт телефон с кодом страны, когда выбран способ связи звонком", () => {
    const payload = buildPayload({
      name: "Иван",
      phone: "999 123-45-67",
      email: "",
      contactMethod: "call",
    });

    expect(payload.lead.phone).toBe("+7 999 123-45-67");
    expect(payload.lead.email).toBeUndefined();
  });

  it("шлёт только почту при способе связи «email»", () => {
    // Телефона в этом сценарии пользователь не вводил — в лид он попасть не должен.
    const payload = buildPayload({
      name: "Иван",
      phone: "",
      email: "ivan@example.com",
      contactMethod: "email",
    });

    expect(payload.lead.email).toBe("ivan@example.com");
    expect(payload.lead.phone).toBeUndefined();
  });

  it("берёт тему письма и получателя из конфига, а не из дефолтов бэка", () => {
    const payload = buildPayload({name: "Иван", phone: "999 123-45-67", contactMethod: "call"});

    expect(payload.subject).toBe("Заявка КАПСУЛА");
    expect(payload.to).toBe("manager@coral.ru");
  });

  it("форматирует дату как ДД.ММ.ГГГГ ЧЧ:ММ с ведущими нулями", () => {
    const payload = buildPayload({name: "Иван", phone: "999 123-45-67", contactMethod: "call"});

    expect(payload.lead.submittedAt).toBe("05.01.2026 09:07");
  });

  it("переносит в лид ответы формы вместе с капсулой", () => {
    const payload = buildPayload({name: "Иван", phone: "999 123-45-67", contactMethod: "call"});

    expect(payload.lead.capsule).toBe("island");
    expect(payload.lead.style).toBe("boho");
    expect(payload.lead.trip).toBe("rest");
  });

  it("не включает в лид поля с render: false", () => {
    const payload = buildPayload(
      {
        name: "Иван",
        phone: "999 123-45-67",
        email: "ivan@example.com",
        contactMethod: "call",
      },
      {...allPopupFieldsRendered, email: {render: false}},
    );

    expect(payload.lead.email).toBeUndefined();
    expect(payload.lead.phone).toBe("+7 999 123-45-67");
  });
});

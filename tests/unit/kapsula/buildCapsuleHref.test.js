// @vitest-environment jsdom
/* global window */

import {buildCapsuleHref} from "../../../src/scripts/kapsula/buildCapsuleHref.js";

/**
 * Ссылка на карточке стиля должна открывать форму нужной капсулы и при этом
 * сохранять остальные параметры URL — в них приходят utm-метки, по которым
 * считается эффективность трафика.
 */

describe("buildCapsuleHref", () => {
  it("добавляет screen и capsule к текущему адресу", () => {
    window.history.replaceState({}, "", "/elite/kapsula");

    expect(buildCapsuleHref("island")).toBe("/elite/kapsula?screen=form&capsule=island");
  });

  it("сохраняет уже имеющиеся query-параметры", () => {
    window.history.replaceState({}, "", "/elite/kapsula?utm_source=mail");

    const href = buildCapsuleHref("asia");

    expect(href).toContain("utm_source=mail");
    expect(href).toContain("capsule=asia");
  });

  it("перезаписывает капсулу, выбранную ранее", () => {
    window.history.replaceState({}, "", "/elite/kapsula?screen=form&capsule=island");

    expect(buildCapsuleHref("oriental")).toBe("/elite/kapsula?screen=form&capsule=oriental");
  });

  it("возвращает якорь-заглушку без идентификатора капсулы", () => {
    // Атрибут data-kapsula-capsule может отсутствовать в разметке блока.
    expect(buildCapsuleHref("")).toBe("#");
    expect(buildCapsuleHref(undefined)).toBe("#");
  });
});

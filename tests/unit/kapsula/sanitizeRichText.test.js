// @vitest-environment jsdom
/* global document, window */

import {sanitizeRichText} from "../../../src/scripts/kapsula/features/form/sanitizeRichText.js";

/**
 * Санитайзер — граница доверия: тексты приходят из formConfig.json, который
 * правят руками. Ошибка тут либо показывает пользователю сырую разметку,
 * либо, наоборот, пропускает в DOM исполняемый код.
 */

function render(value) {
  const host = document.createElement("p");
  host.append(...sanitizeRichText(value));

  return host;
}

describe("sanitizeRichText", () => {
  it("превращает <br> в реальный перенос строки", () => {
    const host = render("Первая строка<br>вторая строка");

    expect(host.querySelectorAll("br")).toHaveLength(1);
    expect(host.textContent).toBe("Первая строкавторая строка");
  });

  it("понимает все написания тега переноса", () => {
    // Контент-менеджер напишет как привык — придираться к регистру и слешу глупо.
    expect(render("a<br>b<BR>c<br/>d<br />e").querySelectorAll("br")).toHaveLength(4);
  });

  it("раскрывает неразрывный пробел", () => {
    const host = render("её&nbsp;тем");

    // Именно U+00A0, а не обычный пробел: ради него сущность и ставят.
    expect(host.textContent).toBe("её\u00a0тем");
  });

  it("раскрывает типографские сущности", () => {
    expect(render("Coral&mdash;Travel").textContent).toBe("Coral\u2014Travel");
    expect(render("&laquo;Капсула&raquo;").textContent).toBe("«Капсула»");
  });

  it("не выполняет скрипт из конфига", () => {
    const host = render('<script>window.xssExecuted = true;</script>');

    expect(host.querySelector("script")).toBeNull();
    expect(window.xssExecuted).toBeUndefined();
    // Опасный тег остаётся видимым текстом — это заметят при вычитке.
    expect(host.textContent).toContain("<script>");
  });

  it("не пропускает картинку с обработчиком onerror", () => {
    // Классический вектор XSS: тег без скрипта, но с исполняемым атрибутом.
    const host = render('<img src="x" onerror="window.xssExecuted = true">');

    expect(host.querySelector("img")).toBeNull();
    expect(window.xssExecuted).toBeUndefined();
  });

  it("не пропускает разметку, собранную вокруг разрешённого тега", () => {
    const host = render('<span onclick="alert(1)">клик</span><br>ок');

    expect(host.querySelector("span")).toBeNull();
    expect(host.querySelectorAll("br")).toHaveLength(1);
  });

  it("оставляет обычный текст нетронутым", () => {
    const text = "Ваша капсула отдыха почти готова.";

    expect(render(text).textContent).toBe(text);
  });

  it("не падает на пустом значении", () => {
    expect(sanitizeRichText("")).toEqual([]);
    expect(sanitizeRichText(null)).toEqual([]);
    expect(sanitizeRichText(undefined)).toEqual([]);
  });

  it("не плодит пустые текстовые узлы вокруг переноса", () => {
    // `a<br>b` — это ровно три узла, а не пять с пустышками между ними.
    expect(sanitizeRichText("a<br>b")).toHaveLength(3);
    expect(sanitizeRichText("<br>")).toHaveLength(1);
  });
});

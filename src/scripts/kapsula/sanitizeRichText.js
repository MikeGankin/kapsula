/**
 * Ограниченная разметка в текстах из `formConfig.json`.
 *
 * Контент-менеджеру нужны переносы (`<br>`) и неразрывные пробелы (`&nbsp;`),
 * но подставлять строку из конфига в `innerHTML` как есть нельзя: файл правят
 * руками, и любой `<script>` или `<img onerror=...>` оттуда выполнится
 * в браузере пользователя.
 *
 * Поэтому строка разбирается вручную: из всей разметки признаётся только
 * `<br>`, остальное остаётся текстом. Результат — готовые DOM-узлы, а не
 * строка, так что вставить их можно без `innerHTML`.
 */

/**
 * Сущности, которые имеет смысл писать в конфиге. Список намеренно короткий:
 * всё, что сюда не входит, останется видимым текстом — это заметят при первой
 * же вычитке, в отличие от молча проглоченной разметки.
 */
const NAMED_ENTITIES = {
  "&nbsp;": "\u00a0",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&mdash;": "\u2014",
  "&ndash;": "\u2013",
  "&laquo;": "\u00ab",
  "&raquo;": "\u00bb",
  "&hellip;": "\u2026",
};

const ENTITY_PATTERN = new RegExp(Object.keys(NAMED_ENTITIES).join("|"), "g");

// Только сам тег переноса, в любом написании: <br>, <BR>, <br/>, <br />.
const LINE_BREAK_PATTERN = /<br\s*\/?>/gi;

function decodeEntities(text) {
  return text.replace(ENTITY_PATTERN, (entity) => NAMED_ENTITIES[entity]);
}

/**
 * Возвращает массив DOM-узлов: текст с раскрытыми сущностями и элементы `<br>`.
 *
 * Именно узлы, а не строку — вызывающий код добавляет их через `append`,
 * и путь «строка → innerHTML», на котором и случается XSS, просто отсутствует.
 */
export function sanitizeRichText(value) {
  const source = String(value ?? "");

  if (!source) {
    return [];
  }

  return source
    .split(LINE_BREAK_PATTERN)
    .flatMap((chunk, index) => {
      const nodes = index === 0 ? [] : [document.createElement("br")];

      // Пустые куски отбрасываем: иначе `a<br>b` дал бы лишний текстовый узел.
      if (chunk) {
        nodes.push(document.createTextNode(decodeEntities(chunk)));
      }

      return nodes;
    });
}

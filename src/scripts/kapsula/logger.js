/**
 * Единая точка диагностики.
 *
 * В проде предупреждения и отладочные сообщения не нужны — блок встраивается
 * в чужой сайт, и шум в консоли хоста мешает. Ошибки логируются всегда:
 * они означают сломанный сценарий, а не «что-то не нашлось».
 */

const LOG_PREFIX = "[kapsula]";

function isDebugEnabled() {
  try {
    return (
      import.meta.env?.DEV === true ||
      window.localStorage?.getItem("kapsula.debug") === "1"
    );
  } catch {
    return false;
  }
}

export function logWarning(message, ...details) {
  if (!isDebugEnabled()) {
    return;
  }

  console.warn(`${LOG_PREFIX} ${message}`, ...details);
}

/**
 * Вывод данных для отладки: ответы API, payload-ы форм.
 *
 * Молчит в проде — в консоль хоста не должно попадать ничего лишнего,
 * тем более содержимое лида. Чтобы включить на боевой странице,
 * выполните `localStorage.setItem("kapsula.debug", "1")` и перезагрузите её.
 */
export function logDebug(message, data) {
  if (!isDebugEnabled()) {
    return;
  }

  console.groupCollapsed(`${LOG_PREFIX} ${message}`);
  console.log(data);
  console.groupEnd();
}

export function logError(message, ...details) {
  console.error(`${LOG_PREFIX} ${message}`, ...details);
}

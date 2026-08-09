import {SESSION_STORAGE_KEYS, URL_SEARCH_KEYS} from "./constants.js";

const RESTORABLE_SCREENS = new Set(["hero", "steps", "styles", "form"]);

function readSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function readUrlValue(key) {
  try {
    const url = new URL(window.location.href);

    return url.searchParams.get(key);
  } catch {
    return null;
  }
}

function writeUrlState({screen, capsuleId}) {
  try {
    const url = new URL(window.location.href);

    if (RESTORABLE_SCREENS.has(screen)) {
      url.searchParams.set(URL_SEARCH_KEYS.screen, screen);
    } else {
      url.searchParams.delete(URL_SEARCH_KEYS.screen);
    }

    if (capsuleId) {
      url.searchParams.set(URL_SEARCH_KEYS.capsule, capsuleId);
    } else {
      url.searchParams.delete(URL_SEARCH_KEYS.capsule);
    }

    window.history.replaceState(window.history.state, "", url);
  } catch {
    // URL state can be unavailable in restricted browser contexts.
  }
}

export function readCurrentScreen() {
  const urlScreen = readUrlValue(URL_SEARCH_KEYS.screen);

  if (RESTORABLE_SCREENS.has(urlScreen)) {
    return urlScreen;
  }

  const screen = readSessionValue(SESSION_STORAGE_KEYS.screen);

  return RESTORABLE_SCREENS.has(screen) ? screen : null;
}

export function saveCurrentScreen(screen) {
  if (!RESTORABLE_SCREENS.has(screen)) return;

  writeSessionValue(SESSION_STORAGE_KEYS.screen, screen);
  writeUrlState({
    screen,
    capsuleId: readSelectedCapsule(),
  });
}

export function readSelectedCapsule() {
  return readUrlValue(URL_SEARCH_KEYS.capsule) ?? readSessionValue(SESSION_STORAGE_KEYS.capsule);
}

export function saveSelectedCapsule(capsuleId) {
  writeSessionValue(SESSION_STORAGE_KEYS.capsule, capsuleId);
  writeUrlState({
    screen: readCurrentScreen(),
    capsuleId,
  });
}

export function readSavedActiveSection(capsuleId) {
  if (!capsuleId) {
    return null;
  }

  return readSessionValue(`${SESSION_STORAGE_KEYS.activeSectionPrefix}.${capsuleId}`);
}

export function saveActiveSection(capsuleId, sectionId) {
  if (!capsuleId || !sectionId) {
    return;
  }

  writeSessionValue(`${SESSION_STORAGE_KEYS.activeSectionPrefix}.${capsuleId}`, sectionId);
}

/**
 * Значения от предыдущей версии схемы: и «плоский» ключ `kapsula.formValues`
 * с картой всех капсул, и разбитый по капсулам `kapsula.formValues.<id>`.
 * Читаем их один раз, чтобы пользователь не потерял заполненную форму,
 * но не сохраняем обратно — дальше живёт только актуальная версия.
 */
function readLegacyFormValues(capsuleId) {
  const legacyCapsuleKey = `${SESSION_STORAGE_KEYS.legacyFormValues}.${capsuleId}`;
  const legacyCapsuleValue = readSessionValue(legacyCapsuleKey);

  if (legacyCapsuleValue) {
    return JSON.parse(legacyCapsuleValue);
  }

  const rawValue = readSessionValue(SESSION_STORAGE_KEYS.legacyFormValues);

  return rawValue ? JSON.parse(rawValue)?.[capsuleId] ?? null : null;
}

export function readSavedFormValues(capsuleId) {
  if (!capsuleId) {
    return null;
  }

  try {
    const capsuleStorageKey = `${SESSION_STORAGE_KEYS.formValuesPrefix}.${capsuleId}`;
    const capsuleValue = readSessionValue(capsuleStorageKey);

    if (capsuleValue) {
      return JSON.parse(capsuleValue);
    }

    const legacyValues = readLegacyFormValues(capsuleId);

    if (legacyValues) {
      writeSessionValue(capsuleStorageKey, JSON.stringify(legacyValues));
    }

    return legacyValues;
  } catch {
    return null;
  }
}

export function saveFormValues(capsuleId, values) {
  if (!capsuleId) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      `${SESSION_STORAGE_KEYS.formValuesPrefix}.${capsuleId}`,
      JSON.stringify(values),
    );
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

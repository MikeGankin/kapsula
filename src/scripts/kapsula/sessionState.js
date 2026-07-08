const SESSION_STORAGE_KEYS = {
  screen: "kapsula.currentScreen",
  capsule: "kapsula.selectedCapsule",
};
const URL_SEARCH_KEYS = {
  screen: "screen",
  capsule: "capsule",
};
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

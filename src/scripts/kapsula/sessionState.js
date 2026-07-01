const SESSION_STORAGE_KEYS = {
  screen: "kapsula.currentScreen",
  capsule: "kapsula.selectedCapsule",
};
const RESTORABLE_SCREENS = new Set(["steps", "styles", "form"]);

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

export function readCurrentScreen() {
  const screen = readSessionValue(SESSION_STORAGE_KEYS.screen);

  return RESTORABLE_SCREENS.has(screen) ? screen : null;
}

export function saveCurrentScreen(screen) {
  if (!RESTORABLE_SCREENS.has(screen)) return;

  writeSessionValue(SESSION_STORAGE_KEYS.screen, screen);
}

export function readSelectedCapsule() {
  return readSessionValue(SESSION_STORAGE_KEYS.capsule);
}

export function saveSelectedCapsule(capsuleId) {
  writeSessionValue(SESSION_STORAGE_KEYS.capsule, capsuleId);
}

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "studyai:theme";

/**
 * StudyAI ships on the deep-navy canvas, so dark is the default. A student can
 * switch to light from settings; the choice is remembered on this device.
 */
export function getStoredTheme(): ThemeMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode: the preference just will not persist */
  }
}

export function readTheme(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    /* fall through to the default */
  }
  return "dark";
}

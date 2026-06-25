// Theme persistence. The actual <html data-theme> is set by an inline script in
// the HTML <head> (before paint, to avoid a flash) — this module just reads and
// updates it at runtime.
const KEY = "wavelytics-theme";

export function getTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function setTheme(theme) {
  const t = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
  return t;
}

export function toggleTheme() {
  return setTheme(getTheme() === "dark" ? "light" : "dark");
}

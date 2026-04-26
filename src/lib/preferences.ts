export type ThemePreference = "dark" | "light";

export const themePreferenceKey = "roradar.theme";
export const reducedMotionPreferenceKey = "roradar.reduced-motion";
export const wideWebSearchPreferenceKey = "roradar.wide-web-search";
export const preferencesChangeEventName = "roradar-preferences-change";

export function getPreferencesBootstrapScript() {
  return `
    (function () {
      try {
        var root = document.documentElement;
        var storedTheme = window.localStorage.getItem("${themePreferenceKey}");
        var storedMotion = window.localStorage.getItem("${reducedMotionPreferenceKey}");
        var theme = storedTheme === "light" ? "light" : "dark";
        var reducedMotion = storedMotion === "true";

        root.classList.remove("light", "dark");
        root.classList.add(theme);
        root.classList.toggle("reduce-motion", reducedMotion);
        root.dataset.theme = theme;
        root.dataset.motion = reducedMotion ? "reduced" : "default";
        root.style.colorScheme = theme;
      } catch (error) {
        document.documentElement.classList.add("dark");
        document.documentElement.dataset.theme = "dark";
        document.documentElement.dataset.motion = "default";
        document.documentElement.style.colorScheme = "dark";
      }
    })();
  `;
}

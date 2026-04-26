"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  preferencesChangeEventName,
  reducedMotionPreferenceKey,
  themePreferenceKey,
  type ThemePreference,
} from "@/lib/preferences";

type PreferencesContextValue = {
  theme: ThemePreference;
  reducedMotion: boolean;
  setTheme: (theme: ThemePreference) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  resetPreferences: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const defaultPreferencesSnapshot = {
  theme: "dark" as ThemePreference,
  reducedMotion: false,
};

let cachedTheme = defaultPreferencesSnapshot.theme;
let cachedReducedMotion = defaultPreferencesSnapshot.reducedMotion;
let cachedSnapshot = defaultPreferencesSnapshot;

function applyPreferences(theme: ThemePreference, reducedMotion: boolean) {
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.classList.toggle("reduce-motion", reducedMotion);
  root.dataset.theme = theme;
  root.dataset.motion = reducedMotion ? "reduced" : "default";
  root.style.colorScheme = theme;
}

function readPreferencesSnapshot() {
  if (typeof window === "undefined") {
    return defaultPreferencesSnapshot;
  }

  const nextTheme =
    window.localStorage.getItem(themePreferenceKey) === "light" ? "light" : "dark";
  const nextReducedMotion =
    window.localStorage.getItem(reducedMotionPreferenceKey) === "true";

  if (nextTheme === cachedTheme && nextReducedMotion === cachedReducedMotion) {
    return cachedSnapshot;
  }

  cachedTheme = nextTheme;
  cachedReducedMotion = nextReducedMotion;
  cachedSnapshot = {
    theme: nextTheme,
    reducedMotion: nextReducedMotion,
  };

  return cachedSnapshot;
}

function subscribeToPreferences(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(preferencesChangeEventName, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(preferencesChangeEventName, onStoreChange);
  };
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { theme, reducedMotion } = useSyncExternalStore(
    subscribeToPreferences,
    readPreferencesSnapshot,
    () => defaultPreferencesSnapshot,
  );

  useEffect(() => {
    applyPreferences(theme, reducedMotion);
  }, [theme, reducedMotion]);

  function setTheme(nextTheme: ThemePreference) {
    window.localStorage.setItem(themePreferenceKey, nextTheme);
    applyPreferences(nextTheme, reducedMotion);
    window.dispatchEvent(new Event(preferencesChangeEventName));
  }

  function setReducedMotion(nextReducedMotion: boolean) {
    window.localStorage.setItem(
      reducedMotionPreferenceKey,
      String(nextReducedMotion),
    );
    applyPreferences(theme, nextReducedMotion);
    window.dispatchEvent(new Event(preferencesChangeEventName));
  }

  function resetPreferences() {
    window.localStorage.removeItem(themePreferenceKey);
    window.localStorage.removeItem(reducedMotionPreferenceKey);
    applyPreferences("dark", false);
    window.dispatchEvent(new Event(preferencesChangeEventName));
  }

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        reducedMotion,
        setTheme,
        setReducedMotion,
        resetPreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider.");
  }

  return context;
}

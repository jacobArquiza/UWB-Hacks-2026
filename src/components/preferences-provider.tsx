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
  wideWebSearchPreferenceKey,
  type ThemePreference,
} from "@/lib/preferences";

type PreferencesContextValue = {
  theme: ThemePreference;
  reducedMotion: boolean;
  wideWebSearchEnabled: boolean;
  setTheme: (theme: ThemePreference) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setWideWebSearchEnabled: (wideWebSearchEnabled: boolean) => void;
  resetPreferences: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const defaultPreferencesSnapshot = {
  theme: "dark" as ThemePreference,
  reducedMotion: false,
  wideWebSearchEnabled: true,
};

let cachedTheme = defaultPreferencesSnapshot.theme;
let cachedReducedMotion = defaultPreferencesSnapshot.reducedMotion;
let cachedWideWebSearchEnabled = defaultPreferencesSnapshot.wideWebSearchEnabled;
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
  const nextWideWebSearchEnabled =
    window.localStorage.getItem(wideWebSearchPreferenceKey) !== "false";

  if (
    nextTheme === cachedTheme &&
    nextReducedMotion === cachedReducedMotion &&
    nextWideWebSearchEnabled === cachedWideWebSearchEnabled
  ) {
    return cachedSnapshot;
  }

  cachedTheme = nextTheme;
  cachedReducedMotion = nextReducedMotion;
  cachedWideWebSearchEnabled = nextWideWebSearchEnabled;
  cachedSnapshot = {
    theme: nextTheme,
    reducedMotion: nextReducedMotion,
    wideWebSearchEnabled: nextWideWebSearchEnabled,
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
  const { theme, reducedMotion, wideWebSearchEnabled } = useSyncExternalStore(
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

  function setWideWebSearchEnabled(nextWideWebSearchEnabled: boolean) {
    window.localStorage.setItem(
      wideWebSearchPreferenceKey,
      String(nextWideWebSearchEnabled),
    );
    window.dispatchEvent(new Event(preferencesChangeEventName));
  }

  function resetPreferences() {
    window.localStorage.removeItem(themePreferenceKey);
    window.localStorage.removeItem(reducedMotionPreferenceKey);
    window.localStorage.removeItem(wideWebSearchPreferenceKey);
    applyPreferences("dark", false);
    window.dispatchEvent(new Event(preferencesChangeEventName));
  }

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        reducedMotion,
        wideWebSearchEnabled,
        setTheme,
        setReducedMotion,
        setWideWebSearchEnabled,
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

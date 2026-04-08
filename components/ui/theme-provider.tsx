"use client";

import * as React from "react";

type Theme = string;

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  disableTransitionOnChange?: boolean;
  enableColorScheme?: boolean;
  storageKey?: string;
  themes?: Theme[];
};

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
  themes: Theme[];
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function disableTransitionsTemporarily() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important;-webkit-transition:none!important}",
    ),
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    window.setTimeout(() => {
      document.head.removeChild(style);
    }, 1);
  };
}

function applyThemeToDocument(attribute: string, theme: Theme, enableColorScheme: boolean) {
  const root = document.documentElement;
  root.setAttribute(attribute, theme);

  if (enableColorScheme) {
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
  }
}

export function ThemeProvider({
  children,
  attribute = "data-theme",
  defaultTheme = "light",
  disableTransitionOnChange = false,
  enableColorScheme = true,
  storageKey = "theme",
  themes = ["light", "dark"],
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    try {
      return window.localStorage.getItem(storageKey) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const resolvedTheme = themes.includes(theme) ? theme : defaultTheme;

  React.useEffect(() => {
    const cleanup = disableTransitionOnChange ? disableTransitionsTemporarily() : null;
    applyThemeToDocument(attribute, resolvedTheme, enableColorScheme);
    cleanup?.();
  }, [attribute, disableTransitionOnChange, enableColorScheme, resolvedTheme]);

  React.useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== storageKey) {
        return;
      }

      setThemeState(event.newValue || defaultTheme);
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [defaultTheme, storageKey]);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);

      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {}
    },
    [storageKey],
  );

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      themes,
    }),
    [resolvedTheme, setTheme, theme, themes],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}

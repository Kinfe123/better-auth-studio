import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type StudioTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "better-auth-studio-theme";

type ThemeContextValue = {
  theme: StudioTheme;
  setTheme: (theme: StudioTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getConfiguredTheme(): StudioTheme {
  const configuredTheme = (window as any).__STUDIO_CONFIG__?.metadata?.theme;
  return configuredTheme === "light" ? "light" : "dark";
}

function getStoredTheme(): StudioTheme | null {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
  } catch {
    return null;
  }
}

function getInitialTheme(): StudioTheme {
  const domTheme = document.documentElement.dataset.theme;
  if (domTheme === "light" || domTheme === "dark") {
    return domTheme;
  }

  return getStoredTheme() ?? getConfiguredTheme();
}

function applyTheme(theme: StudioTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  root.classList.remove("light", "dark");
  root.classList.add(theme);

  if (document.body) {
    document.body.dataset.theme = theme;
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<StudioTheme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures and still apply the theme for this session.
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

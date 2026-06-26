import { useEffect } from "react";
import type { ThemeMode } from "@/types/settings";
import { useAppStore } from "@/store/useAppStore";

function resolveTheme(theme: ThemeMode) {
  if (theme !== "system") return theme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const theme = useAppStore((state) => state.settings.theme);
  const setSettings = useAppStore((state) => state.setSettings);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      root.classList.toggle("dark", resolveTheme(theme) === "dark");
    };

    apply();

    if (theme !== "system") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);

    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return {
    theme,
    setTheme: (nextTheme: ThemeMode) => setSettings({ theme: nextTheme }),
  };
}

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

const STORAGE_KEY = "app_theme_mode";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && saved) {
          setThemeModeState(saved);
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    };

    loadTheme();
    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  };

  const isDark = themeMode === "dark" || (themeMode === "system" && systemScheme === "dark");

  const theme = useMemo(
    () =>
      isDark
        ? {
            mode: "dark",
            background: "#0B0F14",
            surface: "#111826",
            surfaceSoft: "#0F172A",
            text: "#EAF0FF",
            muted: "rgba(234,240,255,0.68)",
            border: "rgba(255,255,255,0.08)",
            accent: "#FF7A1A",
            statusBar: "#0B0F14",
            statusBarStyle: "light-content",
          }
        : {
            mode: "light",
            background: "#F4F4F4",
            surface: "#FFFFFF",
            surfaceSoft: "#F2F2F2",
            text: "#111111",
            muted: "#666666",
            border: "#E3E3E3",
            accent: "#FF7A1A",
            statusBar: "#F5F5F5",
            statusBarStyle: "dark-content",
          },
    [isDark]
  );

  const value = useMemo(
    () => ({
      ready,
      themeMode,
      setThemeMode,
      isDark,
      theme,
    }),
    [ready, themeMode, isDark, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used inside ThemeProvider");
  }
  return context;
}

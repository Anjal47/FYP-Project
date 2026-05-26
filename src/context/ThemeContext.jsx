import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

const THEME_STORAGE_KEY = "app_theme_mode";
const LANGUAGE_STORAGE_KEY = "app_language";
const NOTIFICATIONS_STORAGE_KEY = "app_notifications_enabled";
const DEFAULT_LANGUAGE = "English";
const SUPPORTED_LANGUAGES = ["English", "Nepali"];
const NEPALI_LABEL = "\u0928\u0947\u092a\u093e\u0932\u0940";
const ENGLISH_NEPALI_LABEL = "\u0905\u0902\u0917\u094d\u0930\u0947\u091c\u0940";
const LEGACY_NEPALI_MOJIBAKE =
  "\u00e0\u00a4\u00a8\u00e0\u00a5\u2021\u00e0\u00a4\u00aa\u00e0\u00a4\u00be\u00e0\u00a4\u00b2\u00e0\u00a5\u0080";
const LEGACY_ENGLISH_MOJIBAKE =
  "\u00e0\u00a4\u2026\u00e0\u00a4\u201a\u00e0\u00a4\u2014\u00e0\u00a5\u008d\u00e0\u00a4\u00b0\u00e0\u00a5\u2021\u00e0\u00a4\u0153\u00e0\u00a5\u0080";
const ThemeContext = createContext(null);

export function normalizeAppLanguage(value) {
  const raw = String(value || "").trim();
  const lowered = raw.toLowerCase();

  if (
    lowered === "nepali" ||
    raw === NEPALI_LABEL ||
    raw === LEGACY_NEPALI_MOJIBAKE
  ) {
    return "Nepali";
  }

  if (
    lowered === "english" ||
    raw === ENGLISH_NEPALI_LABEL ||
    raw === LEGACY_ENGLISH_MOJIBAKE
  ) {
    return "English";
  }

  return DEFAULT_LANGUAGE;
}

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState("system");
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          THEME_STORAGE_KEY,
          LANGUAGE_STORAGE_KEY,
          NOTIFICATIONS_STORAGE_KEY,
        ]);

        if (!mounted) {
          return;
        }

        const savedThemeMode = entries.find(([key]) => key === THEME_STORAGE_KEY)?.[1];
        const savedLanguage = entries.find(([key]) => key === LANGUAGE_STORAGE_KEY)?.[1];
        const savedNotifications = entries.find(
          ([key]) => key === NOTIFICATIONS_STORAGE_KEY
        )?.[1];

        if (savedThemeMode) {
          setThemeModeState(savedThemeMode);
        }

        const normalizedLanguage = savedLanguage
          ? normalizeAppLanguage(savedLanguage)
          : null;

        if (normalizedLanguage && SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
          setLanguageState(normalizedLanguage);

          if (savedLanguage !== normalizedLanguage) {
            AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage).catch(() => {
              // Keep preference loading resilient even if storage migration fails.
            });
          }
        }

        if (savedNotifications !== null && savedNotifications !== undefined) {
          setNotificationsEnabledState(savedNotifications === "true");
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    };

    loadPreferences();
    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const setLanguage = async (nextLanguage) => {
    const safeLanguage = normalizeAppLanguage(nextLanguage);

    setLanguageState(safeLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, safeLanguage);
  };

  const setNotificationsEnabled = async (value) => {
    const nextValue = !!value;
    setNotificationsEnabledState(nextValue);
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, String(nextValue));
  };

  const isDark = themeMode === "dark" || (themeMode === "system" && systemScheme === "dark");

  const theme = useMemo(
    () =>
      isDark
        ? {
            mode: "dark",
            background: "#0A0F17",
            surface: "#101826",
            surfaceSoft: "#172133",
            surfaceElevated: "#1B2740",
            text: "#F7F4EC",
            muted: "rgba(247,244,236,0.68)",
            border: "rgba(255,255,255,0.08)",
            accent: "#FF8A3D",
            accentStrong: "#FF6A13",
            accentSoft: "rgba(255,138,61,0.18)",
            success: "#4ADE80",
            danger: "#FB7185",
            statusBar: "#0A0F17",
            statusBarStyle: "light-content",
          }
        : {
            mode: "light",
            background: "#F6F1E8",
            surface: "#FFFDF9",
            surfaceSoft: "#F3ECE1",
            surfaceElevated: "#FFFFFF",
            text: "#171311",
            muted: "#73675B",
            border: "#E5D9C8",
            accent: "#E86F1D",
            accentStrong: "#C85608",
            accentSoft: "#FFF0E1",
            success: "#1F9D61",
            danger: "#D64545",
            statusBar: "#F6F1E8",
            statusBarStyle: "dark-content",
          },
    [isDark]
  );

  const value = useMemo(
    () => ({
      ready,
      themeMode,
      setThemeMode,
      language,
      setLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
      notificationsEnabled,
      setNotificationsEnabled,
      isDark,
      theme,
    }),
    [
      ready,
      themeMode,
      language,
      notificationsEnabled,
      isDark,
      theme,
    ]
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

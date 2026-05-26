import React, { useEffect } from "react";
import { Alert, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AuthStack from "./navigation/AuthStack";
import { ThemeProvider, useAppTheme } from "./context/ThemeContext";
import { localizeAlertContent } from "./utils/alertLocalization";

function AppShell() {
  const { ready, theme, language } = useAppTheme();

  useEffect(() => {
    const originalAlert = Alert.alert;

    Alert.alert = (title, message, buttons, options) => {
      const localized = localizeAlertContent(
        title,
        message,
        buttons,
        language
      );

      return originalAlert(
        localized.title,
        localized.message,
        localized.buttons,
        options
      );
    };

    return () => {
      Alert.alert = originalAlert;
    };
  }, [language]);

  if (!ready) return null;

  return (
    <>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.statusBar}
      />
      <AuthStack />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

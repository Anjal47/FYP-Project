import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppLogo from "../components/AppLogo";
import { useAppTheme } from "../context/ThemeContext";
import { useLocalizedCopy } from "../utils/localization";
const COPY_BY_LANGUAGE = {
  English: {
    eyebrow: "Safe Access",
    title: "Support should feel private, calm, and easy to start.",
    subtitle: "Report issues, reach support, or enter counseling flows from one clear and trustworthy place.",
    login: "Log In",
    register: "Create Account"
  },
  Nepali: {
    eyebrow: "सुरक्षित पहुँच",
    title: "सहयोग गोप्य, शान्त र सुरु गर्न सजिलो हुनुपर्छ।",
    subtitle: "समस्या रिपोर्ट गर्नुहोस्, सहयोग खोज्नुहोस्, वा परामर्श सेवामा जानुहोस्। यी सबै एउटै स्पष्ट र भरपर्दो स्थानबाट सम्भव छन्।",
    login: "लग इन गर्नुहोस्",
    register: "खाता बनाउनुहोस्"
  }
};
export default function WelcomeScreen({
  navigation
}) {
  const insets = useSafeAreaInsets();
  const {
    theme,
    isDark
  } = useAppTheme();
  const copy = useLocalizedCopy(COPY_BY_LANGUAGE);
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  return <View style={[styles.container, {
    paddingTop: insets.top + 12,
    paddingBottom: insets.bottom + 20
  }]}>
      <View style={styles.shell}>
        <View style={styles.hero}>
          <View style={styles.glow} />
          <AppLogo size={74} label={copy.eyebrow} />
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View style={styles.actionCard}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Login")} activeOpacity={0.92}>
            <Text style={styles.primaryButtonText}>{copy.login}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Register")} activeOpacity={0.92}>
            <Text style={styles.secondaryButtonText}>{copy.register}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>;
}
function createStyles(theme, isDark) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 12,
      justifyContent: "space-between"
    },
    shell: {
      flex: 1,
      width: "100%",
      maxWidth: 720,
      alignSelf: "center",
      justifyContent: "space-between"
    },
    hero: {
      marginTop: 12,
      backgroundColor: theme.surface,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.22 : 0.08,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 10
      },
      elevation: 4
    },
    glow: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 999,
      backgroundColor: theme.accentSoft,
      top: -70,
      right: -40
    },
    title: {
      marginTop: 18,
      color: theme.text,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "800",
      letterSpacing: -1,
      maxWidth: 440
    },
    subtitle: {
      marginTop: 12,
      color: theme.muted,
      fontSize: 14,
      lineHeight: 22,
      maxWidth: 480
    },
    actionCard: {
      marginBottom: 10,
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 12
    },
    primaryButton: {
      backgroundColor: theme.accentStrong,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center"
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800"
    },
    secondaryButton: {
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700"
    }
  };
}

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/ThemeContext";
import { postJSON } from "../utils/api";
import { useLocalizedCopy } from "../utils/localization";

const COPY_BY_LANGUAGE = {
  English: {
    missingEmailTitle: "Missing email",
    missingEmailMessage: "Enter the email connected to your account.",
    checkEmailTitle: "Check your email",
    checkEmailMessage:
      "If an account exists for that email, a password reset link has been sent.",
    unableToSendTitle: "Unable to send email",
    unableToSendMessage: "Please try again.",
    back: "Back to login",
    eyebrow: "Recovery",
    title: "Reset access without losing your place.",
    subtitle: "Enter your email and we'll send you a secure reset link.",
    emailTitle: "Email address",
    emailSubtitle: "Use the same address connected to your AngelTouch account.",
    emailPlaceholder: "you@example.com",
    sending: "Sending...",
    sendResetLink: "Send reset link",
  },
  Nepali: {
    missingEmailTitle: "इमेल छुट्यो",
    missingEmailMessage: "आफ्नो खातासँग जोडिएको इमेल लेख्नुहोस्।",
    checkEmailTitle: "इमेल जाँच गर्नुहोस्",
    checkEmailMessage:
      "यदि उक्त इमेलका लागि खाता छ भने, पासवर्ड रिसेट लिंक पठाइएको छ।",
    unableToSendTitle: "इमेल पठाउन सकिएन",
    unableToSendMessage: "कृपया फेरि प्रयास गर्नुहोस्।",
    back: "लग इनमा फर्कनुहोस्",
    eyebrow: "पुनःप्राप्ति",
    title: "आफ्नो पहुँच पुनःस्थापना गर्नुहोस्, प्रगति नभुली।",
    subtitle: "आफ्नो इमेल लेख्नुहोस्, हामी सुरक्षित रिसेट लिंक पठाउँछौं।",
    emailTitle: "इमेल ठेगाना",
    emailSubtitle: "तपाईंको AngelTouch खातासँग जोडिएको यही इमेल प्रयोग गर्नुहोस्।",
    emailPlaceholder: "you@example.com",
    sending: "पठाउँदै...",
    sendResetLink: "रिसेट लिंक पठाउनुहोस्",
  },
};

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const copy = useLocalizedCopy(COPY_BY_LANGUAGE);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);

  const handleSendReset = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert(copy.missingEmailTitle, copy.missingEmailMessage);
      return;
    }

    try {
      setLoading(true);
      const res = await postJSON("/api/auth/forgot-password", {
        email: cleanEmail,
      });
      Alert.alert(
        copy.checkEmailTitle,
        res?.message || copy.checkEmailMessage
      );
      setEmail("");
      navigation.goBack();
    } catch (error) {
      Alert.alert(copy.unableToSendTitle, error?.message || copy.unableToSendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{copy.back}</Text>
          </TouchableOpacity>

          <View style={styles.glow} />
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{copy.emailTitle}</Text>
          <Text style={styles.cardSubtitle}>{copy.emailSubtitle}</Text>

          <View style={styles.inputRow}>
            <Icon name="mail" size={16} color={theme.muted} />
            <TextInput
              style={styles.input}
              placeholder={copy.emailPlaceholder}
              placeholderTextColor={theme.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            activeOpacity={0.9}
            onPress={handleSendReset}
            disabled={loading}
          >
            {loading ? (
                <View style={styles.buttonRow}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>{copy.sending}</Text>
                </View>
              ) : (
              <Text style={styles.primaryButtonText}>{copy.sendResetLink}</Text>
              )}
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme, isDark) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 12,
      justifyContent: "center",
    },
    hero: {
      position: "relative",
      overflow: "hidden",
      backgroundColor: theme.surface,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.24 : 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    glow: {
      position: "absolute",
      top: -80,
      right: -64,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: theme.accentSoft,
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 10,
      marginBottom: 20,
    },
    backIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    backText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700",
    },
    eyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800",
      letterSpacing: -0.8,
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 480,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
    },
    cardSubtitle: {
      marginTop: 6,
      marginBottom: 14,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    inputRow: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      paddingVertical: 12,
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: 18,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },
    disabledButton: {
      opacity: 0.72,
    },
    buttonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
  };
}

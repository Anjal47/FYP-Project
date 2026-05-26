import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, TouchableWithoutFeedback, Keyboard, ActivityIndicator, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppLogo from "../components/AppLogo";
import { postJSON } from "../utils/api";
import { useAppTheme } from "../context/ThemeContext";
import { useLocalizedCopy } from "../utils/localization";

const COPY_BY_LANGUAGE = {
  English: {
    missingFieldsTitle: "Missing fields",
    missingFieldsMessage: "Please enter email and password.",
    signInIncomplete: "We could not complete sign-in right now.",
    loginFailed: "Login failed",
    loginFailedMessage: "Unable to login",
    eyebrow: "Welcome Back",
    title: "Log in without friction.",
    subtitle: "Access your reports, sessions, support, and personal safety tools from one account.",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    forgotPassword: "Forgot password?",
    loggingIn: "Logging in...",
    login: "Log In",
    noAccount: "Don't have an account?",
    createOne: " Create one"
  },
  Nepali: {
    missingFieldsTitle: "à¤†à¤µà¤¶à¥à¤¯à¤• à¤µà¤¿à¤µà¤°à¤£ à¤›à¥à¤Ÿà¥à¤¯à¥‹",
    missingFieldsMessage: "à¤•à¥ƒà¤ªà¤¯à¤¾ à¤‡à¤®à¥‡à¤² à¤° à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤ªà¥à¤°à¤µà¤¿à¤·à¥à¤Ÿ à¤—à¤°à¥à¤¨à¥à¤¹à¥‹à¤¸à¥à¥¤",
    signInIncomplete: "à¤…à¤¹à¤¿à¤²à¥‡ à¤¸à¤¾à¤‡à¤¨-à¤‡à¤¨ à¤ªà¥‚à¤°à¤¾ à¤—à¤°à¥à¤¨ à¤¸à¤•à¤¿à¤à¤¨à¥¤",
    loginFailed: "à¤²à¤— à¤‡à¤¨ à¤…à¤¸à¤«à¤² à¤­à¤¯à¥‹",
    loginFailedMessage: "à¤²à¤— à¤‡à¤¨ à¤—à¤°à¥à¤¨ à¤¸à¤•à¤¿à¤à¤¨",
    eyebrow: "à¤«à¥‡à¤°à¤¿ à¤¸à¥à¤µà¤¾à¤—à¤¤ à¤›",
    title: "à¤•à¥à¤¨à¥ˆ à¤à¤¨à¥à¤à¤Ÿ à¤¬à¤¿à¤¨à¤¾ à¤²à¤— à¤‡à¤¨ à¤—à¤°à¥à¤¨à¥à¤¹à¥‹à¤¸à¥à¥¤",
    subtitle: "à¤à¤‰à¤Ÿà¥ˆ à¤–à¤¾à¤¤à¤¾à¤¬à¤¾à¤Ÿ à¤†à¤«à¥à¤¨à¤¾ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ, à¤¸à¤¤à¥à¤°, à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤¸à¥‡à¤µà¤¾ à¤° à¤µà¥à¤¯à¤•à¥à¤¤à¤¿à¤—à¤¤ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤‰à¤ªà¤•à¤°à¤£à¤¹à¤°à¥‚ à¤ªà¤¹à¥à¤à¤š à¤—à¤°à¥à¤¨à¥à¤¹à¥‹à¤¸à¥à¥¤",
    email: "à¤‡à¤®à¥‡à¤²",
    emailPlaceholder: "you@example.com",
    password: "à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡",
    passwordPlaceholder: "à¤†à¤«à¥à¤¨à¥‹ à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤²à¥‡à¤–à¥à¤¨à¥à¤¹à¥‹à¤¸à¥",
    forgotPassword: "à¤ªà¤¾à¤¸à¤µà¤°à¥à¤¡ à¤¬à¤¿à¤°à¥à¤¸à¤¨à¥à¤­à¤¯à¥‹?",
    loggingIn: "à¤²à¤— à¤‡à¤¨ à¤¹à¥à¤à¤¦à¥ˆà¤›...",
    login: "à¤²à¤— à¤‡à¤¨ à¤—à¤°à¥à¤¨à¥à¤¹à¥‹à¤¸à¥",
    noAccount: "à¤–à¤¾à¤¤à¤¾ à¤›à¥ˆà¤¨?",
    createOne: " à¤¨à¤¯à¤¾à¤ à¤–à¤¾à¤¤à¤¾ à¤¬à¤¨à¤¾à¤‰à¤¨à¥à¤¹à¥‹à¤¸à¥"
  }
};

function routeByRole(role) {
  if (role === "admin") return "AdminTabs";
  if (role === "counsellor") return "CounsellorHome";
  if (role === "therapist") return "TherapistHome";
  if (role === "police") return "PoliceHome";
  if (role === "municipality") return "MunicipalityWasteDashboard";
  return "Home";
}

export default function LoginScreen({
  navigation
}) {
  const {
    theme,
    isDark
  } = useAppTheme();
  const copy = useLocalizedCopy(COPY_BY_LANGUAGE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);

  const handleLogin = async () => {
    const e = email.trim().toLowerCase();
    const p = password.trim();

    if (!e || !p) {
      Alert.alert(copy.missingFieldsTitle, copy.missingFieldsMessage);
      return;
    }

    try {
      setLoading(true);
      const res = await postJSON("/api/auth/login", {
        email: e,
        password: p
      });
      const token = res?.token;
      const user = res?.user;

      if (!token || !user?.role) {
        throw new Error(copy.signInIncomplete);
      }

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      const next = routeByRole(user.role);
      navigation.reset({
        index: 0,
        routes: [{
          name: next
        }]
      });
    } catch (err) {
      Alert.alert(copy.loginFailed, err?.message || copy.loginFailedMessage);
    } finally {
      setLoading(false);
    }
  };

  return <SafeAreaView style={styles.safe}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <AppLogo size={68} label={copy.eyebrow} />
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <View style={styles.formCard}>
            <Field label={copy.email} value={email} onChangeText={setEmail} placeholder={copy.emailPlaceholder} placeholderTextColor={theme.muted} autoCapitalize="none" keyboardType="email-address" styles={styles} />

            <Field label={copy.password} value={password} onChangeText={setPassword} placeholder={copy.passwordPlaceholder} placeholderTextColor={theme.muted} secureTextEntry styles={styles} />

            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotWrap} activeOpacity={0.8}>
              <Text style={styles.forgotText}>{copy.forgotPassword}</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.92} style={[styles.loginBtn, loading && styles.disabledButton]} onPress={handleLogin} disabled={loading}>
              {loading ? <View style={styles.buttonRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.loginBtnText}>{copy.loggingIn}</Text>
                </View> : <Text style={styles.loginBtnText}>{copy.login}</Text>}
            </TouchableOpacity>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>{copy.noAccount}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.bottomLink}>{copy.createOne}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>;
}

function Field({
  label,
  styles,
  ...props
}) {
  return <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={styles.input} />
    </View>;
}

function createStyles(theme, isDark) {
  return {
    safe: {
      flex: 1,
      backgroundColor: theme.background
    },
    page: {
      padding: 12,
      paddingBottom: 28
    },
    hero: {
      backgroundColor: theme.surface,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.22 : 0.08,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 10
      },
      elevation: 4
    },
    title: {
      marginTop: 16,
      color: theme.text,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800",
      letterSpacing: -0.9
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 480
    },
    formCard: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20
    },
    fieldWrap: {
      marginBottom: 14
    },
    label: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 8,
      letterSpacing: 0.2
    },
    input: {
      borderRadius: 18,
      backgroundColor: theme.surfaceSoft,
      paddingVertical: 13,
      paddingHorizontal: 14,
      color: theme.text,
      fontSize: 14,
      borderWidth: 1,
      borderColor: theme.border
    },
    forgotWrap: {
      alignSelf: "flex-end",
      marginBottom: 14
    },
    forgotText: {
      color: theme.accentStrong,
      fontSize: 12,
      fontWeight: "700"
    },
    loginBtn: {
      backgroundColor: theme.accentStrong,
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: "center"
    },
    disabledButton: {
      opacity: 0.72
    },
    loginBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "800"
    },
    buttonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    },
    bottomRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16
    },
    bottomText: {
      color: theme.muted,
      fontSize: 12
    },
    bottomLink: {
      color: theme.accentStrong,
      fontSize: 12,
      fontWeight: "800"
    }
  };
}

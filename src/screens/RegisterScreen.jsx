import React, { useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppLogo from "../components/AppLogo";
import { postJSON } from "../utils/api";
import { useAppTheme } from "../context/ThemeContext";
import { useLocalizedCopy } from "../utils/localization";
const COPY_BY_LANGUAGE = {
  English: {
    missingFieldsTitle: "Missing fields",
    missingFieldsMessage: "Please fill all fields.",
    invalidEmailTitle: "Invalid email",
    invalidEmailMessage: "Please enter a valid email address.",
    weakPasswordTitle: "Weak password",
    weakPasswordMessage: "Password must be at least 6 characters.",
    mismatchTitle: "Password mismatch",
    mismatchMessage: "Password and confirm password must match.",
    accountCreationFailed: "We could not create your account right now.",
    registrationFailedTitle: "Registration failed",
    registrationFailedMessage: "Unable to register",
    eyebrow: "Create Account",
    title: "Start with a cleaner, safer profile setup.",
    subtitle: "Your account keeps support, reporting, emergency actions, and counseling sessions connected.",
    fullName: "Full Name",
    fullNamePlaceholder: "Your full name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Create a password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Repeat your password",
    creating: "Creating...",
    createAccount: "Create Account",
    alreadyHaveAccount: "Already have an account?",
    login: " Log in"
  },
  Nepali: {
    missingFieldsTitle: "आवश्यक विवरण छुट्यो",
    missingFieldsMessage: "कृपया सबै विवरण भर्नुहोस्।",
    invalidEmailTitle: "अवैध इमेल",
    invalidEmailMessage: "कृपया मान्य इमेल ठेगाना लेख्नुहोस्।",
    weakPasswordTitle: "कमजोर पासवर्ड",
    weakPasswordMessage: "पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।",
    mismatchTitle: "पासवर्ड मिलेन",
    mismatchMessage: "पासवर्ड र पुष्टि गरिएको पासवर्ड एउटै हुनुपर्छ।",
    accountCreationFailed: "अहिले तपाईंको खाता बनाउन सकिएन।",
    registrationFailedTitle: "दर्ता असफल भयो",
    registrationFailedMessage: "दर्ता गर्न सकिएन",
    eyebrow: "खाता बनाउनुहोस्",
    title: "सफा र सुरक्षित प्रोफाइल सेटअपबाट सुरु गर्नुहोस्।",
    subtitle: "तपाईंको खाताले सहायता, रिपोर्टिङ, आपतकालीन कार्यहरू र परामर्श सत्रहरूलाई एउटै स्थानमा जोडेर राख्छ।",
    fullName: "पूरा नाम",
    fullNamePlaceholder: "तपाईंको पूरा नाम",
    email: "इमेल",
    emailPlaceholder: "you@example.com",
    password: "पासवर्ड",
    passwordPlaceholder: "पासवर्ड बनाउनुहोस्",
    confirmPassword: "पासवर्ड पुष्टि गर्नुहोस्",
    confirmPasswordPlaceholder: "पासवर्ड फेरि लेख्नुहोस्",
    creating: "खाता बनाउँदै...",
    createAccount: "खाता बनाउनुहोस्",
    alreadyHaveAccount: "पहिलेदेखि खाता छ?",
    login: " लग इन गर्नुहोस्"
  }
};
function routeByRole(role) {
  if (role === "admin") return "AdminTabs";
  if (role === "counsellor") return "CounsellorHome";
  if (role === "therapist") return "TherapistHome";
  if (role === "police") return "PoliceHome";
  return "Home";
}
export default function RegisterScreen({
  navigation
}) {
  const {
    theme,
    isDark
  } = useAppTheme();
  const copy = useLocalizedCopy(COPY_BY_LANGUAGE);
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const validate = () => {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    const p = password;
    const c = confirm;
    if (!n || !e || !p || !c) {
      Alert.alert(copy.missingFieldsTitle, copy.missingFieldsMessage);
      return false;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    if (!emailOk) {
      Alert.alert(copy.invalidEmailTitle, copy.invalidEmailMessage);
      return false;
    }
    if (p.length < 6) {
      Alert.alert(copy.weakPasswordTitle, copy.weakPasswordMessage);
      return false;
    }
    if (p !== c) {
      Alert.alert(copy.mismatchTitle, copy.mismatchMessage);
      return false;
    }
    return true;
  };
  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await postJSON("/api/auth/register", {
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        password
      });
      const token = res?.token;
      const user = res?.user;
      if (!token || !user) throw new Error(copy.accountCreationFailed);
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
      Alert.alert(copy.registrationFailedTitle, err?.message || copy.registrationFailedMessage);
    } finally {
      setLoading(false);
    }
  };
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppLogo size={68} label={copy.eyebrow} />
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View style={styles.formCard}>
          <Field label={copy.fullName} value={name} onChangeText={setName} placeholder={copy.fullNamePlaceholder} styles={styles} />
          <Field label={copy.email} value={email} onChangeText={setEmail} placeholder={copy.emailPlaceholder} autoCapitalize="none" keyboardType="email-address" styles={styles} />
          <Field label={copy.password} value={password} onChangeText={setPassword} placeholder={copy.passwordPlaceholder} secureTextEntry styles={styles} />
          <Field label={copy.confirmPassword} value={confirm} onChangeText={setConfirm} placeholder={copy.confirmPasswordPlaceholder} secureTextEntry styles={styles} />

          <TouchableOpacity style={[styles.primaryButton, loading && styles.disabledButton]} onPress={handleRegister} disabled={loading} activeOpacity={0.92}>
            {loading ? <View style={styles.buttonRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.primaryButtonText}>{copy.creating}</Text>
                </View> : <Text style={styles.primaryButtonText}>{copy.createAccount}</Text>}
            </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{copy.alreadyHaveAccount}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerLink}>{copy.login}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>;
}
function Field({
  label,
  styles,
  ...props
}) {
  return <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={styles.input} placeholderTextColor="#9A8C7D" />
    </View>;
}
function createStyles(theme, isDark) {
  return {
    container: {
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
      maxWidth: 500
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
      color: theme.text,
      marginBottom: 8,
      fontWeight: "800"
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 13,
      color: theme.text,
      fontSize: 14
    },
    primaryButton: {
      backgroundColor: theme.accentStrong,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 6,
      marginBottom: 14
    },
    disabledButton: {
      opacity: 0.72
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800"
    },
    buttonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "center"
    },
    footerText: {
      color: theme.muted,
      fontSize: 12
    },
    footerLink: {
      color: theme.accentStrong,
      fontWeight: "800",
      fontSize: 12
    }
  };
}

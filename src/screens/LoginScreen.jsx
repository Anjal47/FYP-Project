import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { postJSON } from "../utils/api";
import { useAppTheme } from "../context/ThemeContext";
import { createThemedStyles } from "../utils/themeStyles";

const ORANGE = "#FF7A1A";

function routeByRole(role) {
  if (role === "admin") return "AdminTabs";
  if (role === "counsellor") return "CounsellorHome";
  if (role === "therapist") return "TherapistHome";
  if (role === "police") return "PoliceHome";
  if (role === "municipality") return "MunicipalityWasteDashboard";
  return "Home";
}

export default function LoginScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );

  const handleLogin = async () => {
    const e = email.trim().toLowerCase();
    const p = password.trim();

    if (!e || !p) {
      Alert.alert("Missing fields", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await postJSON("/api/auth/login", { email: e, password: p });
      const token = res?.token;
      const user = res?.user;

      if (!token || !user?.role) {
        throw new Error("Invalid response from server");
      }

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      const next = routeByRole(user.role);
      navigation.reset({ index: 0, routes: [{ name: next }] });
    } catch (err) {
      Alert.alert("Login failed", err?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.page}>
          <Text style={styles.brand}>
            Angel<Text style={styles.brandBold}>Touch.</Text>
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter Email here..."
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter Password here..."
            placeholderTextColor={theme.muted}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotWrap}
            activeOpacity={0.8}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.loginBtnText}>Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.loginBtnText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.bottomLink}> Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};

const baseStyles = {
  safe: { flex: 1, backgroundColor: "#fff" },
  page: { flex: 1, padding: 22, justifyContent: "center" },

  brand: {
    fontSize: 28,
    fontWeight: "600",
    color: ORANGE,
    textAlign: "center",
    marginBottom: 18,
  },
  brandBold: { fontWeight: "900", color: "#111" },

  label: { fontSize: 13, fontWeight: "700", color: "#111", marginBottom: 6 },
  input: {
    borderRadius: 20,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    ...shadow,
  },

  forgotWrap: { alignSelf: "flex-end", marginBottom: 14 },
  forgotText: { color: ORANGE, fontSize: 12, fontWeight: "700" },

  loginBtn: {
    backgroundColor: ORANGE,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    ...shadow,
  },
  loginBtnText: { color: "#fff", fontSize: 14, fontWeight: "900" },

  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  bottomText: { color: "#333", fontSize: 12 },
  bottomLink: { color: ORANGE, fontSize: 12, fontWeight: "900" },
};

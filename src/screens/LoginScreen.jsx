import React, { useState } from "react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const e = email.trim().toLowerCase();
    const p = password.trim();

    if (!e || !p) {
      Alert.alert("Missing fields", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      // ✅ backend login
      const res = await postJSON("/api/auth/login", { email: e, password: p });
      // expected: { ok:true, token, user:{ id, fullName, email, role } }

      const token = res?.token;
      const user = res?.user;

      if (!token || !user?.role) {
        throw new Error("Invalid response from server");
      }

      // ✅ save for auto-login + role routing
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      // ✅ go to correct dashboard
      const next = routeByRole(user.role);
      navigation.reset({ index: 0, routes: [{ name: next }] });
    } catch (err) {
      Alert.alert("Login failed", err?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.page}>
          <Text style={s.brand}>
            Angel<Text style={s.brandBold}>Touch.</Text>
          </Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter Email here..."
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter Password here..."
            placeholderTextColor="#999"
            secureTextEntry
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            style={s.forgotWrap}
            activeOpacity={0.8}
          >
            <Text style={s.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[s.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.loginBtnText}>Logging in...</Text>
              </View>
            ) : (
              <Text style={s.loginBtnText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={s.bottomRow}>
            <Text style={s.bottomText}>Don’t have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={s.bottomLink}> Register</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.note}>
            Backend login decides role automatically (admin/counsellor/therapist/police/user).
          </Text>
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

const s = StyleSheet.create({
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

  note: { marginTop: 12, textAlign: "center", fontSize: 11, color: "#666" },
});

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";

const ORANGE = "#FF7A1A";

/**
 * TEMP DEMO ACCOUNTS (frontend-only)
 * Replace later with backend API
 */
const DEMO_ACCOUNTS = {
  user: {
    email: "user@angeltouch.com",
    password: "user1234",
    routeAfterLogin: "Home",
  },
  counsellor: {
    email: "counsellor@angeltouch.com",
    password: "counsellor1234",
    routeAfterLogin: "CounsellorHome",
  },
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("user"); // user | counsellor
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const roleLabel = role === "counsellor" ? "Counsellor" : "User";
  const acc = DEMO_ACCOUNTS[role];

  const handleLogin = () => {
    const e = email.trim().toLowerCase();
    const p = password.trim();

    if (!e || !p) {
      Alert.alert("Missing fields", "Please enter email and password.");
      return;
    }

    const isValid = e === acc.email && p === acc.password;

    if (!isValid) {
      Alert.alert(
        "Invalid login",
        `Wrong credentials for ${roleLabel}.\n\nTry:\n${acc.email}\n${acc.password}`
      );
      return;
    }

    // ✅ Always works + clears back stack
    navigation.reset({
      index: 0,
      routes: [{ name: acc.routeAfterLogin }],
    });
  };

  const selectRole = (newRole) => {
    setRole(newRole);
    setRoleModalOpen(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* tap outside input to close keyboard */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.page}>
          <Text style={s.brand}>
            Angel<Text style={s.brandBold}>Touch.</Text>
          </Text>

          {/* Role Picker */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={s.roleBox}
            onPress={() => setRoleModalOpen(true)}
          >
            <View>
              <Text style={s.roleSmall}>Login as</Text>
              <Text style={s.roleValue}>{roleLabel}</Text>
              <Text style={s.hint}>
                Demo: {acc.email} / {acc.password}
              </Text>
            </View>
            <Text style={s.roleChevron}>▾</Text>
          </TouchableOpacity>

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
            style={s.loginBtn}
            onPress={handleLogin}
          >
            <Text style={s.loginBtnText}>Log In</Text>
          </TouchableOpacity>

          <View style={s.bottomRow}>
            <Text style={s.bottomText}>Don’t have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={s.bottomLink}> Register</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Role Modal */}
          <Modal
            visible={roleModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setRoleModalOpen(false)}
          >
            {/* Background tap closes modal */}
            <TouchableWithoutFeedback onPress={() => setRoleModalOpen(false)}>
              <View style={s.overlay}>
                {/* Stop background click from closing when tapping inside */}
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={s.modalCard}>
                    <Text style={s.modalTitle}>Select Role</Text>

                    <TouchableOpacity
                      style={[s.roleItem, role === "user" && s.roleItemActive]}
                      onPress={() => selectRole("user")}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          s.roleItemText,
                          role === "user" && s.roleItemTextActive,
                        ]}
                      >
                        User
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        s.roleItem,
                        role === "counsellor" && s.roleItemActive,
                      ]}
                      onPress={() => selectRole("counsellor")}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          s.roleItemText,
                          role === "counsellor" && s.roleItemTextActive,
                        ]}
                      >
                        Counsellor
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.modalCloseBtn}
                      onPress={() => setRoleModalOpen(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={s.modalCloseText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
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

  roleBox: {
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...shadow,
  },
  roleSmall: { fontSize: 12, color: "#777" },
  roleValue: { fontSize: 15, fontWeight: "800", color: "#111" },
  roleChevron: { fontSize: 18, color: "#333" },
  hint: { marginTop: 4, fontSize: 11, color: "#666" },

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

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    ...shadow,
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#111", marginBottom: 12 },

  roleItem: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F6F6F6",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  roleItemActive: { borderWidth: 1, borderColor: ORANGE, backgroundColor: "#fff" },
  roleItemText: { fontSize: 14, fontWeight: "800", color: "#111" },
  roleItemTextActive: { color: ORANGE },

  modalCloseBtn: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  modalCloseText: { fontSize: 14, fontWeight: "900", color: "#111" },
});

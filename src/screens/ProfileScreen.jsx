import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ORANGE = "#FF7A1A";
const BASE_URL = "http://10.0.2.2:5000"; // Android emulator

async function apiGetMe(token) {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load profile");
  return data;
}

async function apiPatchMe(token, payload) {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to update profile");
  return data;
}

async function apiChangeEmail(token, payload) {
  const res = await fetch(`${BASE_URL}/api/auth/me/email`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to change email");
  return data;
}

async function apiChangePassword(token, payload) {
  const res = await fetch(`${BASE_URL}/api/auth/me/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to change password");
  return data;
}

export default function ProfileScreen({ navigation }) {
  const UI = useMemo(
    () => ({
      bg: "#FFFFFF",
      card: "#FFFFFF",
      text: "#111111",
      mut: "#666666",
      line: "rgba(0,0,0,0.08)",
      orange: ORANGE,
    }),
    []
  );

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [me, setMe] = useState(null);

  // Profile form
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    bio: "",
    qualification: "",
    workingArea: "",
  });

  // Email form
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    password: "",
  });

  // Password form
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const isStaff = ["counsellor", "therapist", "police"].includes(me?.role);

  const fillFormFromMe = (u) => {
    setForm({
      fullName: u?.fullName || "",
      phone: u?.phone || "",
      bio: u?.bio || "",
      qualification: u?.qualification || "",
      workingArea: u?.workingArea || "",
    });

    setEmailForm((p) => ({
      ...p,
      newEmail: u?.email || "",
    }));
  };

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const data = await apiGetMe(token);
      setMe(data?.user || null);
      fillFormFromMe(data?.user);
    } catch (err) {
      Alert.alert("Profile error", err?.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const onChangeEmail = (k, v) => setEmailForm((p) => ({ ...p, [k]: v }));
  const onChangePass = (k, v) => setPassForm((p) => ({ ...p, [k]: v }));

  const saveProfile = async () => {
    try {
      setSavingProfile(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      };

      if (isStaff) {
        payload.bio = form.bio.trim();
        payload.qualification = form.qualification.trim();
        payload.workingArea = form.workingArea.trim();
      }

      const data = await apiPatchMe(token, payload);
      const updated = data?.user;

      setMe(updated);
      fillFormFromMe(updated);

      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          id: updated.id,
          fullName: updated.fullName,
          email: updated.email,
          role: updated.role,
        })
      );

      Alert.alert("Saved", "Profile updated successfully.");
    } catch (err) {
      Alert.alert("Save failed", err?.message || "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveEmail = async () => {
    try {
      const e = emailForm.newEmail.trim().toLowerCase();
      const p = emailForm.password.trim();

      if (!e || !p) {
        Alert.alert("Missing", "New email and password are required.");
        return;
      }

      setSavingEmail(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const data = await apiChangeEmail(token, { newEmail: e, password: p });

      // update local
      const newUser = data?.user;
      if (newUser?.email) {
        setMe((old) => ({ ...(old || {}), email: newUser.email }));
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
          })
        );
      }

      setEmailForm((x) => ({ ...x, password: "" }));
      Alert.alert("Updated", "Email updated successfully.");
    } catch (err) {
      Alert.alert("Email change failed", err?.message || "Unable to change email");
    } finally {
      setSavingEmail(false);
    }
  };

  const savePassword = async () => {
    try {
      const cp = passForm.currentPassword.trim();
      const np = passForm.newPassword.trim();
      const cnp = passForm.confirmNewPassword.trim();

      if (!cp || !np || !cnp) {
        Alert.alert("Missing", "Please fill all password fields.");
        return;
      }
      if (np.length < 6) {
        Alert.alert("Weak password", "New password must be at least 6 characters.");
        return;
      }
      if (np !== cnp) {
        Alert.alert("Mismatch", "New password and confirmation do not match.");
        return;
      }

      setSavingPass(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      await apiChangePassword(token, { currentPassword: cp, newPassword: np });

      setPassForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      Alert.alert("Updated", "Password updated successfully.");
    } catch (err) {
      Alert.alert("Password change failed", err?.message || "Unable to change password");
    } finally {
      setSavingPass(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={UI.orange} />
          <Text style={{ marginTop: 10, color: UI.mut, fontWeight: "700" }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
      <ScrollView
        contentContainerStyle={s.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={[s.title, { color: UI.text }]}>My Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Text style={[s.link, { color: UI.orange }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={[s.card, { borderColor: UI.line }]}>
          <Text style={[s.bigName, { color: UI.text }]}>{me?.fullName || "—"}</Text>
          <Text style={[s.small, { color: UI.mut }]}>{me?.email || "—"}</Text>
          <Text style={[s.small, { color: UI.mut }]}>
            Role: {(me?.role || "user").toUpperCase()}
          </Text>
        </View>

        {/* Edit profile */}
        <View style={[s.card, { borderColor: UI.line }]}>
          <Text style={[s.sectionTitle, { color: UI.text }]}>Edit Details</Text>

          <Field label="Full Name" value={form.fullName} onChangeText={(v) => onChange("fullName", v)} />
          <Field label="Phone" value={form.phone} onChangeText={(v) => onChange("phone", v)} />

          {isStaff ? (
            <>
              <Field label="Working Area" value={form.workingArea} onChangeText={(v) => onChange("workingArea", v)} />
              <Field label="Qualification" value={form.qualification} onChangeText={(v) => onChange("qualification", v)} />
              <Field label="Bio" value={form.bio} onChangeText={(v) => onChange("bio", v)} multiline />
              <Text style={[s.note, { color: UI.mut }]}>Staff-only fields are enabled for your role.</Text>
            </>
          ) : (
            <Text style={[s.note, { color: UI.mut }]}>Users can edit name/phone only.</Text>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            style={[s.saveBtn, savingProfile && { opacity: 0.7 }]}
            onPress={saveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.saveTxt}>Saving...</Text>
              </View>
            ) : (
              <Text style={s.saveTxt}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Change Email */}
        <View style={[s.card, { borderColor: UI.line }]}>
          <Text style={[s.sectionTitle, { color: UI.text }]}>Change Email</Text>

          <Field label="New Email" value={emailForm.newEmail} onChangeText={(v) => onChangeEmail("newEmail", v)} />
          <Field label="Current Password" value={emailForm.password} onChangeText={(v) => onChangeEmail("password", v)} secureTextEntry />

          <TouchableOpacity
            activeOpacity={0.9}
            style={[s.saveBtn, savingEmail && { opacity: 0.7 }]}
            onPress={saveEmail}
            disabled={savingEmail}
          >
            {savingEmail ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.saveTxt}>Updating...</Text>
              </View>
            ) : (
              <Text style={s.saveTxt}>Update Email</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Change Password */}
        <View style={[s.card, { borderColor: UI.line }]}>
          <Text style={[s.sectionTitle, { color: UI.text }]}>Change Password</Text>

          <Field label="Current Password" value={passForm.currentPassword} onChangeText={(v) => onChangePass("currentPassword", v)} secureTextEntry />
          <Field label="New Password" value={passForm.newPassword} onChangeText={(v) => onChangePass("newPassword", v)} secureTextEntry />
          <Field label="Confirm New Password" value={passForm.confirmNewPassword} onChangeText={(v) => onChangePass("confirmNewPassword", v)} secureTextEntry />

          <TouchableOpacity
            activeOpacity={0.9}
            style={[s.saveBtn, savingPass && { opacity: 0.7 }]}
            onPress={savePassword}
            disabled={savingPass}
          >
            {savingPass ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={s.saveTxt}>Updating...</Text>
              </View>
            ) : (
              <Text style={s.saveTxt}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={[s.card, { borderColor: UI.line }]}>
          <Text style={[s.sectionTitle, { color: UI.text }]}>Session</Text>
          <TouchableOpacity activeOpacity={0.9} style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutTxt}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, multiline, style, ...props }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        {...props}
        autoCapitalize="none"
        placeholderTextColor="#999"
        style={[s.input, multiline && { height: 90, textAlignVertical: "top" }, style]}
        multiline={!!multiline}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { padding: 16, paddingBottom: 26 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "900" },
  link: { fontSize: 13, fontWeight: "900" },

  card: { backgroundColor: "#fff", borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },

  bigName: { fontSize: 18, fontWeight: "900" },
  small: { marginTop: 4, fontSize: 12, fontWeight: "800" },

  sectionTitle: { fontSize: 14, fontWeight: "900", marginBottom: 10 },
  label: { fontSize: 12, fontWeight: "800", color: "#555", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    color: "#111",
  },

  note: { marginTop: 6, fontSize: 11, fontWeight: "700", lineHeight: 16 },

  saveBtn: { marginTop: 10, backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  saveTxt: { color: "#fff", fontWeight: "900" },

  logoutBtn: { borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" },
  logoutTxt: { color: "#111", fontWeight: "900" },
});

import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { adminDELETE, adminGET, adminPOST } from "../../utils/adminApi";

export default function AdminStaffScreen() {
  const UI = useMemo(
    () => ({
      bg: "#0B0F14",
      card: "#111826",
      card2: "#0F172A",
      text: "#EAF0FF",
      mut: "rgba(234,240,255,0.68)",
      line: "rgba(255,255,255,0.08)",
      accent: "#7C3AED",
      danger: "#EF4444",
      ok: "#22C55E",
      warn: "#F59E0B",
    }),
    []
  );

  // ✅ Roles list (added municipality)
  const ROLE_OPTIONS = useMemo(
    () => [
      { key: "counsellor", label: "Counsellor" },
      { key: "therapist", label: "Therapist" },
      { key: "police", label: "Police" },
      { key: "municipality", label: "Municipality" }, // ✅ NEW
    ],
    []
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "counsellor",
    phone: "",
    qualification: "",
    workingArea: "",
    bio: "",
  });

  const [staff, setStaff] = useState([]);

  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = async () => {
    try {
      const data = await adminGET("/api/admin/staff");
      setStaff(Array.isArray(data?.staff) ? data.staff : []);
    } catch (e) {
      Alert.alert("Staff error", e?.message || "Failed to load staff");
      setStaff([]);
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

  const createStaff = async () => {
    try {
      const fullName = form.fullName.trim();
      const email = form.email.trim().toLowerCase();
      const password = form.password;

      if (!fullName || !email || !password) {
        Alert.alert("Missing", "fullName, email, password required");
        return;
      }

      await adminPOST("/api/admin/staff", {
        fullName,
        email,
        password,
        role: form.role, // ✅ can now be municipality
        phone: form.phone,
        qualification: form.qualification,
        workingArea: form.workingArea,
        bio: form.bio,
      });

      Alert.alert("Created", "Staff created successfully ✅");
      setForm((p) => ({ ...p, fullName: "", email: "", password: "" }));
      await load();
    } catch (e) {
      Alert.alert("Create failed", e?.message || "Could not create staff");
    }
  };

  const removeStaff = async (id) => {
    Alert.alert("Delete staff?", "This will remove the staff account permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await adminDELETE(`/api/admin/staff/${id}`);
            await load();
          } catch (e) {
            Alert.alert("Delete failed", e?.message || "Could not delete staff");
          }
        },
      },
    ]);
  };

  const rolePillColor = (roleKey) => {
    if (roleKey === "police") return UI.danger;
    if (roleKey === "municipality") return UI.warn;
    if (roleKey === "therapist") return UI.accent;
    return UI.ok; // counsellor
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
      <ScrollView
        contentContainerStyle={s.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.title, { color: UI.text }]}>Staff</Text>
        <Text style={[s.sub, { color: UI.mut }]}>Create and manage staff accounts.</Text>

        {/* Create staff */}
        <View style={[s.panel, { backgroundColor: UI.card, borderColor: UI.line }]}>
          <Text style={[s.panelTitle, { color: UI.text }]}>Create Staff Account</Text>

          <Field
            UI={UI}
            label="Full Name"
            value={form.fullName}
            onChangeText={(v) => onChange("fullName", v)}
            placeholder="e.g., Sita Sharma"
          />
          <Field
            UI={UI}
            label="Email"
            value={form.email}
            onChangeText={(v) => onChange("email", v)}
            placeholder="e.g., staff@angeltouch.com"
            autoCapitalize="none"
          />
          <Field
            UI={UI}
            label="Password"
            value={form.password}
            onChangeText={(v) => onChange("password", v)}
            placeholder="Set a password"
            secureTextEntry
          />

          <Text style={[s.lbl, { color: UI.mut }]}>Role</Text>
          <View style={s.chips}>
            {ROLE_OPTIONS.map((r) => {
              const active = form.role === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  activeOpacity={0.9}
                  onPress={() => onChange("role", r.key)}
                  style={[
                    s.chip,
                    {
                      borderColor: UI.line,
                      backgroundColor: active ? UI.card2 : UI.card,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? UI.text : UI.mut,
                      fontWeight: "900",
                      fontSize: 12,
                    }}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Field
            UI={UI}
            label="Phone"
            value={form.phone}
            onChangeText={(v) => onChange("phone", v)}
            placeholder="Optional"
          />
          <Field
            UI={UI}
            label="Qualification"
            value={form.qualification}
            onChangeText={(v) => onChange("qualification", v)}
            placeholder="Optional"
          />
          <Field
            UI={UI}
            label="Working Area"
            value={form.workingArea}
            onChangeText={(v) => onChange("workingArea", v)}
            placeholder="Optional"
          />
          <Field
            UI={UI}
            label="Bio"
            value={form.bio}
            onChangeText={(v) => onChange("bio", v)}
            placeholder="Optional"
          />

          <TouchableOpacity activeOpacity={0.9} style={[s.primary, { borderColor: UI.line }]} onPress={createStaff}>
            <Ionicons name="person-add-outline" size={18} color={UI.text} />
            <Text style={[s.primaryTxt, { color: UI.text }]}>Create Staff</Text>
          </TouchableOpacity>
        </View>

        {/* Staff list */}
        <View style={[s.panel, { backgroundColor: UI.card, borderColor: UI.line }]}>
          <Text style={[s.panelTitle, { color: UI.text }]}>Staff List</Text>

          {loading ? (
            <View style={{ padding: 14, alignItems: "center" }}>
              <ActivityIndicator color={UI.accent} />
              <Text style={{ marginTop: 10, color: UI.mut, fontWeight: "800" }}>Loading staff...</Text>
            </View>
          ) : staff.length === 0 ? (
            <Text style={{ color: UI.mut, fontWeight: "700" }}>No staff found.</Text>
          ) : (
            staff.map((m) => {
              const roleLabel = ROLE_OPTIONS.find((x) => x.key === m.role)?.label || m.role;
              return (
                <View key={m._id} style={[s.row, { backgroundColor: UI.card2, borderColor: UI.line }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.name, { color: UI.text }]}>{m.fullName}</Text>
                    <Text style={[s.meta, { color: UI.mut }]}>{m.email}</Text>

                    <View style={[s.rolePill, { borderColor: rolePillColor(m.role) }]}>
                      <View style={[s.roleDot, { backgroundColor: rolePillColor(m.role) }]} />
                      <Text style={[s.roleTxt, { color: rolePillColor(m.role) }]}>{roleLabel}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[s.smallBtn, { borderColor: UI.line }]}
                    onPress={() => removeStaff(m._id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={UI.danger} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ UI, label, ...props }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[s.lbl, { color: UI.mut }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="rgba(234,240,255,0.45)"
        style={[s.input, { backgroundColor: UI.card2, borderColor: UI.line, color: UI.text }]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { padding: 16, paddingBottom: 26 },

  title: { fontSize: 20, fontWeight: "900" },
  sub: { marginTop: 4, fontSize: 13, marginBottom: 12 },

  panel: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  panelTitle: { fontSize: 14, fontWeight: "900", marginBottom: 10 },

  lbl: { fontSize: 12, fontWeight: "800", marginBottom: 6 },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },

  primary: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryTxt: { fontSize: 13, fontWeight: "900" },

  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  name: { fontSize: 14, fontWeight: "900" },
  meta: { marginTop: 2, fontSize: 12, fontWeight: "700" },

  rolePill: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleDot: { width: 8, height: 8, borderRadius: 99 },
  roleTxt: { fontSize: 11, fontWeight: "900" },

  smallBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

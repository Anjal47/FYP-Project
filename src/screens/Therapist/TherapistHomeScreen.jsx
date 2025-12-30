// src/screens/TherapistHomeScreen.jsx
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
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.0.2.2:5000";

/* ----------------------------- API Helpers ----------------------------- */

/**
 * @param {string} token
 * @returns {Promise<any>}
 */
async function apiGetTherapistAppointments(token) {
  // ✅ backend should return therapist's appointments (pending/confirmed/etc)
  // You can implement this endpoint as:
  // GET /api/therapy/therapist/appointments
  const res = await fetch(`${BASE_URL}/api/therapy/therapist/appointments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load therapist appointments");
  return data;
}

/**
 * Therapist confirms appointment
 * PATCH /api/therapy/appointments/:id/confirm
 */
async function apiConfirmAppointment(token, appointmentId) {
  const res = await fetch(`${BASE_URL}/api/therapy/appointments/${appointmentId}/confirm`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to confirm appointment");
  return data;
}

/**
 * Therapist declines appointment
 * PATCH /api/therapy/appointments/:id/decline
 */
async function apiDeclineAppointment(token, appointmentId) {
  const res = await fetch(`${BASE_URL}/api/therapy/appointments/${appointmentId}/decline`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to decline appointment");
  return data;
}

/* --------------------------- Therapist Home --------------------------- */

/**
 * TherapistHomeScreen
 * Real API-connected therapist dashboard:
 * - Loads therapist appointments
 * - Therapist can confirm/decline pending appointments
 * - Shows statuses: pending/confirmed/cancelled/completed
 *
 * Soft, safe, professional — with a tiny rainbow wink 🌈🫶
 */
export default function TherapistHomeScreen({ navigation }) {
  const UI = useMemo(
    () => ({
      bg: "#0B0F14",
      card: "#111826",
      card2: "#0F172A",
      text: "#EAF0FF",
      mut: "rgba(234,240,255,0.68)",
      line: "rgba(255,255,255,0.08)",
      accent: "#7C3AED",
      calm: "#22C55E",
      warn: "#F59E0B",
      danger: "#EF4444",
    }),
    []
  );

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("Requests"); // Today | Requests | Confirmed | All
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * appointments: unified list
   * shape expected from backend (recommended):
   * {
   *   id, status, month, day, slot,
   *   user: { id, fullName, email, phone },
   *   request: { id, problem, age, gender, language, mode, description }
   * }
   */
  const [appointments, setAppointments] = useState([]);

  const badgeTone = (status) => {
    if (status === "confirmed") return UI.calm;
    if (status === "pending") return UI.warn;
    if (status === "cancelled") return UI.danger;
    if (status === "completed") return UI.calm;
    return UI.mut;
  };

  const statusLabel = (status) => {
    if (status === "pending") return "PENDING";
    if (status === "confirmed") return "CONFIRMED";
    if (status === "cancelled") return "DECLINED";
    if (status === "completed") return "COMPLETED";
    return String(status || "").toUpperCase();
  };

  const safeNavLogin = () => {
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const load = async (opts = { silent: false }) => {
    const silent = !!opts?.silent;

    try {
      if (!silent) setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) return safeNavLogin();

      const data = await apiGetTherapistAppointments(token);
      setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (e) {
      Alert.alert("Therapist Hub", e?.message || "Could not load appointments");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      load({ silent: false });
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const confirm = async (appointmentId) => {
    Alert.alert("Confirm Appointment", "Accept and confirm this appointment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return safeNavLogin();

            await apiConfirmAppointment(token, appointmentId);

            // Optimistic UI update
            setAppointments((prev) =>
              prev.map((a) => (a.id === appointmentId ? { ...a, status: "confirmed" } : a))
            );
          } catch (e) {
            Alert.alert("Confirm failed", e?.message || "Could not confirm");
          }
        },
      },
    ]);
  };

  const decline = async (appointmentId) => {
    Alert.alert("Decline Appointment", "Decline this appointment request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return safeNavLogin();

            await apiDeclineAppointment(token, appointmentId);

            // Optimistic UI update
            setAppointments((prev) =>
              prev.map((a) => (a.id === appointmentId ? { ...a, status: "cancelled" } : a))
            );
          } catch (e) {
            Alert.alert("Decline failed", e?.message || "Could not decline");
          }
        },
      },
    ]);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const byTab = (a) => {
      if (tab === "Today") return a.status === "confirmed"; // treat "Today" as confirmed sessions for now
      if (tab === "Requests") return a.status === "pending";
      if (tab === "Confirmed") return a.status === "confirmed";
      return true; // All
    };

    const bySearch = (a) => {
      if (!q) return true;

      const userName = a?.user?.fullName || "";
      const problem = a?.request?.problem || "";
      const mode = a?.request?.mode || "";
      const slot = a?.slot || "";
      const month = a?.month || "";
      const status = a?.status || "";

      return (
        String(a?.id || "").toLowerCase().includes(q) ||
        userName.toLowerCase().includes(q) ||
        problem.toLowerCase().includes(q) ||
        mode.toLowerCase().includes(q) ||
        slot.toLowerCase().includes(q) ||
        month.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q)
      );
    };

    return appointments.filter((a) => byTab(a) && bySearch(a));
  }, [appointments, search, tab]);

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={UI.accent} />
          <Text style={{ marginTop: 10, color: UI.mut, fontWeight: "900" }}>Loading Therapist Hub…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
      <ScrollView
        contentContainerStyle={s.page}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.text} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.title, { color: UI.text }]}>
              Therapist <Text style={{ color: UI.accent, fontWeight: "900" }}>Hub</Text>
            </Text>
            <Text style={[s.sub, { color: UI.mut }]}>
              Review bookings, confirm sessions, and keep things calm. 🌈🫶
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[s.roundBtn, { borderColor: UI.line }]}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings-outline" size={22} color={UI.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[s.searchBox, { borderColor: UI.line, backgroundColor: UI.card }]}>
          <Ionicons name="search-outline" size={18} color={UI.mut} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search client, problem, slot, status…"
            placeholderTextColor="rgba(234,240,255,0.45)"
            style={[s.searchInput, { color: UI.text }]}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")} style={s.clearBtn}>
              <Ionicons name="close-circle" size={20} color={UI.mut} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {["Requests", "Confirmed", "All"].map((t) => (
            <TouchableOpacity
              key={t}
              activeOpacity={0.9}
              onPress={() => setTab(t)}
              style={[
                s.tabChip,
                {
                  borderColor: UI.line,
                  backgroundColor: tab === t ? UI.card2 : UI.card,
                },
              ]}
            >
              <Text style={{ color: tab === t ? UI.text : UI.mut, fontWeight: "900", fontSize: 12 }}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={[s.section, { borderColor: UI.line, backgroundColor: UI.card }]}>
          <View style={s.sectionTop}>
            <Text style={[s.sectionTitle, { color: UI.text }]}>
              {tab === "Requests" ? "Pending Requests" : tab === "Confirmed" ? "Confirmed Sessions" : "All Appointments"}
            </Text>

            <View style={[s.countPill, { borderColor: UI.line }]}>
              <Ionicons name="albums-outline" size={14} color={UI.mut} />
              <Text style={[s.countTxt, { color: UI.mut }]}>{filtered.length}</Text>
            </View>
          </View>

          {filtered.length === 0 ? (
            <EmptyState UI={UI} text="Nothing to show here. That’s a peaceful vibe." />
          ) : (
            filtered.map((a) => {
              const status = a?.status || "pending";
              const tone = badgeTone(status);

              const clientName = a?.user?.fullName || "Client";
              const problem = a?.request?.problem || "Therapy";
              const mode = a?.request?.mode || "Session";
              const language = a?.request?.language || "";
              const age = a?.request?.age ? `Age ${a.request.age}` : "";
              const when = `${a?.month || "Month"} ${a?.day || ""} • ${a?.slot || ""}`;

              return (
                <View key={a.id} style={[s.card, { borderColor: UI.line, backgroundColor: UI.card2 }]}>
                  <View style={s.rowTop}>
                    <Text style={[s.id, { color: UI.text }]}>{String(a.id).slice(-6).toUpperCase()}</Text>

                    <View style={[s.badge, { borderColor: tone }]}>
                      <View style={[s.dot, { backgroundColor: tone }]} />
                      <Text style={[s.badgeTxt, { color: tone }]}>{statusLabel(status)}</Text>
                    </View>
                  </View>

                  <Text style={[s.big, { color: UI.text }]}>{clientName}</Text>
                  <Text style={[s.small, { color: UI.mut }]}>{problem}</Text>

                  <View style={s.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color={UI.mut} />
                    <Text style={[s.metaTxt, { color: UI.mut }]}>{when}</Text>
                  </View>

                  <View style={s.metaRow}>
                    <Ionicons name="sparkles-outline" size={14} color={UI.mut} />
                    <Text style={[s.metaTxt, { color: UI.mut }]}>
                      {mode}
                      {!!language ? ` • ${language}` : ""}
                      {!!age ? ` • ${age}` : ""}
                    </Text>
                  </View>

                  {!!a?.request?.description && (
                    <View style={[s.noteBox, { borderColor: UI.line }]}>
                      <Ionicons name="chatbox-ellipses-outline" size={14} color={UI.mut} />
                      <Text style={[s.noteTxt, { color: UI.mut }]} numberOfLines={3}>
                        {a.request.description}
                      </Text>
                    </View>
                  )}

                  {/* Actions */}
                  {status === "pending" ? (
                    <View style={s.actionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={[s.actionBtn, { borderColor: UI.line }]}
                        onPress={() => confirm(a.id)}
                      >
                        <Ionicons name="checkmark-outline" size={18} color={UI.calm} />
                        <Text style={[s.actionTxt, { color: UI.text }]}>Confirm</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={[s.actionBtn, { borderColor: UI.line }]}
                        onPress={() => decline(a.id)}
                      >
                        <Ionicons name="close-outline" size={18} color={UI.danger} />
                        <Text style={[s.actionTxt, { color: UI.text }]}>Decline</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={[s.actionBtn, { borderColor: UI.line }]}
                        onPress={() => Alert.alert("Open Chat", "Connect this to your therapist chat screen.")}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color={UI.text} />
                        <Text style={[s.actionTxt, { color: UI.text }]}>Chat</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={s.actionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={[s.actionBtn, { borderColor: UI.line }]}
                        onPress={() => Alert.alert("Open Chat", "Connect this to your therapist chat screen.")}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color={UI.text} />
                        <Text style={[s.actionTxt, { color: UI.text }]}>Chat</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={[s.actionBtn, { borderColor: UI.line }]}
                        onPress={() => Alert.alert("Details", "You can navigate to a details screen here.")}
                      >
                        <Ionicons name="information-circle-outline" size={16} color={UI.accent} />
                        <Text style={[s.actionTxt, { color: UI.text }]}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <Text style={[s.footer, { color: UI.mut }]}>
          API used: GET /api/therapy/therapist/appointments, PATCH /api/therapy/appointments/:id/confirm|decline 🫶
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------ Empty State ------------------------------ */

function EmptyState({ UI, text }) {
  return (
    <View style={[s.empty, { borderColor: UI.line }]}>
      <Ionicons name="sparkles-outline" size={20} color={UI.accent} />
      <Text style={[s.emptyTxt, { color: UI.mut }]}>{text}</Text>
    </View>
  );
}

/* --------------------------------- Styles -------------------------------- */

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { padding: 16, paddingBottom: 26 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 4, fontSize: 13, lineHeight: 18 },

  roundBtn: { width: 42, height: 42, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  searchBox: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13 },
  clearBtn: { padding: 2 },

  tabs: { flexDirection: "row", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  tabChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },

  section: { borderWidth: 1, borderRadius: 18, padding: 14 },
  sectionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "900" },

  countPill: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  countTxt: { fontSize: 12, fontWeight: "900" },

  empty: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  emptyTxt: { fontSize: 12, fontWeight: "700" },

  card: { borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 10 },

  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  id: { fontSize: 12, fontWeight: "900" },

  big: { marginTop: 8, fontSize: 14, fontWeight: "900" },
  small: { marginTop: 4, fontSize: 12, fontWeight: "700" },

  metaRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaTxt: { fontSize: 12, fontWeight: "700" },

  badge: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  badgeTxt: { fontSize: 11, fontWeight: "900" },
  dot: { width: 9, height: 9, borderRadius: 99 },

  noteBox: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noteTxt: { flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 18 },

  actionsRow: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  actionTxt: { fontSize: 11, fontWeight: "900" },

  footer: { marginTop: 12, fontSize: 12, lineHeight: 17 },
});

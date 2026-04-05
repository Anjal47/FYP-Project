// src/screens/counsellor/CounsellorClientsScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ORANGE = "#FF7A1A";
const BG = "#F4F4F4";
const BASE_URL = "http://10.0.2.2:5000";

const { width: SCREEN_W } = Dimensions.get("window");

/**
 * CounsellorClientsScreen (Booked Clients)
 * - Fetches counsellor appointments
 * - Builds UNIQUE client list from appointments (latest booking per client)
 * - Shows Message icon ONLY if:
 *   ✅ appointment.status = confirmed
 *   ✅ request.mode = Online
 */
export default function CounsellorClientsScreen({ navigation }) {
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // raw appointments from backend
  const [appointments, setAppointments] = useState([]);

  const statusColor = (s) => {
    const x = String(s || "").toLowerCase();
    if (x === "confirmed") return "#22C55E";
    if (x === "pending") return "#F59E0B";
    if (x === "cancelled") return "#EF4444";
    if (x === "completed") return "#22C55E";
    return "#999";
  };

  const loadAppointments = async (opts = { quiet: false }) => {
    const { quiet } = opts || {};
    try {
      if (!quiet) setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const res = await fetch(`${BASE_URL}/api/counseling/counsellor/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load booked clients");

      setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (e) {
      Alert.alert("Booked Clients", e?.message || "Could not load booked clients");
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => loadAppointments({ quiet: false }));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAppointments({ quiet: true });
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Build UNIQUE clients from appointments.
   * Keeps the most recent appointment per client.
   */
  const bookedClients = useMemo(() => {
    // newest first
    const sorted = [...appointments].sort((a, b) => {
      const ta = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      const tb = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
      return tb - ta;
    });

    const map = new Map(); // userId -> clientObj

    for (const appt of sorted) {
      const u = appt?.user; // backend populates userId as "user"
      const userId = u?._id || u?.id || appt?.userId || appt?.user;

      if (!userId) continue;
      if (map.has(userId)) continue;

      const apptId = appt?.id || appt?._id; // ✅ IMPORTANT for chat

      map.set(userId, {
        id: String(userId),
        appointmentId: apptId ? String(apptId) : "",
        name: u?.fullName || "Client",
        email: u?.email || "",
        phone: u?.phone || "",

        latestStatus: String(appt?.status || "pending").toLowerCase(),
        latestWhen: `${appt?.month || ""} ${appt?.day || ""} • ${appt?.slot || ""}`.trim(),

        problem: appt?.request?.problem || "",
        mode: appt?.request?.mode || "",
        language: appt?.request?.language || "",
        desc: appt?.request?.description || "",
      });
    }

    return Array.from(map.values());
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookedClients;

    return bookedClients.filter((c) => {
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.problem || "").toLowerCase().includes(q) ||
        (c.latestStatus || "").toLowerCase().includes(q)
      );
    });
  }, [bookedClients, search]);

  // ✅ show chat only if confirmed + online
  const canChat = (c) => {
    const okStatus = String(c.latestStatus || "").toLowerCase() === "confirmed";
    const okMode = String(c.mode || "").toLowerCase() === "online";
    return okStatus && okMode && !!c.appointmentId;
  };

  const goBack = () => navigation.goBack();
  const goHome = () => navigation.navigate("CounsellorHome");

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.headerCard}>
        <View style={s.headerRow}>
          <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={goBack}>
            <Feather name="arrow-left" size={22} color="#111" />
          </TouchableOpacity>

          <Text style={s.title}>
            <Text style={s.titleAccent}>Booked</Text>
            <Text style={s.titleMain}>Clients.</Text>
          </Text>

          <TouchableOpacity activeOpacity={0.9} onPress={onRefresh} style={s.refreshBtn}>
            {refreshing ? <ActivityIndicator color="#111" /> : <Feather name="refresh-cw" size={18} color="#111" />}
          </TouchableOpacity>
        </View>

        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Feather name="search" size={16} color="#9A9A9A" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search name, email, status, problem..."
              placeholderTextColor="#9A9A9A"
              style={s.searchInput}
            />
            {!!search && (
              <TouchableOpacity activeOpacity={0.8} onPress={() => setSearch("")} style={s.clearBtn}>
                <Feather name="x" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={s.miniHint}>Showing clients who booked sessions with you (from appointments).</Text>
      </View>

      {/* Body */}
      <View style={s.bodyWrap}>
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={ORANGE} />
            <Text style={s.loadingTxt}>Loading booked clients…</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.hScrollContent}
            snapToInterval={SCREEN_W * 0.82 + 18}
            decelerationRate="fast"
          >
            {filtered.map((c) => (
              <View key={c.id} style={s.card}>
                <View style={s.topRow}>
                  <View style={s.avatar} />

                  <View style={[s.statusPill, { borderColor: statusColor(c.latestStatus) }]}>
                    <View style={[s.dot, { backgroundColor: statusColor(c.latestStatus) }]} />
                    <Text style={[s.statusTxt, { color: statusColor(c.latestStatus) }]}>
                      {String(c.latestStatus || "pending").toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={s.name}>{c.name}</Text>

                {!!c.latestWhen && (
                  <View style={s.rowLine}>
                    <Feather name="calendar" size={14} color={ORANGE} />
                    <Text style={s.rowText}>{c.latestWhen}</Text>
                  </View>
                )}

                {!!c.problem && (
                  <View style={s.rowLine}>
                    <Feather name="activity" size={14} color={ORANGE} />
                    <Text style={s.rowText}>
                      {c.problem}
                      {(c.mode || c.language) ? ` • ${c.mode || ""}${c.language ? `, ${c.language}` : ""}` : ""}
                    </Text>
                  </View>
                )}

                {!!c.email && (
                  <View style={s.rowLine}>
                    <Feather name="mail" size={14} color={ORANGE} />
                    <Text style={s.rowText}>{c.email}</Text>
                  </View>
                )}

                {!!c.phone && (
                  <View style={s.rowLine}>
                    <Feather name="phone" size={14} color={ORANGE} />
                    <Text style={s.rowText}>{c.phone}</Text>
                  </View>
                )}

                <View style={s.descBox}>
                  <Text style={s.descTitle}>Notes</Text>
                  <Text style={s.descText} numberOfLines={4}>
                    {c.desc ? c.desc : "No description provided by client."}
                  </Text>
                </View>

                <View style={s.actionsRow}>
                  {/* ✅ Chat icon only if confirmed + Online */}
                  {canChat(c) && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={s.actionBtn}
                      onPress={() =>
                        navigation.navigate("CounsellorChat", {
                          appointmentId: c.appointmentId,
                          userName: c.name,
                        })
                      }
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#111" />
                      <Text style={s.actionTxt}>Chat</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={s.actionBtn}
                    onPress={() => Alert.alert("Client Profile", "Hook this to a client details page later.")}
                  >
                    <Ionicons name="person-outline" size={18} color="#111" />
                    <Text style={s.actionTxt}>Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {filtered.length === 0 && (
              <View style={[s.card, { justifyContent: "center" }]}>
                <Text style={s.emptyTitle}>No booked clients found</Text>
                <Text style={s.emptySub}>If users haven’t booked yet, this list stays empty. Try refresh.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Bottom nav */}
      <View style={s.bottomWrap}>
        <View style={s.bottomPill}>
          <TouchableOpacity activeOpacity={0.85} style={s.pillBtn} onPress={() => console.log("Stats later")}>
            <Feather name="bar-chart-2" size={22} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={[s.pillBtn, s.pillBtnActive]} onPress={goHome}>
            <Feather name="home" size={22} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={s.pillBtn} onPress={() => console.log("Add later")}>
            <Feather name="user-plus" size={22} color="#111" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 5,
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...shadow,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  title: { fontSize: 24, fontWeight: "900" },
  titleAccent: { color: ORANGE, fontWeight: "900" },
  titleMain: { color: "#111", fontWeight: "900" },

  searchRow: { flexDirection: "row" },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F2F2F2",
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111",
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  miniHint: { marginTop: 10, fontSize: 12, color: "#777", fontWeight: "700" },

  bodyWrap: { flex: 1, paddingTop: 18 },

  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingTxt: { fontSize: 13, fontWeight: "800", color: "#666" },

  hScrollContent: { paddingHorizontal: 18, paddingBottom: 140 },

  card: {
    width: SCREEN_W * 0.82,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginRight: 18,
    ...shadow,
  },

  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#D9D9D9",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dot: { width: 9, height: 9, borderRadius: 99 },
  statusTxt: { fontSize: 11, fontWeight: "900" },

  name: { marginTop: 12, fontSize: 20, fontWeight: "900", color: "#111" },

  rowLine: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },

  rowText: { fontSize: 13, color: ORANGE, fontWeight: "800", flex: 1 },

  descBox: {
    width: "100%",
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDEDED",
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...shadow,
  },

  descTitle: { fontSize: 12, fontWeight: "900", color: "#111", marginBottom: 6 },
  descText: { fontSize: 13, color: "#777", fontWeight: "700", lineHeight: 18 },

  actionsRow: { marginTop: 14, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F2F2F2",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E3E3E3",
  },
  actionTxt: { fontSize: 12, fontWeight: "900", color: "#111" },

  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#111", marginBottom: 6 },
  emptySub: { fontSize: 13, color: "#777", fontWeight: "700" },

  sidePill: {
    position: "absolute",
    right: 0,
    top: "60%",
    width: 56,
    height: 110,
    backgroundColor: ORANGE,
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: -2, height: 2 },
  },

  bottomWrap: { position: "absolute", left: 0, right: 0, bottom: 18, alignItems: "center" },

  bottomPill: {
    width: "78%",
    height: 58,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    ...shadow,
  },

  pillBtn: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pillBtnActive: { backgroundColor: "#F2F2F2" },
});

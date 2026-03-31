// src/screens/Municipality/MunicipalityHomeScreen.jsx
// ✅ Municipality UI like Police (Assign + Resolve only)
// - No editor, no text update
// - Uses backend:
//    GET   /api/municipality/reports?mode=all|assigned&status=All|Open|Assigned|Resolved&category=All|Waste|Road&q=...
//    PATCH /api/municipality/reports/:id   body: { take:true } OR { status:"Resolved" }

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/* -------------------- API Helpers -------------------- */
async function muniGET(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

async function muniPATCH(path, token, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Update failed");
  return data;
}

/* -------------------- UI Helpers -------------------- */
function timeAgo(dateLike) {
  if (!dateLike) return "just now";
  const t = new Date(dateLike).getTime();
  if (Number.isNaN(t)) return "just now";
  const diffMs = Date.now() - t;
  const s = Math.max(0, Math.floor(diffMs / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function MunicipalityHomeScreen({ navigation }) {
  const UI = useMemo(
    () => ({
      bg: "#0B0F14",
      card: "#111826",
      card2: "#0F172A",
      text: "#EAF0FF",
      mut: "rgba(234,240,255,0.68)",
      line: "rgba(255,255,255,0.08)",
      accent: "#7C3AED", // municipality purple
      ok: "#22C55E",
      warn: "#F59E0B",
      danger: "#EF4444",
    }),
    []
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All"); // All/Open/Assigned/Resolved
  const [mode, setMode] = useState("all"); // all/assigned
  const [category, setCategory] = useState("All"); // All/Waste/Road

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [officerName, setOfficerName] = useState("Municipality Officer");
  const [officerEmail, setOfficerEmail] = useState("");

  const debounceRef = useRef(null);
  const didMountRef = useRef(false);

  const counts = useMemo(() => {
    const open = reports.filter((r) => r.status === "Open").length;
    const assigned = reports.filter((r) => r.status === "Assigned").length;
    const resolved = reports.filter((r) => r.status === "Resolved").length;
    return { open, assigned, resolved };
  }, [reports]);

  const statusTone = (st) => (st === "Resolved" ? UI.ok : st === "Assigned" ? UI.accent : UI.danger);

  const categoryTagTone = (typeText) => {
    const t = String(typeText || "").toLowerCase();
    const isRoad = /road|pothole|street\s*light|traffic\s*light/i.test(t);
    const isWaste = /waste|garbage|trash|litter|drain|drainage|sewage/i.test(t);
    if (isRoad) return UI.warn;
    if (isWaste) return UI.accent;
    return UI.ok;
  };

  const getToken = async () => AsyncStorage.getItem("token");

  const loadOfficer = async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return;
      const u = JSON.parse(raw);
      if (u?.fullName) setOfficerName(u.fullName);
      if (u?.email) setOfficerEmail(u.email);
    } catch {
      // ignore
    }
  };

  const apiGetReports = async ({ token }) => {
    const params = new URLSearchParams();
    params.append("mode", mode);
    params.append("status", status);
    params.append("category", category);
    if (query.trim()) params.append("q", query.trim());

    const data = await muniGET(`/api/municipality/reports?${params.toString()}`, token);
    return data;
  };

  const normalize = (list) =>
    (Array.isArray(list) ? list : []).map((r) => ({
      ...r,
      id: r.reportCode || r.id || r._id,
      time: r.time || timeAgo(r.createdAt),
      type: r.type || "Complaint",
      area: r.area || "Unknown area",
      description: r.description || "",
      status: r.status || "Open",
      priority: r.priority || "Medium",
    }));

  const loadAll = useCallback(
    async ({ showSpinner = false } = {}) => {
      try {
        if (showSpinner) setLoading(true);

        const token = await getToken();
        if (!token) {
          setLoading(false);
          setRefreshing(false);
          Alert.alert("Login required", "Token not found. Please login again.");
          return;
        }

        const res = await apiGetReports({ token });
        const list = normalize(res?.reports);
        setReports(list);
      } catch (e) {
        Alert.alert("Municipality", e?.message || "Failed to load complaints");
        setReports([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mode, status, category, query]
  );

  useEffect(() => {
    loadOfficer();
    loadAll({ showSpinner: true });
    didMountRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce query (like police)
  useEffect(() => {
    if (!didMountRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadAll({ showSpinner: false }), 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, loadAll]);

  // immediate load on filter change
  useEffect(() => {
    if (!didMountRef.current) return;
    loadAll({ showSpinner: false });
  }, [mode, status, category, loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll({ showSpinner: false });
  };

  const onAssignToMe = (r) => {
    Alert.alert("Assign", `Assign ${r.id} to you?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Assign",
        onPress: async () => {
          try {
            const token = await getToken();
            if (!token) return Alert.alert("Login required", "Token missing.");

            // ✅ municipality uses take:true (your controller supports this)
            await muniPATCH(`/api/municipality/reports/${r._id}`, token, { take: true });

            await loadAll({ showSpinner: false });
          } catch (e) {
            Alert.alert("Error", e?.message || "Failed to assign complaint");
          }
        },
      },
    ]);
  };

  const onResolve = (r) => {
    Alert.alert("Resolve", `Mark ${r.id} as resolved?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve",
        onPress: async () => {
          try {
            const token = await getToken();
            if (!token) return Alert.alert("Login required", "Token missing.");

            // ✅ resolve (controller requires assignedTo = you)
            await muniPATCH(`/api/municipality/reports/${r._id}`, token, { status: "Resolved" });

            await loadAll({ showSpinner: false });
          } catch (e) {
            Alert.alert("Error", e?.message || "Failed to resolve complaint");
          }
        },
      },
    ]);
  };

  const logout = async () => {
    Alert.alert("Logout?", "You will be returned to the login screen.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
      <ScrollView
        contentContainerStyle={s.page}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.text} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: UI.text }]}>
              Municipality <Text style={{ color: UI.accent, fontWeight: "900" }}>Desk</Text>
            </Text>
            <Text style={[s.sub, { color: UI.mut }]} numberOfLines={1}>
              Officer: <Text style={{ color: UI.text, fontWeight: "900" }}>{officerName}</Text>
              {officerEmail ? ` • ${officerEmail}` : ""}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity activeOpacity={0.9} style={[s.roundBtn, { borderColor: UI.line }]} onPress={() => loadAll({ showSpinner: true })}>
              <Ionicons name="refresh-outline" size={20} color={UI.text} />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} style={[s.roundBtn, { borderColor: UI.line }]} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color={UI.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats row like police */}
        <View style={s.statsRow}>
          <StatPill label="Open" value={counts.open} color={UI.danger} UI={UI} />
          <StatPill label="Assigned" value={counts.assigned} color={UI.accent} UI={UI} />
          <StatPill label="Resolved" value={counts.resolved} color={UI.ok} UI={UI} />
        </View>

        {/* Search */}
        <View style={[s.searchBox, { borderColor: UI.line, backgroundColor: UI.card }]}>
          <Ionicons name="search-outline" size={18} color={UI.mut} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search type, area, status..."
            placeholderTextColor="rgba(234,240,255,0.45)"
            style={[s.searchInput, { color: UI.text }]}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery("")} style={s.clearBtn}>
              <Ionicons name="close-circle" size={20} color={UI.mut} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={[s.panel, { borderColor: UI.line, backgroundColor: UI.card }]}>
          <Text style={[s.panelTitle, { color: UI.text }]}>Filters</Text>

          <Text style={[s.lbl, { color: UI.mut }]}>Mode</Text>
          <View style={s.chips}>
            {[
              { k: "assigned", t: "My Assigned" },
              { k: "all", t: "All Complaints" },
            ].map((x) => {
              const active = mode === x.k;
              return (
                <TouchableOpacity
                  key={x.k}
                  activeOpacity={0.9}
                  onPress={() => setMode(x.k)}
                  style={[s.chip, { borderColor: UI.line, backgroundColor: active ? UI.card2 : UI.card }]}
                >
                  <Text style={{ color: active ? UI.text : UI.mut, fontWeight: "900", fontSize: 12 }}>{x.t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.lbl, { color: UI.mut }]}>Category</Text>
          <View style={s.chips}>
            {["All", "Waste", "Road"].map((c) => {
              const active = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.9}
                  onPress={() => setCategory(c)}
                  style={[s.chip, { borderColor: UI.line, backgroundColor: active ? UI.card2 : UI.card }]}
                >
                  <Text style={{ color: active ? UI.text : UI.mut, fontWeight: "900", fontSize: 12 }}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.lbl, { color: UI.mut }]}>Status</Text>
          <View style={s.chips}>
            {["All", "Open", "Assigned", "Resolved"].map((st) => {
              const active = status === st;
              return (
                <TouchableOpacity
                  key={st}
                  activeOpacity={0.9}
                  onPress={() => setStatus(st)}
                  style={[s.chip, { borderColor: UI.line, backgroundColor: active ? UI.card2 : UI.card }]}
                >
                  <Text style={{ color: active ? UI.text : UI.mut, fontWeight: "900", fontSize: 12 }}>{st}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* List section like police */}
        <View style={[s.section, { borderColor: UI.line, backgroundColor: UI.card }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[s.sectionTitle, { color: UI.text }]}>Complaints Queue</Text>

            {loading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color={UI.text} />
                <Text style={{ color: UI.mut, fontSize: 12, fontWeight: "800" }}>Loading…</Text>
              </View>
            ) : null}
          </View>

          {!loading && reports.length === 0 ? (
            <View style={[s.empty, { borderColor: UI.line }]}>
              <Ionicons name="alert-circle-outline" size={20} color={UI.warn} />
              <Text style={[s.emptyTxt, { color: UI.mut }]}>No complaints found.</Text>
            </View>
          ) : null}

          {reports.map((r) => {
            const stTone = statusTone(r.status);
            const catTone = categoryTagTone(r.type);

            return (
              <View key={r._id} style={[s.reportCard, { borderColor: UI.line, backgroundColor: UI.card2 }]}>
                <View style={s.reportTop}>
                  <Text style={[s.reportId, { color: UI.text }]}>{r.id}</Text>

                  <View style={[s.badge, { borderColor: UI.line, backgroundColor: "rgba(0,0,0,0.15)" }]}>
                    <View style={[s.dot, { backgroundColor: catTone }]} />
                    <Text style={[s.badgeTxt, { color: UI.text }]} numberOfLines={1}>
                      {r.type}
                    </Text>
                  </View>
                </View>

                {!!r.description && (
                  <Text style={{ color: UI.mut, marginTop: 8, fontSize: 12, fontWeight: "700" }} numberOfLines={2}>
                    {r.description}
                  </Text>
                )}

                <View style={s.metaRow}>
                  <Ionicons name="location-outline" size={14} color={UI.mut} />
                  <Text style={[s.metaTxt, { color: UI.mut }]}>{r.area}</Text>
                  <Text style={[s.metaDot, { color: UI.mut }]}>•</Text>
                  <Ionicons name="time-outline" size={14} color={UI.mut} />
                  <Text style={[s.metaTxt, { color: UI.mut }]}>{r.time || "just now"}</Text>
                </View>

                <View style={s.actionsRow}>
                  <View style={[s.statusPill, { borderColor: UI.line }]}>
                    <View style={[s.dot, { backgroundColor: stTone }]} />
                    <Text style={[s.statusTxt, { color: UI.text }]}>{r.status}</Text>
                  </View>

                  {/* ✅ Assign button only if unassigned/open */}
                  {r.status !== "Assigned" && r.status !== "Resolved" && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => onAssignToMe(r)}
                      style={[s.actionBtn, { borderColor: UI.line }]}
                    >
                      <Ionicons name="person-add-outline" size={16} color={UI.text} />
                      <Text style={[s.actionTxt, { color: UI.text }]}>Assign</Text>
                    </TouchableOpacity>
                  )}

                  {/* ✅ Resolve button (backend will block if not assigned to you) */}
                  {r.status !== "Resolved" && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => onResolve(r)}
                      style={[s.actionBtn, { borderColor: UI.line }]}
                    >
                      <Ionicons name="checkmark-done-outline" size={16} color={UI.ok} />
                      <Text style={[s.actionTxt, { color: UI.text }]}>Resolve</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[s.footer, { color: UI.mut }]}>Live backend: GET /api/municipality/reports ✅</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------- Small Component -------------------- */
function StatPill({ label, value, color, UI }) {
  return (
    <View style={[s.stat, { borderColor: UI.line, backgroundColor: UI.card }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={[s.dot, { backgroundColor: color }]} />
        <Text style={{ color: UI.mut, fontSize: 12, fontWeight: "800" }}>{label}</Text>
      </View>
      <Text style={{ color: UI.text, fontSize: 18, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

/* -------------------- Styles -------------------- */
const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { padding: 16, paddingBottom: 26 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 4, fontSize: 13, lineHeight: 18 },

  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, justifyContent: "space-between", minHeight: 74 },

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

  panel: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  panelTitle: { fontSize: 14, fontWeight: "900", marginBottom: 10 },
  lbl: { fontSize: 12, fontWeight: "800", marginBottom: 6 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },

  section: { borderWidth: 1, borderRadius: 18, padding: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "900", marginBottom: 10 },

  empty: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  emptyTxt: { fontSize: 12, fontWeight: "700" },

  reportCard: { borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 10 },
  reportTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  reportId: { fontSize: 12, fontWeight: "900", opacity: 0.95, maxWidth: 120 },

  badge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeTxt: { fontSize: 11, fontWeight: "900", flex: 1 },

  dot: { width: 9, height: 9, borderRadius: 99 },

  metaRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaTxt: { fontSize: 12, fontWeight: "700" },
  metaDot: { marginHorizontal: 4, fontSize: 12, fontWeight: "900" },

  actionsRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusTxt: { fontSize: 11, fontWeight: "900" },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionTxt: { fontSize: 11, fontWeight: "900" },

  footer: { marginTop: 12, fontSize: 12, lineHeight: 17 },
});

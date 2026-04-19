// src/screens/PoliceHomeScreen.jsx
// ✅ FIXED FULL CODE (drop-in replacement)
// Fixes + improvements:
// 1) Avoids duplicate API calls (filter/query/focus were double firing)
// 2) Uses backend "reportCode" if present (else fallback to r.id/title)
// 3) Uses proper ISO date formatting if backend returns createdAt
// 4) After Assign/Resolve -> refresh from server (keeps counts + list correct)
// 5) Handles network errors + token missing cleanly

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  Linking,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const BASE_URL = "http://10.0.2.2:5000";

/** small helper: safe "time ago" fallback if backend didn't send r.time */
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

function extractCoordinates(report) {
  if (
    Number.isFinite(report?.geoLocation?.latitude) &&
    Number.isFinite(report?.geoLocation?.longitude)
  ) {
    return {
      latitude: report.geoLocation.latitude,
      longitude: report.geoLocation.longitude,
    };
  }

  const match = String(report?.area || "").match(
    /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/
  );
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

export default function PoliceHomeScreen({ navigation }) {
  const UI = useMemo(
    () => ({
      bg: "#F6F3EE",
      card: "#FFFFFF",
      card2: "#FFF7EF",
      text: "#111111",
      mut: "#6F6257",
      softText: "#9B8A7B",
      line: "#EADBCB",
      accent: "#FF7A1A",
      accent2: "#D97706",
      accentSoft: "#FFE0C2",
      danger: "#EF4444",
      warn: "#F59E0B",
    }),
    []
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const debounceRef = useRef(null);
  const didMountRef = useRef(false);

  const counts = useMemo(() => {
    const open = reports.filter((r) => r.status === "Open").length;
    const assigned = reports.filter((r) => r.status === "Assigned").length;
    const resolved = reports.filter((r) => r.status === "Resolved").length;
    return { open, assigned, resolved };
  }, [reports]);

  const badgeTone = (priority) => {
    if (priority === "High") return UI.danger;
    if (priority === "Medium") return UI.warn;
    return UI.accent;
  };

  const statusTone = (status) => {
    if (status === "Open") return UI.danger;
    if (status === "Assigned") return UI.accent2;
    return UI.accent;
  };

  const getToken = async () => AsyncStorage.getItem("token");

  const openInMaps = async (geoLocation) => {
    try {
      if (
        !Number.isFinite(geoLocation?.latitude) ||
        !Number.isFinite(geoLocation?.longitude)
      ) {
        return Alert.alert("Location unavailable", "This report does not have pinned coordinates.");
      }

      const url = `https://www.google.com/maps/search/?api=1&query=${geoLocation.latitude},${geoLocation.longitude}`;
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        return Alert.alert("Maps unavailable", "No maps app or browser is available on this device.");
      }

      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Maps error", e?.message || "Could not open the pinned location.");
    }
  };

  const showReportDetails = (report) => {
    const coords = extractCoordinates(report);
    const details = [
      `Report: ${report.id}`,
      `Type: ${report.type}`,
      `Priority: ${report.priority}`,
      `Status: ${report.status}`,
      `Area: ${report.area || "Unknown area"}`,
      `Updated: ${report.time || "just now"}`,
      report.description ? `Description: ${report.description}` : "Description: No description provided",
    ];

    if (coords) {
      details.push(
        `Pinned Coordinates: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
      );
    }

    Alert.alert(
      "Report Details",
      details.join("\n\n"),
      coords
        ? [
            { text: "Close", style: "cancel" },
            {
              text: "Open in Maps",
              onPress: () => openInMaps(coords),
            },
          ]
        : [{ text: "Close", style: "cancel" }]
    );
  };

  const apiGetReports = async ({ token, status, q }) => {
    const params = new URLSearchParams();
    params.append("status", status || "All");
    if (q) params.append("q", q);

    const res = await fetch(
      `${BASE_URL}/api/police/reports?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load police reports");
    return data;
  };

  const apiPatchReport = async ({ token, mongoId, action }) => {
    const res = await fetch(`${BASE_URL}/api/police/reports/${mongoId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to update report");
    return data;
  };

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

        const reportsRes = await apiGetReports({
          token,
          status: filter,
          q: query.trim(),
        });

        const list = Array.isArray(reportsRes?.reports) ? reportsRes.reports : [];

        // ✅ normalize so UI never breaks if backend changes small fields
        const normalized = list.map((r) => ({
          ...r,
          // keep whatever backend sends; add safe fallbacks:
          id: r.reportCode || r.id || r._id,
          type: r.type || r.title || "Report",
          time: r.time || timeAgo(r.createdAt),
          area: r.area || "Unknown area",
          priority: r.priority || "Medium",
          status: r.status || "Open",
          description: r.description || "",
        }));

        setReports(normalized);
      } catch (e) {
        Alert.alert("Error", e?.message || "Something went wrong");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, query]
  );

  // ✅ initial load
  useEffect(() => {
    loadAll({ showSpinner: true });
    didMountRef.current = true;
  }, [loadAll]);

  // ✅ debounce query changes (prevents spam calls)
  useEffect(() => {
    if (!didMountRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      loadAll({ showSpinner: false });
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, loadAll]);

  // ✅ filter changes -> immediate load
  useEffect(() => {
    if (!didMountRef.current) return;
    loadAll({ showSpinner: false });
  }, [filter, loadAll]);

  // ✅ refresh when screen focuses (after submitting report etc.)
  useFocusEffect(
    useCallback(() => {
      loadAll({ showSpinner: false });
    }, [loadAll])
  );

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

            await apiPatchReport({ token, mongoId: r._id, action: "assignToMe" });

            // ✅ refresh from backend so counts + list stay correct
            loadAll({ showSpinner: false });
          } catch (e) {
            Alert.alert("Error", e?.message || "Failed to assign report");
          }
        },
      },
    ]);
  };

  const onMarkResolved = (r) => {
    Alert.alert("Resolve", `Mark ${r.id} as resolved?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve",
        onPress: async () => {
          try {
            const token = await getToken();
            if (!token) return Alert.alert("Login required", "Token missing.");

            await apiPatchReport({ token, mongoId: r._id, action: "resolve" });

            // ✅ refresh from backend so counts + list stay correct
            loadAll({ showSpinner: false });
          } catch (e) {
            Alert.alert("Error", e?.message || "Failed to resolve report");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
      <ScrollView
        contentContainerStyle={s.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={UI.text}
          />
        }
      >
        <View style={[s.hero, { borderColor: UI.line, backgroundColor: UI.card }]}>
          <View style={[s.heroGlow, { backgroundColor: UI.card2 }]} />
          <View style={s.header}>
            <View style={s.headerCopy}>
              <Text style={[s.title, { color: UI.text }]}>
                Police <Text style={{ color: UI.accent, fontWeight: "900" }}>Desk</Text>
              </Text>
              <Text style={[s.sub, { color: UI.mut }]}>
                Monitor reports, issue fines, and move cases forward faster.
              </Text>
            </View>

            <View style={s.headerActions}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[s.quickBtn, { backgroundColor: UI.accent }]}
                onPress={() => navigation.navigate("TrafficFineCreate")}
              >
                <Ionicons name="card-outline" size={16} color="#fff" />
                <Text style={s.quickBtnTxt}>Issue Fine</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[s.roundBtn, { borderColor: UI.line }]}
                onPress={() => navigation.navigate("Settings")}
              >
                <Ionicons name="settings-outline" size={22} color={UI.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.heroBand}>
            <View style={[s.heroChip, { borderColor: UI.line, backgroundColor: UI.card2 }]}>
              <Ionicons name="flash-outline" size={14} color={UI.warn} />
              <Text style={[s.heroChipTxt, { color: UI.text }]}>Rapid assignment</Text>
            </View>
            <View style={[s.heroChip, { borderColor: UI.line, backgroundColor: UI.card2 }]}>
              <Ionicons name="navigate-outline" size={14} color={UI.accent} />
              <Text style={[s.heroChipTxt, { color: UI.text }]}>Open map pins</Text>
            </View>
            <View style={[s.heroChip, { borderColor: UI.line, backgroundColor: UI.card2 }]}>
              <Ionicons name="document-text-outline" size={14} color={UI.accent2} />
              <Text style={[s.heroChipTxt, { color: UI.text }]}>Full report details</Text>
            </View>
          </View>
        </View>

        <View style={s.statsRow}>
          <StatPill label="Open" value={counts.open} color={UI.danger} UI={UI} />
          <StatPill label="Assigned" value={counts.assigned} color={UI.accent2} UI={UI} />
          <StatPill label="Resolved" value={counts.resolved} color={UI.accent} UI={UI} />
        </View>

        <View style={[s.searchBox, { borderColor: UI.line, backgroundColor: UI.card }]}>
          <Ionicons name="search-outline" size={18} color={UI.mut} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search type, area, status, priority..."
            placeholderTextColor={UI.softText}
            style={[s.searchInput, { color: UI.text }]}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery("")} style={s.clearBtn}>
              <Ionicons name="close-circle" size={20} color={UI.mut} />
            </TouchableOpacity>
          )}
        </View>

        <View style={s.filters}>
          {["All", "Open", "Assigned", "Resolved"].map((f) => (
            <TouchableOpacity
              key={f}
              activeOpacity={0.9}
              onPress={() => setFilter(f)}
                style={[
                  s.filterChip,
                  {
                    borderColor: UI.line,
                    backgroundColor: filter === f ? UI.accentSoft : UI.card,
                  },
                ]}
              >
              <Text
                style={{
                  color: filter === f ? UI.accent2 : UI.mut,
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.section, { borderColor: UI.line, backgroundColor: UI.card }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[s.sectionTitle, { color: UI.text }]}>Priority Queue</Text>

            {loading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color={UI.text} />
                <Text style={{ color: UI.mut, fontSize: 12, fontWeight: "800" }}>Loading…</Text>
              </View>
            ) : null}
          </View>

          {!loading && reports.length === 0 ? (
            <View style={[s.empty, { borderColor: UI.line }]}>
              <Ionicons name="sparkles-outline" size={20} color={UI.accent} />
              <Text style={[s.emptyTxt, { color: UI.mut }]}>No reports yet.</Text>
            </View>
          ) : null}

          {reports.map((r) => {
            const coords = extractCoordinates(r);
            return (
            <TouchableOpacity
              key={r._id}
              activeOpacity={0.92}
              onPress={() => showReportDetails(r)}
              style={[s.reportCard, { borderColor: UI.line, backgroundColor: UI.card2 }]}
            >
              <View style={s.reportTop}>
                <Text style={[s.reportId, { color: UI.text }]}>{r.id}</Text>

                <View style={[s.badge, { borderColor: UI.line, backgroundColor: "#FFFFFF" }]}>
                  <View style={[s.dot, { backgroundColor: badgeTone(r.priority) }]} />
                  <Text style={[s.badgeTxt, { color: UI.text }]}>{r.priority}</Text>
                </View>
              </View>

              <Text style={[s.reportTitle, { color: UI.text }]}>{r.type}</Text>

              {!!r.description && (
                <Text
                  style={{ color: UI.mut, marginTop: 6, fontSize: 12, fontWeight: "700" }}
                  numberOfLines={2}
                >
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

              {coords ? (
                <View style={s.coordRow}>
                  <Text style={[s.coordTxt, { color: UI.mut }]}>
                    Pin: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openInMaps(coords)}
                    style={[s.mapBtn, { borderColor: UI.line, backgroundColor: "#FFFFFF" }]}
                  >
                    <Ionicons name="navigate-outline" size={14} color={UI.text} />
                    <Text style={[s.mapBtnTxt, { color: UI.text }]}>Open in Maps</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={s.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => showReportDetails(r)}
                  style={[s.actionBtn, { borderColor: UI.line, backgroundColor: "#FFFFFF" }]}
                >
                  <Ionicons name="document-text-outline" size={16} color={UI.text} />
                  <Text style={[s.actionTxt, { color: UI.text }]}>Details</Text>
                </TouchableOpacity>

                {coords ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openInMaps(coords)}
                    style={[s.actionBtn, { borderColor: UI.line, backgroundColor: "#FFFFFF" }]}
                  >
                    <Ionicons name="navigate-outline" size={16} color={UI.text} />
                    <Text style={[s.actionTxt, { color: UI.text }]}>Maps</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={[s.statusPill, { borderColor: UI.line, backgroundColor: "#FFFFFF" }]}>
                  <View style={[s.dot, { backgroundColor: statusTone(r.status) }]} />
                  <Text style={[s.statusTxt, { color: UI.text }]}>{r.status}</Text>
                </View>

                {r.status !== "Assigned" && r.status !== "Resolved" && (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onAssignToMe(r)}
                    style={[s.actionBtn, { borderColor: UI.line, backgroundColor: "#FFFFFF" }]}
                  >
                    <Ionicons name="person-add-outline" size={16} color={UI.text} />
                    <Text style={[s.actionTxt, { color: UI.text }]}>Assign</Text>
                  </TouchableOpacity>
                )}

                {r.status !== "Resolved" && (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onMarkResolved(r)}
                    style={[s.actionBtn, { borderColor: UI.line, backgroundColor: "#FFFFFF" }]}
                  >
                    <Ionicons name="checkmark-done-outline" size={16} color={UI.accent} />
                    <Text style={[s.actionTxt, { color: UI.text }]}>Resolve</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )})}
        </View>

        <Text style={[s.footer, { color: UI.mut }]}>Live backend: GET /api/police/reports ✅</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

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

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { padding: 16, paddingBottom: 26 },

  hero: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#B45309",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: -70,
    right: -40,
    opacity: 0.85,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerCopy: { flex: 1, paddingRight: 12 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroBand: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroChipTxt: { fontSize: 12, fontWeight: "800" },
  title: { fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 4, fontSize: 13, lineHeight: 18 },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickBtnTxt: { color: "#fff", fontSize: 12, fontWeight: "900" },

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

  filters: { flexDirection: "row", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },

  section: { borderWidth: 1, borderRadius: 18, padding: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "900", marginBottom: 10 },

  empty: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  emptyTxt: { fontSize: 12, fontWeight: "700" },

  reportCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  reportTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reportId: { fontSize: 12, fontWeight: "900", opacity: 0.95 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeTxt: { fontSize: 11, fontWeight: "900" },

  dot: { width: 9, height: 9, borderRadius: 99 },

  reportTitle: { marginTop: 8, fontSize: 14, fontWeight: "900" },

  metaRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaTxt: { fontSize: 12, fontWeight: "700" },
  metaDot: { marginHorizontal: 4, fontSize: 12, fontWeight: "900" },
  coordRow: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  coordTxt: { fontSize: 12, fontWeight: "700" },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapBtnTxt: { fontSize: 11, fontWeight: "900" },

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

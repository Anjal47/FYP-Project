import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ORANGE = "#FF7A1A";
const BASE_URL = "http://10.0.2.2:5000";

async function apiGetReportStatus(token, reportCode) {
  const res = await fetch(
    `${BASE_URL}/api/reports/status/${encodeURIComponent(reportCode)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to fetch report status");
  return data;
}

async function apiGetMyReports(token) {
  const res = await fetch(`${BASE_URL}/api/reports/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load your reports");
  return data;
}

function isWasteReport(r) {
  const t = `${r?.type || ""}`.toLowerCase();
  const c = `${r?.category || ""}`.toLowerCase();
  const m = `${r?.module || ""}`.toLowerCase();
  return (
    t.includes("waste") ||
    c.includes("waste") ||
    m.includes("waste") ||
    t.includes("garbage") ||
    t.includes("dump")
  );
}

function normalizeStatus(s) {
  const v = `${s || ""}`.trim().toLowerCase();
  if (!v) return "Open";
  if (v === "resolved") return "Resolved";
  if (v === "assigned") return "Assigned";
  if (v === "in progress" || v === "inprogress") return "In Progress";
  return s;
}

function normalizePriority(p) {
  const v = `${p || ""}`.trim().toLowerCase();
  if (!v) return "Medium";
  if (v === "high") return "High";
  if (v === "low") return "Low";
  return p;
}

export default function WasteReportStatusScreen({ navigation, route }) {
  const [reportId, setReportId] = useState(route?.params?.reportCode || "");
  const [checking, setChecking] = useState(false);

  const [myReports, setMyReports] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusChip, setStatusChip] = useState("All"); // ✅ UI add: filter chips (optional)
  const [priorityChip, setPriorityChip] = useState("All"); // ✅ UI add: filter chips (optional)

  const getToken = async () => AsyncStorage.getItem("token");
  const handleBack = () => navigation.goBack();
  const handleHomePress = () => navigation.navigate("Home");

  const showStatusAlert = (r) => {
    Alert.alert(
      "Waste Report Status ✅",
      `Report: ${r?.reportCode || r?.id}\nType: ${r?.type}\nArea: ${r?.area}\nPriority: ${r?.priority}\n\nStatus: ${r?.status}\nUpdated: ${r?.time || "recently"}`
    );
  };

  const loadMyReports = async (showSpinner = false) => {
    try {
      if (showSpinner) setListLoading(true);

      const token = await getToken();
      if (!token) {
        setListLoading(false);
        return Alert.alert("Login required", "Token not found. Please login again.");
      }

      const data = await apiGetMyReports(token);
      setMyReports(Array.isArray(data?.reports) ? data.reports : []);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to load your reports");
      setMyReports([]);
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMyReports(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyReports(false);
  };

  const wasteReports = useMemo(() => myReports.filter(isWasteReport), [myReports]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = wasteReports;

    // ✅ UI add: chip filters
    if (statusChip !== "All") {
      list = list.filter((r) => normalizeStatus(r?.status) === statusChip);
    }
    if (priorityChip !== "All") {
      list = list.filter((r) => normalizePriority(r?.priority) === priorityChip);
    }

    if (!q) return list;

    return list.filter((r) => {
      const hay = [
        r?.reportCode,
        r?.id,
        r?.type,
        r?.area,
        r?.status,
        r?.priority,
        r?.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [wasteReports, search, statusChip, priorityChip]);

  const handleCheckStatus = async () => {
    const code = reportId.trim();
    if (!code) return Alert.alert("Missing ID", "Please enter your report ID.");

    try {
      setChecking(true);
      const token = await getToken();
      if (!token) return Alert.alert("Login required", "Token not found. Please login again.");

      const data = await apiGetReportStatus(token, code);
      const live = data?.report;

      if (live && !isWasteReport(live)) {
        return Alert.alert("Not Waste", "This report ID is not a Waste Management report.");
      }

      showStatusAlert(live);
    } catch (e) {
      Alert.alert("Error", e.message || "Something went wrong");
    } finally {
      setChecking(false);
    }
  };

  const onPressReportRow = async (r) => {
    const code = r?.reportCode || r?.id;
    if (!code) return;

    setReportId(code);

    try {
      const token = await getToken();
      if (!token) return showStatusAlert(r);

      const data = await apiGetReportStatus(token, code);
      showStatusAlert(data?.report || r);
    } catch {
      showStatusAlert(r);
    }
  };

  const chip = (label, active, onPress, icon) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.chip, active && styles.chipActive]}
    >
      {!!icon && (
        <Icon
          name={icon}
          size={14}
          color={active ? "#111" : "#666"}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ UI tweak: header card + subtitle + cleaner spacing */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={handleBack} activeOpacity={0.9}>
          <View style={styles.backIconWrap}>
            <Icon name="arrow-left" size={18} color="#111" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              <Text style={styles.headerHighlight}>Waste</Text>
              <Text style={styles.headerDot}> Status</Text>
            </Text>
            <Text style={styles.headerSubtitle}>Track progress, updates, and priority.</Text>
          </View>

          <TouchableOpacity onPress={handleHomePress} style={styles.homeBtn} activeOpacity={0.9}>
            <Icon name="home" size={18} color="#111" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ✅ UI tweak: top “card” wrapper */}
        <View style={styles.card}>
          <Text style={styles.title}>Check your waste report status</Text>
          <Text style={styles.subtitle}>Enter the report ID you received after submitting.</Text>

          <Text style={styles.label}>Report ID</Text>
          <View style={styles.inputRow}>
            <Icon name="hash" size={16} color="#777" />
            <TextInput
              style={styles.input}
              placeholder="e.g. WM-2026-000123"
              placeholderTextColor="#B0B0B0"
              value={reportId}
              onChangeText={setReportId}
              autoCapitalize="characters"
            />
            {!!reportId && (
              <TouchableOpacity onPress={() => setReportId("")} activeOpacity={0.9}>
                <Icon name="x-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.checkButton, checking && { opacity: 0.7 }]}
            onPress={handleCheckStatus}
            disabled={checking}
            activeOpacity={0.9}
          >
            {checking ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#111" />
                <Text style={styles.checkButtonText}>Checking…</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Icon name="activity" size={16} color="#111" />
                <Text style={styles.checkButtonText}>Check Status</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>My Waste Reports</Text>
          {listLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#111" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#555" }}>Loading…</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#777" }}>
              {filteredReports.length} result(s)
            </Text>
          )}
        </View>

        {/* ✅ UI tweak: search row + nicer spacing */}
        <View style={styles.searchRow}>
          <Icon name="search" size={16} color="#777" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by ID, area, status..."
            placeholderTextColor="#B0B0B0"
            style={styles.searchInput}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.9}>
              <Icon name="x-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ UI add: filter chips (lightweight, looks modern) */}
        <View style={styles.chipsWrap}>
          <Text style={styles.chipsLabel}>Status</Text>
          <View style={styles.chipsRow}>
            {chip("All", statusChip === "All", () => setStatusChip("All"), "layers")}
            {chip("Open", statusChip === "Open", () => setStatusChip("Open"), "alert-circle")}
            {chip(
              "Assigned",
              statusChip === "Assigned",
              () => setStatusChip("Assigned"),
              "user-check"
            )}
            {chip(
              "Resolved",
              statusChip === "Resolved",
              () => setStatusChip("Resolved"),
              "check-circle"
            )}
          </View>

          <Text style={[styles.chipsLabel, { marginTop: 10 }]}>Priority</Text>
          <View style={styles.chipsRow}>
            {chip("All", priorityChip === "All", () => setPriorityChip("All"), "filter")}
            {chip("Low", priorityChip === "Low", () => setPriorityChip("Low"), "chevrons-down")}
            {chip(
              "Medium",
              priorityChip === "Medium",
              () => setPriorityChip("Medium"),
              "minus"
            )}
            {chip("High", priorityChip === "High", () => setPriorityChip("High"), "chevrons-up")}
          </View>
        </View>

        {!listLoading && filteredReports.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Icon name="file-text" size={18} color={ORANGE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyText}>No waste reports found.</Text>
              <Text style={styles.emptySubText}>
                Try a different keyword, or pull down to refresh.
              </Text>
            </View>
          </View>
        ) : null}

        {filteredReports.map((r) => {
          const code = r?.reportCode || r?.id || "—";
          const status = normalizeStatus(r?.status || "Open");
          const priority = normalizePriority(r?.priority || "Medium");

          const statusColor =
            status === "Resolved"
              ? "#16A34A"
              : status === "Assigned"
              ? "#7C3AED"
              : status === "In Progress"
              ? "#0EA5E9"
              : "#EF4444";

          const priorityColor =
            priority === "High" ? "#EF4444" : priority === "Low" ? "#16A34A" : "#F59E0B";

          return (
            <TouchableOpacity
              key={r?._id || code}
              activeOpacity={0.9}
              onPress={() => onPressReportRow(r)}
              style={styles.reportRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.reportCode}>{code}</Text>

                <View style={styles.metaRow}>
                  <Icon name="trash-2" size={14} color="#777" />
                  <Text style={styles.reportMeta} numberOfLines={1}>
                    {r?.type || "Waste report"} • {r?.area || "Unknown area"}
                  </Text>
                </View>

                {!!r?.description && (
                  <Text style={styles.reportDesc} numberOfLines={1}>
                    {r.description}
                  </Text>
                )}

                {!!r?.time && (
                  <View style={styles.timeRow}>
                    <Icon name="clock" size={12} color="#9A9A9A" />
                    <Text style={styles.reportTime}>{r?.time}</Text>
                  </View>
                )}
              </View>

              <View style={{ alignItems: "flex-end", gap: 8 }}>
                <View style={[styles.pill, { borderColor: statusColor }]}>
                  <View style={[styles.dot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.pillText, { color: statusColor }]}>{status}</Text>
                </View>

                <View style={[styles.pill, { borderColor: priorityColor }]}>
                  <View style={[styles.dot, { backgroundColor: priorityColor }]} />
                  <Text style={[styles.pillText, { color: priorityColor }]}>{priority}</Text>
                </View>

                <Icon name="chevron-right" size={18} color="#999" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ✅ UI tweak: keep your orange side pill */}
      <View style={styles.sidePill} />

      {/* ✅ UI add: bottom navigation (you already had styles; now it actually renders) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem} onPress={handleBack} activeOpacity={0.9}>
          <Icon name="arrow-left" size={18} color="#111" />
        </TouchableOpacity>

        <View style={styles.bottomCenter}>
          <View style={styles.bottomCenterDot} />
          <Text style={styles.bottomCenterText}>Status</Text>
        </View>

        <TouchableOpacity style={styles.tabItem} onPress={handleHomePress} activeOpacity={0.9}>
          <Icon name="home" size={18} color="#111" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F4" },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  headerHighlight: { color: ORANGE },
  headerDot: { color: "#111" },
  headerSubtitle: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#666" },
  homeBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FFF3EA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFD9C0",
  },

  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 160 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  title: { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#555", marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "800", color: "#333", marginBottom: 8 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FAFAFA",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1,
    borderColor: "#EDEDED",
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 14, color: "#222", fontWeight: "700" },

  checkButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  checkButtonText: { fontSize: 15, fontWeight: "900", color: "#111" },

  listHeader: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listTitle: { fontSize: 16, fontWeight: "900", color: "#111" },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#222", fontWeight: "700" },

  chipsWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipsLabel: { fontSize: 12, fontWeight: "900", color: "#444", marginBottom: 8 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    backgroundColor: "#FAFAFA",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: "#FFD9C0",
    backgroundColor: "#FFF3EA",
  },
  chipText: { fontSize: 12, fontWeight: "900", color: "#666" },
  chipTextActive: { color: "#111" },

  reportRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  reportCode: { fontSize: 13, fontWeight: "900", color: "#111" },
  metaRow: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 8 },
  reportMeta: { fontSize: 12, fontWeight: "800", color: "#555" },
  reportDesc: { marginTop: 6, fontSize: 12, color: "#777", fontWeight: "700" },
  timeRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  reportTime: { fontSize: 11, fontWeight: "800", color: "#999" },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  pillText: { fontSize: 11, fontWeight: "900" },
  dot: { width: 8, height: 8, borderRadius: 99 },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  emptyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#FFF3EA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFD9C0",
  },
  emptyText: { fontSize: 12, fontWeight: "900", color: "#444" },
  emptySubText: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#777" },

  sidePill: {
    position: "absolute",
    right: 0,
    bottom: 110,
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

  bottomBar: {
    position: "absolute",
    bottom: 18,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    width: 240,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  tabItem: { paddingHorizontal: 12, paddingVertical: 6 },

  bottomCenter: { alignItems: "center" },
  bottomCenterDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: ORANGE,
    marginBottom: 3,
  },
  bottomCenterText: { fontSize: 11, fontWeight: "900", color: "#111" },
});
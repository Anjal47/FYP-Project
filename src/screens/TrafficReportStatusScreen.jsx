// src/screens/TrafficReportStatusScreen.jsx
import React, { useEffect, useState } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FloatingHelpChat from "../components/FloatingHelpChat";

const ORANGE = "#FF7A1A";
const BASE_URL = "http://10.0.2.2:5000";

/* ----------------------------- API ----------------------------- */
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

/* ----------------------------- Helpers ----------------------------- */
/**
 * ✅ Decide if a report is "Traffic".
 * Change the conditions below to match your backend fields.
 */
function isTrafficReport(r) {
  const t = `${r?.type || ""}`.toLowerCase();
  const c = `${r?.category || ""}`.toLowerCase();
  const m = `${r?.module || ""}`.toLowerCase();
  const tag = `${r?.tag || ""}`.toLowerCase();

  // Covers common backend naming styles:
  return (
    t.includes("traffic") ||
    c.includes("traffic") ||
    m.includes("traffic") ||
    tag.includes("traffic") ||
    t.includes("violation") ||
    t.includes("road") ||
    t.includes("driving")
  );
}

/* ----------------------------- Screen ----------------------------- */
export default function TrafficReportStatusScreen({ navigation }) {
  const [reportId, setReportId] = useState("");
  const [checking, setChecking] = useState(false);

  const [myReports, setMyReports] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const getToken = async () => AsyncStorage.getItem("token");

  const handleBack = () => navigation.goBack();
  const handleHomePress = () => navigation.navigate("Home");

  const showStatusAlert = (r) => {
    Alert.alert(
      "Traffic Report Status ✅",
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

  // ✅ ONLY TRAFFIC REPORTS
  const trafficReports = myReports.filter(isTrafficReport);

  // ✅ Search only inside trafficReports
  const filteredReports = (() => {
    const q = search.trim().toLowerCase();
    if (!q) return trafficReports;

    return trafficReports.filter((r) => {
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
  })();

  const handleCheckStatus = async () => {
    const code = reportId.trim();
    if (!code) return Alert.alert("Missing ID", "Please enter your report ID.");

    try {
      setChecking(true);
      const token = await getToken();
      if (!token) return Alert.alert("Login required", "Token not found. Please login again.");

      const data = await apiGetReportStatus(token, code);

      // ✅ If backend returns some other module, block it
      const live = data?.report;
      if (live && !isTrafficReport(live)) {
        return Alert.alert("Not a Traffic Report", "This report ID does not belong to Traffic module.");
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
      const live = data?.report || r;

      if (live && !isTrafficReport(live)) {
        return Alert.alert("Not a Traffic Report", "This report does not belong to Traffic module.");
      }

      showStatusAlert(live);
    } catch {
      showStatusAlert(r);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={handleBack}>
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}> Traffic</Text>
            <Text style={styles.headerDot}> Reports.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Check your traffic report status</Text>
        <Text style={styles.subtitle}>Enter the report ID you received after submitting your traffic case.</Text>

        <Text style={styles.label}>Report ID</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. TR-2026-000123"
          placeholderTextColor="#B0B0B0"
          value={reportId}
          onChangeText={setReportId}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.checkButton, checking && { opacity: 0.7 }]}
          onPress={handleCheckStatus}
          disabled={checking}
        >
          {checking ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator color="#111" />
              <Text style={styles.checkButtonText}>Checking…</Text>
            </View>
          ) : (
            <Text style={styles.checkButtonText}>Check Status</Text>
          )}
        </TouchableOpacity>

        <View style={styles.tipBox}>
          <Icon name="info" size={16} color={ORANGE} />
          <Text style={styles.tipText}>
            Keep your report ID safe. You’ll need it to follow up or provide more information later.
          </Text>
        </View>

        {/* My reports */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>My Traffic Reports</Text>
          {listLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#111" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#555" }}>Loading…</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#777" }}>
              {filteredReports.length} result(s)
            </Text>
          )}
        </View>

        <View style={styles.searchRow}>
          <Icon name="search" size={16} color="#777" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search traffic reports by ID, area, status..."
            placeholderTextColor="#B0B0B0"
            style={styles.searchInput}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Icon name="x-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {!listLoading && filteredReports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="file-text" size={18} color={ORANGE} />
            <Text style={styles.emptyText}>No traffic reports found.</Text>
          </View>
        ) : null}

        {filteredReports.map((r) => {
          const code = r?.reportCode || r?.id || "—";
          const status = r?.status || "Open";
          const priority = r?.priority || "Medium";

          const statusColor =
            status === "Resolved" ? "#16A34A" : status === "Assigned" ? "#7C3AED" : "#EF4444";
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
                <Text style={styles.reportMeta} numberOfLines={1}>
                  {r?.type || "Traffic report"} • {r?.area || "Unknown area"}
                </Text>

                {!!r?.description && (
                  <Text style={styles.reportDesc} numberOfLines={1}>
                    {r.description}
                  </Text>
                )}

                <Text style={styles.reportTime}>{r?.time || ""}</Text>
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

      {/* ORANGE SIDE PILL */}
      <FloatingHelpChat bottom={110} fabBottom={145} />

      {/* BOTTOM BAR */}

    </SafeAreaView>
  );
}

/* ----------------------------- Styles ----------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F4" },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", marginLeft: 8 },
  headerHighlight: { color: ORANGE },
  headerDot: { color: "#111" },

  body: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 160 },

  title: { fontSize: 20, fontWeight: "700", color: "#111", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#555", marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6 },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#222",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  checkButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  checkButtonText: { fontSize: 15, fontWeight: "700", color: "#111" },

  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tipText: { fontSize: 12, color: "#555", marginLeft: 8, flex: 1 },

  listHeader: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listTitle: { fontSize: 16, fontWeight: "800", color: "#111" },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#222" },

  reportRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  reportCode: { fontSize: 13, fontWeight: "900", color: "#111" },
  reportMeta: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#555" },
  reportDesc: { marginTop: 4, fontSize: 12, color: "#777" },
  reportTime: { marginTop: 6, fontSize: 11, fontWeight: "700", color: "#999" },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: { fontSize: 11, fontWeight: "900" },
  dot: { width: 8, height: 8, borderRadius: 99 },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  emptyText: { fontSize: 12, fontWeight: "700", color: "#555" },

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
    bottom: 24,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    width: 220,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tabItem: { paddingHorizontal: 12, paddingVertical: 4 },
});

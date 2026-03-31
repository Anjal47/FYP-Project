// src/screens/Admin/AdminReportsScreen.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import Icon from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import RNFS from "react-native-fs";
import FileViewer from "react-native-file-viewer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { adminGET, BASE_URL } from "../../utils/adminApi";

const ORANGE = "#FF7A1A";

/**
 * ✅ Admin Reports Screen (VIEW ONLY)
 * - Same look/feel as ReportStatusScreen
 * - Search + Status Filter + Scope Filter
 * - Shows Assigned Staff (assignedTo)
 * - PDF download only
 */
export default function AdminReportsScreen({ navigation }) {
  const UI = useMemo(
    () => ({
      bg: "#F4F4F4",
      card: "#FFFFFF",
      text: "#111",
      mut: "#555",
      line: "#E3E3E3",
      orange: ORANGE,
    }),
    []
  );

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All"); // All | Open | Assigned | Resolved
  const [scope, setScope] = useState("all"); // all | assigned | unassigned

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [reports, setReports] = useState([]);

  const handleBack = () => navigation?.goBack?.();

  const statusColor = (status) =>
    status === "Resolved" ? "#16A34A" : status === "Assigned" ? "#7C3AED" : "#EF4444";

  const priorityColor = (priority) =>
    priority === "High" ? "#EF4444" : priority === "Low" ? "#16A34A" : "#F59E0B";

  const load = useCallback(
    async (spinner = true) => {
      try {
        if (spinner) setLoading(true);

        const qs =
          `?q=${encodeURIComponent(q.trim())}` +
          `&status=${encodeURIComponent(filter)}` +
          `&scope=${encodeURIComponent(scope)}`;

        const data = await adminGET(`/api/admin/reports${qs}`);
        setReports(Array.isArray(data?.reports) ? data.reports : []);
      } catch (e) {
        Alert.alert("Reports error", e?.message || "Failed to load reports");
        setReports([]);
      } finally {
        setLoading(false);
      }
    },
    [q, filter, scope]
  );

  useEffect(() => {
    load(true);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  };

 const downloadPDF = async (id) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Missing token. Please login again.");

    // ✅ IMPORTANT:
    // Android emulator cannot access "localhost" of your PC.
    // If BASE_URL is "http://localhost:5000", change it to "http://10.0.2.2:5000"
    const url = `${BASE_URL}/api/admin/reports/${id}/pdf`;

    const safeName = `AngelTouch_Report_${String(id).slice(-6)}.pdf`;

    // ✅ Save to Downloads on Android (better), Documents on iOS
    const filePath =
      Platform.OS === "android"
        ? `${RNFS.DownloadDirectoryPath}/${safeName}`
        : `${RNFS.DocumentDirectoryPath}/${safeName}`;

    const dl = RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
      background: true,
      discretionary: true,
    });

    const result = await dl.promise;

    // ✅ Show exact status code if not 200
    if (result.statusCode < 200 || result.statusCode >= 300) {
      throw new Error(
        `Failed to download PDF (HTTP ${result.statusCode}). ` +
          `Most common: token invalid (401/403) or route not found (404).`
      );
    }

  try {
  await FileViewer.open(filePath, {
    showOpenWithDialog: true,
    mimeType: "application/pdf",
  });
} catch (err) {
  Alert.alert(
    "PDF downloaded",
    "Saved successfully, but no PDF viewer app is installed. Please install a PDF reader (e.g., Google Drive / Adobe Acrobat) and open it from your Downloads."
  );
}

  } catch (e) {
    Alert.alert("Download failed", e?.message || "Could not download PDF");
  }
};

  const renderAssignedStaff = (r) => {
    const a = r?.assignedTo;
    if (!a) return <Text style={s.assignedMuted}>Not assigned</Text>;

    return (
      <Text style={s.assignedText} numberOfLines={1}>
        {a?.fullName || "Staff"} • {(a?.role || "staff").toUpperCase()}
      </Text>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: UI.bg }]}>
      {/* HEADER */}
      <View style={[s.header, { borderBottomColor: UI.line }]}>
        <TouchableOpacity style={s.backRow} onPress={handleBack} activeOpacity={0.85}>
          <Icon name="arrow-left" size={20} color={UI.text} />
          <Text style={s.headerTitle}>
            <Text style={{ color: UI.orange }}> Admin</Text>
            <Text style={{ color: UI.text }}> Reports.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[s.title, { color: UI.text }]}>View all reports</Text>
        <Text style={[s.subtitle, { color: UI.mut }]}>
          Search and filter reports. Admin is view-only (download PDF if needed).
        </Text>

        {/* Search */}
        <View style={s.searchRow}>
          <Icon name="search" size={16} color="#777" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by report code, type, area..."
            placeholderTextColor="#B0B0B0"
            style={s.searchInput}
            onSubmitEditing={() => load(true)}
            returnKeyType="search"
          />

          {!!q && (
            <TouchableOpacity onPress={() => setQ("")} activeOpacity={0.8}>
              <Icon name="x-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => load(true)} activeOpacity={0.85}>
            <Ionicons name="arrow-forward-circle" size={22} color={ORANGE} />
          </TouchableOpacity>
        </View>

        {/* Status Filters */}
        <View style={s.filters}>
          {["All", "Open", "Assigned", "Resolved"].map((f) => {
            const active = filter === f;
            return (
              <TouchableOpacity
                key={f}
                activeOpacity={0.9}
                onPress={() => setFilter(f)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Scope Filters */}
        <View style={[s.filters, { marginTop: 2 }]}>
          {[
            { id: "all", label: "All reports" },
            { id: "assigned", label: "Assigned only" },
            { id: "unassigned", label: "Unassigned" },
          ].map((x) => {
            const active = scope === x.id;
            return (
              <TouchableOpacity
                key={x.id}
                activeOpacity={0.9}
                onPress={() => setScope(x.id)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{x.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={ORANGE} />
            <Text style={s.loadingText}>Loading reports…</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={s.emptyBox}>
            <Icon name="file-text" size={18} color={ORANGE} />
            <Text style={s.emptyText}>No reports found.</Text>
          </View>
        ) : (
          reports.map((r) => {
            const code = r?.reportCode || `ID-${String(r?._id || "").slice(-6)}`;
            const st = r?.status || "Open";
            const pr = r?.priority || "Medium";

            const stC = statusColor(st);
            const prC = priorityColor(pr);

            return (
              <View key={r._id} style={s.reportRow}>
                {/* Left */}
                <View style={{ flex: 1 }}>
                  <Text style={s.reportCode}>{code}</Text>

                  <Text style={s.reportMeta} numberOfLines={1}>
                    {r?.type || "Unknown type"} • {r?.area || "Unknown area"}
                  </Text>

                  {!!r?.description && (
                    <Text style={s.reportDesc} numberOfLines={1}>
                      {r.description}
                    </Text>
                  )}

                  {/* Assigned staff */}
                  <View style={s.assignedRow}>
                    <Icon name="user-check" size={14} color={ORANGE} />
                    {renderAssignedStaff(r)}
                  </View>

                  <Text style={s.reportTime}>
                    {r?.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                  </Text>
                </View>

                {/* Right */}
                <View style={{ alignItems: "flex-end", gap: 8 }}>
                  <View style={[s.pill, { borderColor: stC }]}>
                    <View style={[s.dot, { backgroundColor: stC }]} />
                    <Text style={[s.pillText, { color: stC }]}>{st}</Text>
                  </View>

                  <View style={[s.pill, { borderColor: prC }]}>
                    <View style={[s.dot, { backgroundColor: prC }]} />
                    <Text style={[s.pillText, { color: prC }]}>{pr}</Text>
                  </View>

                  {/* PDF ONLY */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={s.actionBtn}
                    onPress={() => downloadPDF(r._id)}
                  >
                    <Ionicons name="download-outline" size={16} color={ORANGE} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ORANGE SIDE PILL */}
      <View style={s.sidePill} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", marginLeft: 8 },

  body: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 160 },

  title: { fontSize: 20, fontWeight: "700", marginBottom: 6, color: "#111" },
  subtitle: { fontSize: 13, marginBottom: 14, color: "#555" },

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

  filters: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  chip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E3E3E3",
  },
  chipActive: {
    borderColor: ORANGE,
    backgroundColor: "#FFF4E8",
  },
  chipText: { fontSize: 12, fontWeight: "900", color: "#777" },
  chipTextActive: { color: "#111" },

  loadingBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  loadingText: { marginTop: 10, fontSize: 12, fontWeight: "800", color: "#555" },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  emptyText: { fontSize: 12, fontWeight: "700", color: "#555" },

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

  assignedRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  assignedText: { fontSize: 12, fontWeight: "800", color: "#111", flex: 1 },
  assignedMuted: { fontSize: 12, fontWeight: "800", color: "#777", flex: 1 },

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

  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

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
});

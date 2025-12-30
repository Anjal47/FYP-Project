import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, Platform } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import RNFS from "react-native-fs";
import FileViewer from "react-native-file-viewer";
import { adminGET, adminPATCH, BASE_URL } from "../../utils/adminApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminReportsScreen() {
  const UI = useMemo(
    () => ({
      bg: "#0B0F14",
      card: "#111826",
      card2: "#0F172A",
      text: "#EAF0FF",
      mut: "rgba(234,240,255,0.68)",
      line: "rgba(255,255,255,0.08)",
      accent: "#7C3AED",
      good: "#22C55E",
      warn: "#F59E0B",
      danger: "#EF4444",
    }),
    []
  );

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [reports, setReports] = useState([]);

  const load = async () => {
    try {
      const qs = `?q=${encodeURIComponent(q.trim())}&status=${encodeURIComponent(filter)}`;
      const data = await adminGET(`/api/admin/reports${qs}`);
      setReports(data?.reports || []);
    } catch (e) {
      Alert.alert("Reports error", e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const tone = (priority) => {
    if (priority === "High") return UI.danger;
    if (priority === "Medium") return UI.warn;
    return UI.good;
  };

  const updateStatus = async (id, status) => {
    try {
      const data = await adminPATCH(`/api/admin/reports/${id}`, { status });
      const updated = data?.report;
      setReports((prev) => prev.map((r) => (r._id === id ? updated : r)));
    } catch (e) {
      Alert.alert("Update failed", e?.message || "Could not update report");
    }
  };

  const downloadPDF = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Missing token");

      const url = `${BASE_URL}/api/admin/reports/${id}/pdf`;

      const filePath = `${RNFS.DocumentDirectoryPath}/AngelTouch_Report_${String(id).slice(-6)}.pdf`;

      const dl = RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await dl.promise;
      if (result.statusCode !== 200) throw new Error("Failed to download PDF");

      await FileViewer.open(filePath, { showOpenWithDialog: true });
    } catch (e) {
      Alert.alert("Download failed", e?.message || "Could not download PDF");
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
      <ScrollView
        contentContainerStyle={s.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.title, { color: UI.text }]}>Reports</Text>
        <Text style={[s.sub, { color: UI.mut }]}>Review, assign, resolve, and download reports.</Text>

        <View style={[s.search, { backgroundColor: UI.card, borderColor: UI.line }]}>
          <Ionicons name="search-outline" size={18} color={UI.mut} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search type or area..."
            placeholderTextColor="rgba(234,240,255,0.45)"
            style={[s.input, { color: UI.text }]}
            onSubmitEditing={load}
          />
          <TouchableOpacity onPress={load}>
            <Ionicons name="arrow-forward-circle" size={22} color={UI.accent} />
          </TouchableOpacity>
        </View>

        <View style={s.filters}>
          {["All", "Open", "Assigned", "Resolved"].map((f) => (
            <TouchableOpacity key={f} activeOpacity={0.9} onPress={() => setFilter(f)} style={[s.chip, { borderColor: UI.line, backgroundColor: filter === f ? UI.card2 : UI.card }]}>
              <Text style={{ color: filter === f ? UI.text : UI.mut, fontWeight: "900", fontSize: 12 }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.box, { backgroundColor: UI.card, borderColor: UI.line }]}>
          {loading ? (
            <View style={{ padding: 14, alignItems: "center" }}>
              <ActivityIndicator color={UI.accent} />
              <Text style={{ marginTop: 10, color: UI.mut, fontWeight: "800" }}>Loading reports...</Text>
            </View>
          ) : reports.length === 0 ? (
            <Text style={{ color: UI.mut, fontWeight: "700" }}>No reports found.</Text>
          ) : (
            reports.map((r) => (
              <View key={r._id} style={[s.report, { backgroundColor: UI.card2, borderColor: UI.line }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[s.id, { color: UI.text }]}>ID: {String(r._id).slice(-8)}</Text>
                  <View style={[s.badge, { borderColor: UI.line }]}>
                    <View style={[s.dot, { backgroundColor: tone(r.priority) }]} />
                    <Text style={[s.badgeTxt, { color: UI.text }]}>{r.priority}</Text>
                  </View>
                </View>

                <Text style={[s.type, { color: UI.text }]}>{r.type}</Text>
                <Text style={[s.area, { color: UI.mut }]}>{r.area}</Text>
                <Text style={[s.status, { color: UI.mut }]}>Status: {r.status}</Text>

                <View style={s.actions}>
                  {r.status !== "Assigned" && (
                    <TouchableOpacity activeOpacity={0.9} style={[s.btn, { borderColor: UI.line }]} onPress={() => updateStatus(r._id, "Assigned")}>
                      <Ionicons name="person-add-outline" size={16} color={UI.text} />
                      <Text style={[s.btnTxt, { color: UI.text }]}>Assign</Text>
                    </TouchableOpacity>
                  )}

                  {r.status !== "Resolved" && (
                    <TouchableOpacity activeOpacity={0.9} style={[s.btn, { borderColor: UI.line }]} onPress={() => updateStatus(r._id, "Resolved")}>
                      <Ionicons name="checkmark-done-outline" size={16} color={UI.good} />
                      <Text style={[s.btnTxt, { color: UI.text }]}>Resolve</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity activeOpacity={0.9} style={[s.btn, { borderColor: UI.line }]} onPress={() => downloadPDF(r._id)}>
                    <Ionicons name="download-outline" size={16} color={UI.accent} />
                    <Text style={[s.btnTxt, { color: UI.text }]}>PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { padding: 16, paddingBottom: 26 },
  title: { fontSize: 20, fontWeight: "900" },
  sub: { marginTop: 4, fontSize: 13, marginBottom: 12 },

  search: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  input: { flex: 1, fontSize: 13 },

  filters: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },

  box: { borderWidth: 1, borderRadius: 18, padding: 12 },
  report: { borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 10 },

  id: { fontSize: 12, fontWeight: "900" },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 8 },
  badgeTxt: { fontSize: 11, fontWeight: "900" },
  dot: { width: 9, height: 9, borderRadius: 99 },

  type: { marginTop: 8, fontSize: 14, fontWeight: "900" },
  area: { marginTop: 4, fontSize: 12, fontWeight: "700" },
  status: { marginTop: 4, fontSize: 12, fontWeight: "700" },

  actions: { marginTop: 10, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  btn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  btnTxt: { fontSize: 11, fontWeight: "900" },
});

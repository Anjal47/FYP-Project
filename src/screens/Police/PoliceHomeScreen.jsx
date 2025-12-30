import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

/**
 * PoliceHomeScreen
 * The calm control-room vibe. 🚓✨🌈
 * - Quick stats: Open / Assigned / Resolved
 * - Priority queue cards
 * - Search + filters
 * - Actions: Assign to me, Mark resolved (UI only for now)
 */
export default function PoliceHomeScreen({ navigation }) {
  const UI = useMemo(
    () => ({
      bg: "#0B0F14",
      card: "#111826",
      card2: "#0F172A",
      text: "#EAF0FF",
      mut: "rgba(234,240,255,0.68)",
      line: "rgba(255,255,255,0.08)",
      accent: "#22C55E", // green pop
      accent2: "#7C3AED", // purple pop
      danger: "#EF4444",
      warn: "#F59E0B",
    }),
    []
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All"); // All | Open | Assigned | Resolved

  // Dummy data for now — replace with backend later (GET /api/police/reports)
  const [reports, setReports] = useState([
    {
      id: "RPT-0007",
      title: "Domestic disturbance",
      area: "Newtown (Zone 3)",
      priority: "High",
      status: "Open",
      time: "5 min ago",
    },
    {
      id: "RPT-0006",
      title: "Suspicious activity",
      area: "City Center",
      priority: "Medium",
      status: "Assigned",
      time: "18 min ago",
    },
    {
      id: "RPT-0005",
      title: "Street harassment",
      area: "Bus Stop A12",
      priority: "Low",
      status: "Resolved",
      time: "2 hrs ago",
    },
    {
      id: "RPT-0004",
      title: "Threatening message",
      area: "Online report",
      priority: "High",
      status: "Open",
      time: "3 hrs ago",
    },
  ]);

  const counts = useMemo(() => {
    const open = reports.filter((r) => r.status === "Open").length;
    const assigned = reports.filter((r) => r.status === "Assigned").length;
    const resolved = reports.filter((r) => r.status === "Resolved").length;
    return { open, assigned, resolved };
  }, [reports]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return reports
      .filter((r) => (filter === "All" ? true : r.status === filter))
      .filter((r) => {
        if (!q) return true;
        return (
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          r.priority.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
        );
      });
  }, [reports, query, filter]);

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

  const onAssignToMe = (id) => {
    Alert.alert("Assign", `Assign ${id} to you?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Assign",
        onPress: () => {
          setReports((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: "Assigned" } : r))
          );
        },
      },
    ]);
  };

  const onMarkResolved = (id) => {
    Alert.alert("Resolve", `Mark ${id} as resolved?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve",
        onPress: () => {
          setReports((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: "Resolved" } : r))
          );
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.title, { color: UI.text }]}>
              Police <Text style={{ color: UI.accent, fontWeight: "900" }}>Desk</Text>
            </Text>
            <Text style={[s.sub, { color: UI.mut }]}>Monitor, assign, and resolve incident reports.</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[s.roundBtn, { borderColor: UI.line }]}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings-outline" size={22} color={UI.text} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatPill label="Open" value={counts.open} color={UI.danger} UI={UI} />
          <StatPill label="Assigned" value={counts.assigned} color={UI.accent2} UI={UI} />
          <StatPill label="Resolved" value={counts.resolved} color={UI.accent} UI={UI} />
        </View>

        {/* Search */}
        <View style={[s.searchBox, { borderColor: UI.line, backgroundColor: UI.card }]}>
          <Ionicons name="search-outline" size={18} color={UI.mut} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search report ID, area, type, status..."
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
        <View style={s.filters}>
          {["All", "Open", "Assigned", "Resolved"].map((f) => (
            <TouchableOpacity
              key={f}
              activeOpacity={0.9}
              onPress={() => setFilter(f)}
              style={[
                s.filterChip,
                { borderColor: UI.line, backgroundColor: filter === f ? UI.card2 : UI.card },
              ]}
            >
              <Text style={{ color: filter === f ? UI.text : UI.mut, fontWeight: "800", fontSize: 12 }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Queue */}
        <View style={[s.section, { borderColor: UI.line, backgroundColor: UI.card }]}>
          <Text style={[s.sectionTitle, { color: UI.text }]}>Priority Queue</Text>

          {visible.length === 0 ? (
            <View style={[s.empty, { borderColor: UI.line }]}>
              <Ionicons name="sparkles-outline" size={20} color={UI.accent} />
              <Text style={[s.emptyTxt, { color: UI.mut }]}>No reports match your filters.</Text>
            </View>
          ) : (
            visible.map((r) => (
              <View key={r.id} style={[s.reportCard, { borderColor: UI.line, backgroundColor: UI.card2 }]}>
                <View style={s.reportTop}>
                  <Text style={[s.reportId, { color: UI.text }]}>{r.id}</Text>

                  <View style={[s.badge, { borderColor: UI.line, backgroundColor: "rgba(0,0,0,0.15)" }]}>
                    <View style={[s.dot, { backgroundColor: badgeTone(r.priority) }]} />
                    <Text style={[s.badgeTxt, { color: UI.text }]}>{r.priority}</Text>
                  </View>
                </View>

                <Text style={[s.reportTitle, { color: UI.text }]}>{r.title}</Text>

                <View style={s.metaRow}>
                  <Ionicons name="location-outline" size={14} color={UI.mut} />
                  <Text style={[s.metaTxt, { color: UI.mut }]}>{r.area}</Text>
                  <Text style={[s.metaDot, { color: UI.mut }]}>•</Text>
                  <Ionicons name="time-outline" size={14} color={UI.mut} />
                  <Text style={[s.metaTxt, { color: UI.mut }]}>{r.time}</Text>
                </View>

                <View style={s.actionsRow}>
                  <View style={[s.statusPill, { borderColor: UI.line }]}>
                    <View style={[s.dot, { backgroundColor: statusTone(r.status) }]} />
                    <Text style={[s.statusTxt, { color: UI.text }]}>{r.status}</Text>
                  </View>

                  {r.status !== "Assigned" && r.status !== "Resolved" && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => onAssignToMe(r.id)}
                      style={[s.actionBtn, { borderColor: UI.line }]}
                    >
                      <Ionicons name="person-add-outline" size={16} color={UI.text} />
                      <Text style={[s.actionTxt, { color: UI.text }]}>Assign</Text>
                    </TouchableOpacity>
                  )}

                  {r.status !== "Resolved" && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => onMarkResolved(r.id)}
                      style={[s.actionBtn, { borderColor: UI.line }]}
                    >
                      <Ionicons name="checkmark-done-outline" size={16} color={UI.accent} />
                      <Text style={[s.actionTxt, { color: UI.text }]}>Resolve</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={[s.footer, { color: UI.mut }]}>
          Backend later: GET /api/police/reports, PATCH /api/police/reports/:id (status/assign). 🚓
        </Text>
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

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 4, fontSize: 13, lineHeight: 18 },

  roundBtn: { width: 42, height: 42, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },

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

  reportCard: { borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 10 },
  reportTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reportId: { fontSize: 12, fontWeight: "900", opacity: 0.95 },

  badge: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeTxt: { fontSize: 11, fontWeight: "900" },

  dot: { width: 9, height: 9, borderRadius: 99 },

  reportTitle: { marginTop: 8, fontSize: 14, fontWeight: "900" },

  metaRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaTxt: { fontSize: 12, fontWeight: "700" },
  metaDot: { marginHorizontal: 4, fontSize: 12, fontWeight: "900" },

  actionsRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },

  statusTxt: { fontSize: 11, fontWeight: "900" },

  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  actionTxt: { fontSize: 11, fontWeight: "900" },

  footer: { marginTop: 12, fontSize: 12, lineHeight: 17 },
});

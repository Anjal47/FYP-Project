import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { adminGET } from "../../utils/adminApi";

export default function AdminDashboardScreen({ navigation }) {
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

  const [loading, setLoading] = useState(true);

  // ✅ added municipality
  const [stats, setStats] = useState({
    users: 0,
    staff: 0,
    counsellors: 0,
    therapists: 0,
    police: 0,
    municipality: 0, // ✅ NEW
    openReports: 0,
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await adminGET("/api/admin/stats");

        if (mounted && data?.stats) {
          setStats((p) => ({
            ...p,
            ...data.stats,
            municipality: Number(data?.stats?.municipality || 0), // ✅ safe fallback
          }));
        }
      } catch (e) {
        Alert.alert("Dashboard error", e?.message || "Failed to load stats");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={[s.title, { color: UI.text }]}>
              Angel<Text style={{ color: UI.accent, fontWeight: "900" }}>Touch</Text> Admin
            </Text>
            <Text style={[s.sub, { color: UI.mut }]}>Control center for users, staff, and reports.</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[s.iconBtn, { borderColor: UI.line }]}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings-outline" size={22} color={UI.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ padding: 14, alignItems: "center" }}>
            <ActivityIndicator color={UI.accent} />
            <Text style={{ marginTop: 10, color: UI.mut, fontWeight: "800" }}>Loading stats...</Text>
          </View>
        ) : (
          <>
            {/* Stats grid */}
            <View style={s.grid}>
              <StatCard title="Users" value={stats.users} icon="people-outline" tone={UI.accent} UI={UI} />
              <StatCard title="Total Staff" value={stats.staff} icon="briefcase-outline" tone={UI.good} UI={UI} />
              <StatCard title="Open Reports" value={stats.openReports} icon="warning-outline" tone={UI.danger} UI={UI} />
              <StatCard title="Counsellors" value={stats.counsellors} icon="chatbubble-ellipses-outline" tone={UI.accent} UI={UI} />
              <StatCard title="Therapists" value={stats.therapists} icon="heart-outline" tone={UI.warn} UI={UI} />
              <StatCard title="Police" value={stats.police} icon="shield-outline" tone={UI.good} UI={UI} />
              {/* ✅ NEW STAT */}
              <StatCard title="Municipality" value={stats.municipality} icon="business-outline" tone={UI.warn} UI={UI} />
            </View>

            {/* Quick actions */}
            <View style={[s.section, { backgroundColor: UI.card, borderColor: UI.line }]}>
              <Text style={[s.sectionTitle, { color: UI.text }]}>Quick Actions</Text>

              <ActionRow
                UI={UI}
                icon="person-add-outline"
                title="Create Staff"
                subtitle="Add counsellor / therapist / police / municipality"
                onPress={() => navigation.navigate("Staff")}
              />

              <ActionRow
                UI={UI}
                icon="people-outline"
                title="Manage Users"
                subtitle="View, disable, and monitor accounts"
                onPress={() => navigation.navigate("Users")}
              />

              {/* ✅ NEW: All reports */}
              <ActionRow
                UI={UI}
                icon="document-text-outline"
                title="Manage Reports"
                subtitle="All reports (assign, status, priority)"
                onPress={() => navigation.navigate("Reports")}
              />

              {/* ✅ NEW: Waste reports */}
              <ActionRow
                UI={UI}
                icon="trash-outline"
                title="Waste Reports"
                subtitle="Only waste management cases (assign municipality)"
                onPress={() => navigation.navigate("WasteReports")}
              />
            </View>

            <Text style={[s.footer, { color: UI.mut }]}>
              Tip: keep backend protected with requireRole("admin") — frontend is just the cute velvet rope. 💅🌈
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, icon, tone, UI }) {
  return (
    <View style={[s.card, { backgroundColor: UI.card, borderColor: UI.line }]}>
      <View style={s.cardTop}>
        <Ionicons name={icon} size={20} color={tone} />
        <View style={[s.dot, { backgroundColor: tone }]} />
      </View>
      <Text style={[s.cardVal, { color: UI.text }]}>{value}</Text>
      <Text style={[s.cardTitle, { color: UI.mut }]}>{title}</Text>
    </View>
  );
}

function ActionRow({ UI, icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[s.row, { borderColor: UI.line, backgroundColor: UI.card2 }]}
    >
      <View style={[s.rowIcon, { borderColor: UI.line }]}>
        <Ionicons name={icon} size={18} color={UI.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, { color: UI.text }]}>{title}</Text>
        <Text style={[s.rowSub, { color: UI.mut }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={UI.mut} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { padding: 16, paddingBottom: 26 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 4, fontSize: 13, lineHeight: 18 },

  iconBtn: { width: 42, height: 42, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  card: { width: "48%", borderWidth: 1, borderRadius: 18, padding: 14, minHeight: 104, justifyContent: "space-between" },

  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dot: { width: 9, height: 9, borderRadius: 99, opacity: 0.9 },

  cardVal: { fontSize: 22, fontWeight: "900" },
  cardTitle: { fontSize: 12 },

  section: { borderWidth: 1, borderRadius: 18, padding: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "900", marginBottom: 10 },

  row: { borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  rowIcon: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  rowTitle: { fontSize: 14, fontWeight: "900" },
  rowSub: { fontSize: 12, marginTop: 3, fontWeight: "700" },

  footer: { marginTop: 12, fontSize: 12, lineHeight: 17 },
});

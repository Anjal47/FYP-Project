import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Feather from "react-native-vector-icons/Feather";

const ORANGE = "#FF7A1A";
const BG = "#F4F4F4";
const BASE_URL = "http://10.0.2.2:5000";

export default function CounsellorReportsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const res = await fetch(`${BASE_URL}/api/counseling/counsellor/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load counsellor data");
      }

      setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (error) {
      Alert.alert("Report / Data", error?.message || "Could not load counsellor data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadAppointments);
    return unsub;
  }, [navigation]);

  const summary = useMemo(() => {
    const uniqueClients = new Set();
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    };
    const modeCounts = {
      online: 0,
      offline: 0,
    };
    const problemCounts = new Map();

    appointments.forEach((appt) => {
      const status = String(appt?.status || "").toLowerCase();
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }

      const mode = String(appt?.request?.mode || "").toLowerCase();
      if (modeCounts[mode] !== undefined) {
        modeCounts[mode] += 1;
      }

      const userId = appt?.user?._id || appt?.user?.id || appt?.userId;
      if (userId) {
        uniqueClients.add(String(userId));
      }

      const problem = String(appt?.request?.problem || "General").trim();
      problemCounts.set(problem, (problemCounts.get(problem) || 0) + 1);
    });

    const topProblems = Array.from(problemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      totalAppointments: appointments.length,
      totalClients: uniqueClients.size,
      statusCounts,
      modeCounts,
      topProblems,
      recentAppointments: [...appointments]
        .sort((a, b) => {
          const ta = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
          const tb = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
          return tb - ta;
        })
        .slice(0, 4),
    };
  }, [appointments]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#111" />
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Report</Text>
            <Text style={styles.titleNormal}> / Data.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={styles.loadingText}>Loading counsellor summary...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Your client and session overview.</Text>

          <View style={styles.statsGrid}>
            <StatCard label="Total Clients" value={summary.totalClients} />
            <StatCard label="Appointments" value={summary.totalAppointments} />
            <StatCard label="Confirmed" value={summary.statusCounts.confirmed} />
            <StatCard label="Pending" value={summary.statusCounts.pending} />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Session Breakdown</Text>
            <InfoRow label="Completed sessions" value={summary.statusCounts.completed} />
            <InfoRow label="Cancelled sessions" value={summary.statusCounts.cancelled} />
            <InfoRow label="Online sessions" value={summary.modeCounts.online} />
            <InfoRow label="Offline sessions" value={summary.modeCounts.offline} />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Top Concerns</Text>
            {summary.topProblems.length ? (
              summary.topProblems.map(([problem, count]) => (
                <InfoRow key={problem} label={problem} value={count} />
              ))
            ) : (
              <Text style={styles.emptyText}>No concern data yet.</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Appointments</Text>
            {summary.recentAppointments.length ? (
              summary.recentAppointments.map((appt) => (
                <View key={appt.id || appt._id} style={styles.recentItem}>
                  <Text style={styles.recentName}>{appt?.user?.fullName || "Client"}</Text>
                  <Text style={styles.recentMeta}>
                    {appt?.month || ""} {appt?.day || ""} • {appt?.slot || ""} • {appt?.status || "pending"}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent appointments yet.</Text>
            )}
          </View>

          <View style={{ height: 140 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  titleHighlight: {
    color: ORANGE,
  },
  titleNormal: {
    color: "#111",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: ORANGE,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  infoLabel: {
    flex: 1,
    color: "#555",
    fontWeight: "700",
    paddingRight: 10,
  },
  infoValue: {
    color: "#111",
    fontWeight: "900",
  },
  recentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  recentName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },
  recentMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#777",
    fontWeight: "700",
  },
  emptyText: {
    color: "#777",
    fontWeight: "700",
  },
});

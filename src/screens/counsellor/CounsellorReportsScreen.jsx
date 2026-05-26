import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Feather from "react-native-vector-icons/Feather";
import { useAppTheme } from "../../context/ThemeContext";
import { useTranslate } from "../../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
export default function CounsellorReportsScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{
            name: "Login"
          }]
        });
        return;
      }
      const res = await fetch(`${BASE_URL}/api/counseling/counsellor/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load counsellor data");
      setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (error) {
      Alert.alert(translate("Insights"), error?.message || "Could not load counsellor data");
    } finally {
      setLoading(false);
    }
  }, [navigation]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", loadAppointments);
    return unsub;
  }, [navigation, loadAppointments]);
  const summary = useMemo(() => {
    const uniqueClients = new Set();
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0
    };
    const modeCounts = {
      online: 0,
      offline: 0
    };
    const problemCounts = new Map();
    appointments.forEach(appt => {
      const status = String(appt?.status || "").toLowerCase();
      if (statusCounts[status] !== undefined) statusCounts[status] += 1;
      const mode = String(appt?.request?.mode || "").toLowerCase();
      if (modeCounts[mode] !== undefined) modeCounts[mode] += 1;
      const userId = appt?.user?._id || appt?.user?.id || appt?.userId;
      if (userId) uniqueClients.add(String(userId));
      const problem = String(appt?.request?.problem || "General").trim();
      problemCounts.set(problem, (problemCounts.get(problem) || 0) + 1);
    });
    return {
      totalAppointments: appointments.length,
      totalClients: uniqueClients.size,
      statusCounts,
      modeCounts,
      topProblems: Array.from(problemCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4),
      recentAppointments: [...appointments].sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0).getTime() - new Date(a?.updatedAt || a?.createdAt || 0).getTime()).slice(0, 4)
    };
  }, [appointments]);
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <View style={styles.backIconWrap}>
                <Feather name="arrow-left" size={18} color={theme.text} />
              </View>
              <Text style={styles.backText}>{translate("Back")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate("Settings")} activeOpacity={0.88}>
              <Feather name="settings" size={17} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroGlow} />
          <Text style={styles.eyebrow}>{translate("Insights")}</Text>
          <Text style={styles.title}>{translate("Operational insight should feel readable, not like raw admin output.")}</Text>
          <Text style={styles.subtitle}>{translate("Mixed naming was cleaned up, repeated labels were removed, and the summary now groups performance, demand, and recent session activity in a more natural order.")}</Text>
        </View>

        {loading ? <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.accentStrong} />
            <Text style={styles.loadingText}>{translate("Loading counsellor insights...")}</Text>
          </View> : <>
            <View style={styles.statsGrid}>
              <MetricCard styles={styles} label={translate("Clients")} value={summary.totalClients} />
              <MetricCard styles={styles} label={translate("Appointments")} value={summary.totalAppointments} />
              <MetricCard styles={styles} label={translate("Confirmed")} value={summary.statusCounts.confirmed} />
              <MetricCard styles={styles} label={translate("Pending")} value={summary.statusCounts.pending} />
            </View>

            <View style={styles.splitRow}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionEyebrow}>{translate("Workload")}</Text>
                <Text style={styles.sectionTitle}>{translate("Session breakdown")}</Text>
                <InfoRow styles={styles} label={translate("Completed sessions")} value={summary.statusCounts.completed} last={false} />
                <InfoRow styles={styles} label={translate("Cancelled sessions")} value={summary.statusCounts.cancelled} last={false} />
                <InfoRow styles={styles} label={translate("Online sessions")} value={summary.modeCounts.online} last={false} />
                <InfoRow styles={styles} label={translate("Offline sessions")} value={summary.modeCounts.offline} last />
              </View>

              <View style={[styles.sectionCard, styles.sectionCardAccent]}>
                <Text style={styles.sectionEyebrowAccent}>{translate("Demand")}</Text>
                <Text style={styles.sectionTitle}>{translate("Top concerns")}</Text>
                {summary.topProblems.length ? summary.topProblems.map(([problem, count], index) => <InfoRow key={problem} styles={styles} label={problem} value={count} last={index === summary.topProblems.length - 1} />) : <Text style={styles.emptyText}>{translate("No concern data yet.")}</Text>}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionEyebrow}>{translate("Recent Activity")}</Text>
              <Text style={styles.sectionTitle}>{translate("Latest appointments")}</Text>
              {summary.recentAppointments.length ? summary.recentAppointments.map((appt, index) => <View key={String(appt?.id || appt?._id)} style={[styles.recentCard, index === summary.recentAppointments.length - 1 && styles.recentCardLast]}>
                    <View style={styles.recentTop}>
                      <Text style={styles.recentName}>{appt?.user?.fullName || "Client"}</Text>
                      <View style={styles.recentBadge}>
                        <Text style={styles.recentBadgeText}>{appt?.status || "pending"}</Text>
                      </View>
                    </View>
                    <Text style={styles.recentMeta}>
                      {`${appt?.month || ""} ${appt?.day || ""}`.trim() || "Upcoming"}
                      {appt?.slot ? ` • ${appt.slot}` : ""}
                      {appt?.request?.problem ? ` • ${appt.request.problem}` : ""}
                    </Text>
                  </View>) : <Text style={styles.emptyText}>{translate("No recent appointments yet.")}</Text>}
            </View>
          </>}
      </ScrollView>
    </SafeAreaView>;
}
function MetricCard({
  label,
  value,
  styles
}) {
  return <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>;
}
function InfoRow({
  label,
  value,
  styles,
  last
}) {
  return <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>;
}
function createStyles(theme, isDark) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    content: {
      padding: 12,
      paddingBottom: 32
    },
    hero: {
      position: "relative",
      overflow: "hidden",
      backgroundColor: theme.surface,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 22,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.24 : 0.08,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 10
      },
      elevation: 4
    },
    heroGlow: {
      position: "absolute",
      top: -86,
      right: -60,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: theme.accentSoft
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
      gap: 12
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    },
    backIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center"
    },
    backText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700"
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center"
    },
    eyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "800",
      letterSpacing: -0.6,
      maxWidth: 560
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 19,
      maxWidth: 540
    },
    loadingBox: {
      padding: 30,
      alignItems: "center"
    },
    loadingText: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 12,
      fontWeight: "700"
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 16
    },
    metricCard: {
      width: "48%",
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18
    },
    metricValue: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "800"
    },
    metricLabel: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    splitRow: {
      flexDirection: "column",
      gap: 12,
      marginBottom: 12
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18
    },
    sectionCardAccent: {
      backgroundColor: theme.surfaceSoft
    },
    sectionEyebrow: {
      color: theme.accentStrong,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1
    },
    sectionEyebrowAccent: {
      color: theme.accentStrong,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1
    },
    sectionTitle: {
      marginTop: 6,
      marginBottom: 12,
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: 10
    },
    infoRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0
    },
    infoLabel: {
      flex: 1,
      color: theme.muted,
      fontSize: 12,
      fontWeight: "700",
      paddingRight: 10
    },
    infoValue: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800"
    },
    recentCard: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border
    },
    recentCardLast: {
      borderBottomWidth: 0,
      paddingBottom: 0
    },
    recentTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10
    },
    recentName: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800",
      flex: 1
    },
    recentMeta: {
      marginTop: 5,
      color: theme.muted,
      fontSize: 11,
      lineHeight: 17
    },
    recentBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.accentSoft
    },
    recentBadgeText: {
      color: theme.accentStrong,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "capitalize"
    },
    emptyText: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    }
  };
}
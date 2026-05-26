import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions, ActivityIndicator } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "../../context/ThemeContext";
import { useTranslate } from "../../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
const workspaceCards = [{
  key: "appointments",
  title: "Appointments",
  desc: "Approve pending sessions, keep confirmed sessions moving, and close completed work cleanly.",
  icon: "calendar-outline",
  screen: "CounsellorAppointments"
}, {
  key: "clients",
  title: "Clients",
  desc: "Open each client once, see their latest context, and jump into chat only when it is available.",
  icon: "people-outline",
  screen: "CounsellorClients"
}, {
  key: "reports",
  title: "Insights",
  desc: "Review session mix, common concerns, and current workload without digging through raw lists.",
  icon: "stats-chart-outline",
  screen: "CounsellorReports"
}];
export default function CounsellorHomeScreen({
  navigation
}) {
  const translate = useTranslate();
  const localizedWorkspaceCards = workspaceCards.map(item => ({
    ...item,
    title: translate(item.title),
    desc: translate(item.desc)
  }));
  const {
    theme,
    isDark
  } = useAppTheme();
  const {
    width
  } = useWindowDimensions();
  const isWide = width >= 880;
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark, isWide)), [theme, isDark, isWide]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    todayCount: 0,
    pendingCount: 0,
    activeClients: 0,
    recentAppointments: []
  });
  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
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
        if (!res.ok) throw new Error(data?.message || "Failed to load counsellor dashboard");
        const appointments = Array.isArray(data?.appointments) ? data.appointments : [];
        const uniqueClients = new Set();
        const pendingCount = appointments.filter(item => String(item?.status || "").toLowerCase() === "pending").length;
        const todayCount = appointments.filter(item => String(item?.status || "").toLowerCase() === "confirmed").length;
        appointments.forEach(item => {
          const userId = item?.user?._id || item?.user?.id || item?.userId;
          if (userId) uniqueClients.add(String(userId));
        });
        const recentAppointments = [...appointments].sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0).getTime() - new Date(a?.updatedAt || a?.createdAt || 0).getTime()).slice(0, 3);
        if (mounted) {
          setSummary({
            todayCount,
            pendingCount,
            activeClients: uniqueClients.size,
            recentAppointments
          });
        }
      } catch (_error) {
        if (mounted) {
          setSummary({
            todayCount: 0,
            pendingCount: 0,
            activeClients: 0,
            recentAppointments: []
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    const unsub = navigation.addListener("focus", loadDashboard);
    return () => {
      mounted = false;
      unsub();
    };
  }, [navigation]);
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable style={styles.settingsButton} onPress={() => navigation.navigate("Settings")}>
            <Feather name="settings" size={18} color={theme.text} />
          </Pressable>

          <View style={styles.heroGlow} />
          <Text style={styles.eyebrow}>{translate("Counsellor Workspace")}</Text>
          <Text style={styles.title}>{translate("Your day should feel focused, calm, and easy to act on.")}</Text>

          <View style={styles.heroStats}>
            <MetricTile styles={styles} value={summary.todayCount} label={translate("Confirmed")} />
            <MetricTile styles={styles} value={summary.pendingCount} label={translate("Pending")} />
            <MetricTile styles={styles} value={summary.activeClients} label={translate("Clients")} />
          </View>

          <View style={styles.heroActionRow}>
            <Pressable style={styles.primaryHeroButton} onPress={() => navigation.navigate("CounsellorAppointments")}>
              <Text style={styles.primaryHeroButtonText}>{translate("Open Appointments")}</Text>
            </Pressable>
            <Pressable style={styles.secondaryHeroButton} onPress={() => navigation.navigate("Profile")}>
              <Text style={styles.secondaryHeroButtonText}>{translate("Profile")}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.grid}>
          {localizedWorkspaceCards.map(item => <Pressable key={item.key} style={({
          pressed
        }) => [styles.card, pressed && styles.cardPressed]} onPress={() => navigation.navigate(item.screen)}>
              {({
            pressed
          }) => <>
                  <View style={[styles.cardIconWrap, pressed && styles.cardIconWrapPressed]}>
                    <Ionicons name={item.icon} size={18} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                  </View>
                  <Text style={[styles.cardTitle, pressed && styles.cardTitlePressed]}>{item.title}</Text>
                  <Text style={[styles.cardDesc, pressed && styles.cardDescPressed]}>{item.desc}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardMeta, pressed && styles.cardMetaPressed]}>{translate("Open")}</Text>
                    <Feather name="arrow-up-right" size={16} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                  </View>
                </>}
            </Pressable>)}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{translate("Recent activity")}</Text>
          <Text style={styles.panelSubtitle}>{translate("Latest session updates")}</Text>
            {loading ? <View style={styles.loadingMini}>
                <ActivityIndicator size="small" color={theme.accentStrong} />
              </View> : summary.recentAppointments.length ? summary.recentAppointments.map(item => <View key={String(item?.id || item?._id)} style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityCopy}>
                    <Text style={styles.activityName}>{item?.user?.fullName || translate("Client")}</Text>
                    <Text style={styles.activityMeta}>
                      {`${translate(item?.month || "")} ${item?.day || ""}`.trim() || translate("Upcoming")}{" "}
                      {item?.slot ? `• ${item.slot}` : ""}
                      {item?.status ? ` • ${translate(item.status)}` : ""}
                    </Text>
                  </View>
                </View>) : <Text style={styles.emptyText}>{translate("No appointment activity yet.")}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>;
}
function MetricTile({
  value,
  label,
  styles
}) {
  return <View style={styles.heroStatCard}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>;
}
function createStyles(theme, isDark, isWide) {
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
    settingsButton: {
      alignSelf: "flex-end",
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center"
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
    eyebrow: {
      marginTop: 14,
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
    heroStats: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
      flexWrap: "wrap"
    },
    heroStatCard: {
      flex: 1,
      minWidth: 92,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 14
    },
    heroStatValue: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "800"
    },
    heroStatLabel: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    heroActionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
      flexWrap: "wrap"
    },
    primaryHeroButton: {
      minHeight: 46,
      paddingHorizontal: 18,
      borderRadius: 16,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center"
    },
    primaryHeroButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800"
    },
    secondaryHeroButton: {
      minHeight: 46,
      paddingHorizontal: 18,
      borderRadius: 16,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center"
    },
    secondaryHeroButtonText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800"
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12
    },
    card: {
      width: isWide ? "31.9%" : "100%",
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      minHeight: 172
    },
    cardPressed: {
      backgroundColor: theme.accentStrong,
      borderColor: theme.accentStrong
    },
    cardIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    cardIconWrapPressed: {
      backgroundColor: "rgba(255,255,255,0.16)"
    },
    cardTitle: {
      marginTop: 16,
      color: theme.text,
      fontSize: 14,
      fontWeight: "800"
    },
    cardTitlePressed: {
      color: "#FFFFFF"
    },
    cardDesc: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 11,
      lineHeight: 17,
      minHeight: 52
    },
    cardDescPressed: {
      color: "rgba(255,255,255,0.82)"
    },
    cardFooter: {
      marginTop: "auto",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    cardMeta: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.7
    },
    cardMetaPressed: {
      color: "rgba(255,255,255,0.9)"
    },
    panel: {
      marginTop: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 28,
      padding: 20
    },
    panelTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800"
    },
    panelSubtitle: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 11,
      fontWeight: "700"
    },
    loadingMini: {
      marginTop: 14,
      alignItems: "flex-start"
    },
    activityRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
      alignItems: "flex-start"
    },
    activityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
      backgroundColor: theme.accentStrong
    },
    activityCopy: {
      flex: 1
    },
    activityName: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800"
    },
    activityMeta: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 11,
      lineHeight: 17
    },
    emptyText: {
      marginTop: 14,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    }
  };
}

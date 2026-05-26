import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "../../context/ThemeContext";
import { useTranslate } from "../../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
const filters = ["all", "pending", "confirmed", "completed", "cancelled"];
export default function CounsellorAppointmentsScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [actingId, setActingId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const apiGetCounsellorAppointments = async token => {
    const res = await fetch(`${BASE_URL}/api/counseling/counsellor/appointments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load appointments");
    return data;
  };
  const apiAction = async (token, id, action) => {
    const res = await fetch(`${BASE_URL}/api/counseling/appointments/${id}/${action}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Failed to ${action}`);
    return data;
  };
  const load = useCallback(async () => {
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
      const data = await apiGetCounsellorAppointments(token);
      setRows(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (error) {
      Alert.alert(translate("Appointments"), error?.message || "Could not load appointments");
    } finally {
      setLoading(false);
    }
  }, [navigation, translate]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);
  const handleAction = (id, action, label, destructive = false) => {
    Alert.alert(label, `${label} this appointment?`, [{
      text: translate("Cancel"),
      style: "cancel"
    }, {
      text: label,
      style: destructive ? "destructive" : "default",
      onPress: async () => {
        try {
          setActingId(id);
          const token = await AsyncStorage.getItem("token");
          await apiAction(token, id, action);
          await load();
        } catch (error) {
          Alert.alert(`${label} failed`, error?.message || `Could not ${action}`);
        } finally {
          setActingId("");
        }
      }
    }]);
  };
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(row => {
      const matchFilter = filter === "all" ? true : String(row?.status || "").toLowerCase() === filter;
      const haystack = [row?.user?.fullName, row?.request?.problem, row?.request?.mode, row?.request?.language, row?.month, row?.slot, row?.status].filter(Boolean).join(" ").toLowerCase();
      const matchSearch = !q || haystack.includes(q);
      return matchFilter && matchSearch;
    });
  }, [rows, search, filter]);
  const counts = useMemo(() => {
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };
    rows.forEach(item => {
      const status = String(item?.status || "").toLowerCase();
      if (statusCounts[status] !== undefined) statusCounts[status] += 1;
    });
    return {
      total: rows.length,
      ...statusCounts
    };
  }, [rows]);
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
          <Text style={styles.eyebrow}>{translate("Appointments")}</Text>
          <Text style={styles.title}>{translate("Only show the next valid action for each session.")}</Text>
          <Text style={styles.subtitle}>{translate("Confirmed sessions no longer sit beside disabled decline buttons, and pending sessions no longer compete with completion actions they cannot use yet.")}</Text>

          <View style={styles.statsRow}>
            <StatCard styles={styles} label={translate("Total")} value={counts.total} />
            <StatCard styles={styles} label={translate("Pending")} value={counts.pending} />
            <StatCard styles={styles} label={translate("Confirmed")} value={counts.confirmed} />
            <StatCard styles={styles} label={translate("Completed")} value={counts.completed} />
          </View>
        </View>

        <View style={styles.controlsCard}>
          <View style={styles.searchRow}>
            <Feather name="search" size={16} color={theme.muted} />
            <TextInput value={search} onChangeText={setSearch} placeholder={translate("Search client, concern, mode, or date")} placeholderTextColor={theme.muted} style={styles.searchInput} />
            {!!search && <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.85}>
                <Feather name="x-circle" size={18} color={theme.muted} />
              </TouchableOpacity>}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filters.map(item => {
            const active = filter === item;
            return <TouchableOpacity key={item} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setFilter(item)} activeOpacity={0.88}>
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {translate(item)}
                  </Text>
                </TouchableOpacity>;
          })}
          </ScrollView>
        </View>

        {loading ? <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.accentStrong} />
            <Text style={styles.loadingText}>{translate("Loading appointments...")}</Text>
          </View> : filteredRows.length === 0 ? <View style={styles.emptyCard}>
            <Feather name="calendar" size={18} color={theme.accentStrong} />
            <Text style={styles.emptyTitle}>{translate("No appointments match this view")}</Text>
            <Text style={styles.emptyText}>{translate("Try a different filter or clear the search input.")}</Text>
          </View> : filteredRows.map(item => {
        const status = String(item?.status || "pending").toLowerCase();
        const busy = actingId === item.id;
        const showConfirm = status === "pending";
        const showDecline = status === "pending";
        const showComplete = status === "confirmed";
        return <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.clientName}>{item?.user?.fullName || translate("Client")}</Text>
                    <Text style={styles.metaText}>
                      {`${translate(item?.month || "")} ${item?.day || ""}`.trim() || translate("Date pending")}
                      {item?.slot ? ` • ${item.slot}` : ""}
                    </Text>
                  </View>
                  <StatusBadge styles={styles} status={status} />
                </View>

                <View style={styles.metaGrid}>
                  {!!item?.request?.problem && <MetaBlock styles={styles} label={translate("Concern")} value={item.request.problem} />}
                  {!!(item?.request?.mode || item?.request?.language) && <MetaBlock styles={styles} label={translate("Session")} value={[translate(item?.request?.mode), translate(item?.request?.language)].filter(Boolean).join(" • ")} />}
                </View>

                {!!item?.request?.description && <View style={styles.notesCard}>
                    <Text style={styles.notesLabel}>{translate("Client Notes")}</Text>
                    <Text style={styles.notesText}>{item.request.description}</Text>
                  </View>}

                <View style={styles.actionsRow}>
                  {showConfirm ? <ActionButton styles={styles} label={translate("Confirm")} kind="primary" busy={busy} onPress={() => handleAction(item.id, "confirm", translate("Confirm"))} /> : null}

                  {showDecline ? <ActionButton styles={styles} label={translate("Decline")} kind="secondary" busy={busy} onPress={() => handleAction(item.id, "decline", translate("Decline"), true)} /> : null}

                  {showComplete ? <ActionButton styles={styles} label={translate("Mark Completed")} kind="success" busy={busy} onPress={() => handleAction(item.id, "complete", translate("Complete"))} /> : null}

                  {!showConfirm && !showDecline && !showComplete ? <View style={styles.donePill}>
                      <Text style={styles.donePillText}>{translate("No more actions needed")}</Text>
                    </View> : null}
                </View>
              </View>;
      })}
      </ScrollView>
    </SafeAreaView>;
}
function StatCard({
  label,
  value,
  styles
}) {
  return <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>;
}
function MetaBlock({
  label,
  value,
  styles
}) {
  const translate = useTranslate();
  return <View style={styles.metaBlock}>
      <Text style={styles.metaBlockLabel}>{label}</Text>
      <Text style={styles.metaBlockValue}>{translate(value)}</Text>
    </View>;
}
function StatusBadge({
  status,
  styles
}) {
  const translate = useTranslate();
  const palette = {
    pending: {
      bg: "#FFF4E3",
      fg: "#B56A00"
    },
    confirmed: {
      bg: "#EAF7EE",
      fg: "#197A3A"
    },
    completed: {
      bg: "#EAF7EE",
      fg: "#197A3A"
    },
    cancelled: {
      bg: "#FDECEC",
      fg: "#B42318"
    }
  };
  const selected = palette[status] || {
    bg: "#F2F2F2",
    fg: "#666666"
  };
  return <View style={[styles.statusBadge, {
    backgroundColor: selected.bg
  }]}>
      <Text style={[styles.statusBadgeText, {
      color: selected.fg
    }]}>
        {translate(status)}
      </Text>
    </View>;
}
function ActionButton({
  label,
  kind,
  busy,
  onPress,
  styles
}) {
  const variantStyle = kind === "primary" ? styles.actionPrimary : kind === "success" ? styles.actionSuccess : styles.actionSecondary;
  const textStyle = kind === "secondary" ? styles.actionTextSecondary : styles.actionTextLight;
  return <TouchableOpacity style={[styles.actionButton, variantStyle, busy && styles.actionButtonBusy]} onPress={onPress} activeOpacity={0.9} disabled={busy}>
      {busy ? <ActivityIndicator size="small" color={kind === "secondary" ? "#111111" : "#FFFFFF"} /> : <Text style={textStyle}>{label}</Text>}
    </TouchableOpacity>;
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
    statsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
      flexWrap: "wrap"
    },
    statCard: {
      flex: 1,
      minWidth: 92,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 14
    },
    statValue: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "800"
    },
    statLabel: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    controlsCard: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16
    },
    searchRow: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      paddingHorizontal: 14
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      paddingVertical: 12
    },
    filterRow: {
      gap: 10,
      paddingTop: 12
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border
    },
    filterChipActive: {
      backgroundColor: theme.accentStrong,
      borderColor: theme.accentStrong
    },
    filterChipText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700"
    },
    filterChipTextActive: {
      color: "#FFFFFF"
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
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      alignItems: "center"
    },
    emptyTitle: {
      marginTop: 10,
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    emptyText: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center"
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      marginBottom: 12
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    },
    cardCopy: {
      flex: 1
    },
    clientName: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    metaText: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 11,
      fontWeight: "700"
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "800"
    },
    metaGrid: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "wrap",
      marginTop: 14
    },
    metaBlock: {
      minWidth: "47%",
      flexGrow: 1,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 13
    },
    metaBlockLabel: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    metaBlockValue: {
      marginTop: 6,
      color: theme.text,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "700"
    },
    notesCard: {
      marginTop: 14,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14
    },
    notesLabel: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    notesText: {
      marginTop: 8,
      color: theme.text,
      fontSize: 12,
      lineHeight: 18
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
      flexWrap: "wrap",
      alignItems: "center"
    },
    actionButton: {
      minHeight: 42,
      paddingHorizontal: 16,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center"
    },
    actionPrimary: {
      backgroundColor: theme.accentStrong
    },
    actionSuccess: {
      backgroundColor: "#1F9D61"
    },
    actionSecondary: {
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border
    },
    actionTextLight: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800"
    },
    actionTextSecondary: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800"
    },
    actionButtonBusy: {
      opacity: 0.8
    },
    donePill: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border
    },
    donePillText: {
      color: theme.muted,
      fontSize: 11,
      fontWeight: "700"
    }
  };
}

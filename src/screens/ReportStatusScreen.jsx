import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "../context/ThemeContext";
import { useTranslate } from "../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
async function apiGetReportStatus(token, reportCode) {
  const res = await fetch(`${BASE_URL}/api/reports/status/${encodeURIComponent(reportCode)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to fetch report status");
  return data;
}
async function apiGetMyReports(token) {
  const res = await fetch(`${BASE_URL}/api/reports/mine`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load your reports");
  return data;
}
export default function ReportStatusScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const [reportId, setReportId] = useState("");
  const [checking, setChecking] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const getToken = async () => AsyncStorage.getItem("token");
  const showStatusAlert = report => {
    Alert.alert(translate("Status"), `Report: ${report?.reportCode || report?.id}\nType: ${report?.type}\nArea: ${report?.area}\nPriority: ${report?.priority}\n\nStatus: ${report?.status}\nUpdated: ${report?.time || "recently"}`);
  };
  const loadMyReports = async (showSpinner = false) => {
    try {
      if (showSpinner) setListLoading(true);
      const token = await getToken();
      if (!token) {
        setListLoading(false);
        Alert.alert(translate("Login required"), translate("Token not found. Please login again."));
        return;
      }
      const data = await apiGetMyReports(token);
      setMyReports(Array.isArray(data?.reports) ? data.reports : []);
    } catch (error) {
      Alert.alert(translate("Error"), error.message || "Failed to load your reports");
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
  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myReports;
    return myReports.filter(report => [report?.reportCode, report?.id, report?.type, report?.area, report?.status, report?.priority, report?.description].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [myReports, search]);
  const handleCheckStatus = async () => {
    const code = reportId.trim();
    if (!code) {
      Alert.alert(translate("Missing ID"), translate("Please enter your report ID."));
      return;
    }
    try {
      setChecking(true);
      const token = await getToken();
      if (!token) {
        Alert.alert(translate("Login required"), translate("Token not found. Please login again."));
        return;
      }
      const data = await apiGetReportStatus(token, code);
      showStatusAlert(data?.report);
    } catch (error) {
      Alert.alert(translate("Error"), error.message || "Something went wrong");
    } finally {
      setChecking(false);
    }
  };
  const onPressReportRow = async report => {
    const code = report?.reportCode || report?.id;
    if (!code) return;
    setReportId(code);
    try {
      const token = await getToken();
      if (!token) {
        showStatusAlert(report);
        return;
      }
      const data = await apiGetReportStatus(token, code);
      showStatusAlert(data?.report || report);
    } catch {
      showStatusAlert(report);
    }
  };
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
      setRefreshing(true);
      loadMyReports(false);
    }} />}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{translate("Back")}</Text>
          </TouchableOpacity>

          <View style={styles.glow} />
          <Text style={styles.eyebrow}>{translate("Report Status")}</Text>
          <Text style={styles.title}>{translate("Track submitted reports without digging through noisy screens.")}</Text>
          <Text style={styles.subtitle}>{translate("Search by report code or open an item from your recent report list below.")}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{translate("Check a report")}</Text>
          <View style={styles.inputRow}>
            <Icon name="hash" size={16} color={theme.muted} />
            <TextInput style={styles.input} placeholder={translate("e.g. AT-2026-000123")} placeholderTextColor={theme.muted} value={reportId} onChangeText={setReportId} autoCapitalize="characters" />
          </View>

          <TouchableOpacity style={[styles.primaryButton, checking && styles.primaryButtonDisabled]} onPress={handleCheckStatus} activeOpacity={0.9} disabled={checking}>
            {checking ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{translate("Check Status")}</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{translate("My reports")}</Text>
            <Text style={styles.sectionMeta}>{listLoading ? translate("Loading...") : `${filteredReports.length}${translate("result(s)")}`}</Text>
          </View>

          <View style={styles.inputRow}>
            <Icon name="search" size={16} color={theme.muted} />
            <TextInput value={search} onChangeText={setSearch} placeholder={translate("Search by ID, type, area, status...")} placeholderTextColor={theme.muted} style={styles.input} />
          </View>

          {!listLoading && filteredReports.length === 0 ? <View style={styles.emptyState}>
              <Icon name="file-text" size={18} color={theme.accentStrong} />
              <Text style={styles.emptyText}>{translate("No reports found.")}</Text>
            </View> : null}

          {filteredReports.map(report => {
          const code = report?.reportCode || report?.id || "—";
          return <TouchableOpacity key={report?._id || code} style={styles.reportCard} onPress={() => onPressReportRow(report)} activeOpacity={0.9}>
                <View style={styles.reportCopy}>
                  <Text style={styles.reportCode}>{code}</Text>
                  <Text style={styles.reportMeta}>{report?.type || "Unknown type"} • {report?.area || "Unknown area"}</Text>
                  {!!report?.description && <Text style={styles.reportDesc} numberOfLines={2}>{report.description}</Text>}
                </View>
                <View style={styles.reportBadge}>
                  <Text style={styles.reportBadgeText}>{report?.status || "Open"}</Text>
                </View>
              </TouchableOpacity>;
        })}
        </View>
      </ScrollView>
    </SafeAreaView>;
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
      padding: 24,
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
    glow: {
      position: "absolute",
      top: -84,
      right: -60,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: theme.accentSoft
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 10,
      marginBottom: 20
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
      fontSize: 13,
      fontWeight: "700"
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
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800",
      letterSpacing: -0.8,
      maxWidth: 540
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 520
    },
    panel: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      marginBottom: 16
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 10
    },
    sectionMeta: {
      color: theme.muted,
      fontSize: 12,
      fontWeight: "700"
    },
    inputRow: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      paddingHorizontal: 14,
      marginBottom: 12
    },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      paddingVertical: 12
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: 18,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center"
    },
    primaryButtonDisabled: {
      opacity: 0.75
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800"
    },
    emptyState: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginTop: 8
    },
    emptyText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700"
    },
    reportCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginTop: 10
    },
    reportCopy: {
      flex: 1
    },
    reportCode: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800"
    },
    reportMeta: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    reportDesc: {
      marginTop: 6,
      color: theme.text,
      fontSize: 12,
      lineHeight: 18
    },
    reportBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.accentSoft
    },
    reportBadgeText: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800"
    }
  };
}

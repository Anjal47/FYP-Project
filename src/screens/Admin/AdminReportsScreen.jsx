// src/screens/Admin/AdminReportsScreen.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import RNFS from "react-native-fs";
import FileViewer from "react-native-file-viewer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { adminGET, BASE_URL } from "../../utils/adminApi";
import { useTranslate } from "../../utils/localization";
const ORANGE = "#FF7A1A";

/**
 * ✅ Admin Reports Screen (VIEW ONLY)
 * - Same look/feel as ReportStatusScreen
 * - Search + Status Filter + Scope Filter
 * - Shows Assigned Staff (assignedTo)
 * - PDF download only
 */
export default function AdminReportsScreen({
  navigation
}) {
  const translate = useTranslate();
  const UI = useMemo(() => ({
    bg: "#F6F3EE",
    card: "#FFFFFF",
    card2: "#FFF7EF",
    text: translate("#111111"),
    mut: "#6F6257",
    soft: "#9B8A7B",
    line: "#EADBCB",
    orange: ORANGE,
    orangeDeep: "#D97706"
  }), []);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All"); // All | Open | Assigned | Resolved
  const [scope, setScope] = useState("all"); // all | assigned | unassigned

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const handleBack = () => navigation?.goBack?.();
  const statusColor = status => status === "Resolved" ? "#16A34A" : status === "Assigned" ? ORANGE : "#EF4444";
  const priorityColor = priority => priority === "High" ? "#EF4444" : priority === "Low" ? "#16A34A" : "#F59E0B";
  const load = useCallback(async (spinner = true) => {
    try {
      if (spinner) setLoading(true);
      const qs = `?q=${encodeURIComponent(q.trim())}` + `&status=${encodeURIComponent(filter)}` + `&scope=${encodeURIComponent(scope)}`;
      const data = await adminGET(`/api/admin/reports${qs}`);
      setReports(Array.isArray(data?.reports) ? data.reports : []);
    } catch (e) {
      Alert.alert(translate("Reports error"), e?.message || "Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [q, filter, scope]);
  useEffect(() => {
    load(true);
  }, [load]);
  const onRefresh = async () => {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  };
  const downloadPDF = async id => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Missing token. Please login again.");

      // ✅ IMPORTANT:
      // Android emulator cannot access "localhost" of your PC.
      // If BASE_URL is "http://localhost:5000", change it to "http://10.0.2.2:5000"
      const url = `${BASE_URL}/api/admin/reports/${id}/pdf`;
      const safeName = `AngelTouch_Report_${String(id).slice(-6)}.pdf`;

      // ✅ Save to Downloads on Android (better), Documents on iOS
      const filePath = Platform.OS === "android" ? `${RNFS.DownloadDirectoryPath}/${safeName}` : `${RNFS.DocumentDirectoryPath}/${safeName}`;
      const dl = RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/pdf"
        },
        background: true,
        discretionary: true
      });
      const result = await dl.promise;

      // ✅ Show exact status code if not 200
      if (result.statusCode < 200 || result.statusCode >= 300) {
        throw new Error(`Failed to download PDF (HTTP ${result.statusCode}). Please try again.`);
      }
      try {
        await FileViewer.open(filePath, {
          showOpenWithDialog: true,
          mimeType: "application/pdf"
        });
      } catch (err) {
        Alert.alert(translate("PDF downloaded"), translate("Saved successfully, but no PDF viewer app is installed. Please install a PDF reader (e.g., Google Drive / Adobe Acrobat) and open it from your Downloads."));
      }
    } catch (e) {
      Alert.alert(translate("Download failed"), e?.message || "Could not download PDF");
    }
  };
  const renderAssignedStaff = r => {
    const a = r?.assignedTo;
    if (!a) return <Text style={s.assignedMuted}>{translate("Not assigned")}</Text>;
    return <Text style={s.assignedText} numberOfLines={1}>
        {a?.fullName || "Staff"} • {(a?.role || "staff").toUpperCase()}
      </Text>;
  };
  return <SafeAreaView style={[s.container, {
    backgroundColor: UI.bg
  }]}>
      <ScrollView style={{
      flex: 1
    }} contentContainerStyle={s.body} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={[s.hero, {
        borderColor: UI.line,
        backgroundColor: UI.card
      }]}>
          <View style={[s.heroGlow, {
          backgroundColor: "#FFE0C2"
        }]} />
          <TouchableOpacity style={s.backRow} onPress={handleBack} activeOpacity={0.85}>
            <View style={[s.backIconWrap, {
            borderColor: UI.line,
            backgroundColor: UI.card2
          }]}>
              <Icon name="arrow-left" size={18} color={UI.text} />
            </View>
            <Text style={[s.backText, {
            color: UI.text
          }]}>{translate("Back")}</Text>
          </TouchableOpacity>

          <Text style={[s.heroEyebrow, {
          color: UI.orangeDeep
        }]}>{translate("Admin Reports")}</Text>
          <Text style={[s.title, {
          color: UI.text
        }]}>{translate("View all reports")}</Text>
          <Text style={[s.subtitle, {
          color: UI.mut
        }]}>{translate("Search and filter reports. Admin is view-only and can download the PDF when needed.")}</Text>
        </View>

        <View style={[s.searchRow, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
          <Icon name="search" size={16} color={UI.mut} />
          <TextInput value={q} onChangeText={setQ} placeholder={translate("Search by report code, type, area...")} placeholderTextColor={UI.soft} style={[s.searchInput, {
          color: UI.text
        }]} onSubmitEditing={() => load(true)} returnKeyType="search" />

          {!!q && <TouchableOpacity onPress={() => setQ("")} activeOpacity={0.8}>
              <Icon name="x-circle" size={18} color={UI.mut} />
            </TouchableOpacity>}

          <TouchableOpacity onPress={() => load(true)} activeOpacity={0.85}>
            <Ionicons name="arrow-forward-circle" size={22} color={ORANGE} />
          </TouchableOpacity>
        </View>

        {/* Status Filters */}
        <View style={s.filters}>
          {["All", "Open", "Assigned", "Resolved"].map(f => {
          const active = filter === f;
          return <TouchableOpacity key={f} activeOpacity={0.9} onPress={() => setFilter(f)} style={[s.chip, {
            borderColor: UI.line,
            backgroundColor: active ? "#FFE0C2" : UI.card
          }, active && {
            borderColor: UI.orange
          }]}>
                <Text style={[s.chipText, {
              color: active ? UI.orangeDeep : UI.mut
            }]}>{f}</Text>
              </TouchableOpacity>;
        })}
        </View>

        {/* Scope Filters */}
        <View style={[s.filters, {
        marginTop: 2
      }]}>
          {[{
          id: "all",
          label: translate("All reports")
        }, {
          id: "assigned",
          label: translate("Assigned only")
        }, {
          id: "unassigned",
          label: translate("Unassigned")
        }].map(x => {
          const active = scope === x.id;
          return <TouchableOpacity key={x.id} activeOpacity={0.9} onPress={() => setScope(x.id)} style={[s.chip, {
            borderColor: UI.line,
            backgroundColor: active ? "#FFE0C2" : UI.card
          }, active && {
            borderColor: UI.orange
          }]}>
                <Text style={[s.chipText, {
              color: active ? UI.orangeDeep : UI.mut
            }]}>{x.label}</Text>
              </TouchableOpacity>;
        })}
        </View>

        {/* List */}
        {loading ? <View style={[s.loadingBox, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
            <ActivityIndicator color={ORANGE} />
            <Text style={[s.loadingText, {
          color: UI.mut
        }]}>{translate("Loading reports...")}</Text>
          </View> : reports.length === 0 ? <View style={[s.emptyBox, {
        backgroundColor: UI.card,
        borderColor: UI.line
      }]}>
            <Icon name="file-text" size={18} color={ORANGE} />
            <Text style={[s.emptyText, {
          color: UI.mut
        }]}>{translate("No reports found.")}</Text>
          </View> : reports.map(r => {
        const code = r?.reportCode || `ID-${String(r?._id || "").slice(-6)}`;
        const st = r?.status || "Open";
        const pr = r?.priority || "Medium";
        const stC = statusColor(st);
        const prC = priorityColor(pr);
        return <View key={r._id} style={[s.reportRow, {
          backgroundColor: UI.card,
          borderColor: UI.line
        }]}>
                {/* Left */}
                <View style={{
            flex: 1
          }}>
                  <Text style={[s.reportCode, {
              color: UI.text
            }]}>{code}</Text>

                  <Text style={[s.reportMeta, {
              color: UI.text
            }]} numberOfLines={1}>
                    {r?.type || "Unknown type"} • {r?.area || "Unknown area"}
                  </Text>

                  {!!r?.description && <Text style={[s.reportDesc, {
              color: UI.mut
            }]} numberOfLines={1}>
                      {r.description}
                    </Text>}

                  {/* Assigned staff */}
                  <View style={s.assignedRow}>
                    <Icon name="user-check" size={14} color={ORANGE} />
                    {renderAssignedStaff(r)}
                  </View>

                  <Text style={[s.reportTime, {
              color: UI.mut
            }]}>
                    {r?.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                  </Text>
                </View>

                {/* Right */}
                <View style={{
            alignItems: "flex-end",
            gap: 8
          }}>
                  <View style={[s.pill, {
              borderColor: stC
            }]}>
                    <View style={[s.dot, {
                backgroundColor: stC
              }]} />
                    <Text style={[s.pillText, {
                color: stC
              }]}>{st}</Text>
                  </View>

                  <View style={[s.pill, {
              borderColor: prC
            }]}>
                    <View style={[s.dot, {
                backgroundColor: prC
              }]} />
                    <Text style={[s.pillText, {
                color: prC
              }]}>{pr}</Text>
                  </View>

                  {/* PDF ONLY */}
                  <TouchableOpacity activeOpacity={0.9} style={[s.actionBtn, {
              backgroundColor: UI.card2,
              borderColor: UI.line
            }]} onPress={() => downloadPDF(r._id)}>
                    <Ionicons name="download-outline" size={16} color={ORANGE} />
                  </TouchableOpacity>
                </View>
              </View>;
      })}

        <View style={{
        height: 40
      }} />
      </ScrollView>
    </SafeAreaView>;
}
const s = StyleSheet.create({
  container: {
    flex: 1
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  backIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  backText: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: "800"
  },
  body: {
    padding: 16,
    paddingBottom: 160
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12
  },
  heroGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: -70,
    right: -40,
    opacity: 0.85
  },
  heroEyebrow: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 6
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 0,
    lineHeight: 18
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 13
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1
  },
  chipText: {
    fontSize: 12,
    fontWeight: "900"
  },
  loadingBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: "center"
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800"
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "700"
  },
  reportRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    gap: 12
  },
  reportCode: {
    fontSize: 13,
    fontWeight: "900"
  },
  reportMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700"
  },
  reportDesc: {
    marginTop: 4,
    fontSize: 12
  },
  reportTime: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700"
  },
  assignedRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  assignedText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111111",
    flex: 1
  },
  assignedMuted: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6F6257",
    flex: 1
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  pillText: {
    fontSize: 11,
    fontWeight: "900"
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  }
});
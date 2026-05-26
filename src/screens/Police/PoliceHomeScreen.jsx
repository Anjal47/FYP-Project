import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { openCoordinatesInMaps } from "../../utils/maps";
import { useTranslate } from "../../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
const SOS_ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const AUTO_REFRESH_MS = 15000;
function timeAgo(dateLike) {
  if (!dateLike) return "just now";
  const t = new Date(dateLike).getTime();
  if (Number.isNaN(t)) return "just now";
  const diffMs = Date.now() - t;
  const s = Math.max(0, Math.floor(diffMs / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
function extractCoordinates(report) {
  if (Number.isFinite(report?.geoLocation?.latitude) && Number.isFinite(report?.geoLocation?.longitude)) {
    return {
      latitude: report.geoLocation.latitude,
      longitude: report.geoLocation.longitude
    };
  }
  const match = String(report?.area || "").match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return {
    latitude,
    longitude
  };
}
function isPoliceSos(report) {
  return String(report?.type || "").trim().toLowerCase() === "police sos";
}
function isSosTrackingActive(report) {
  if (!isPoliceSos(report)) return false;
  if (String(report?.status || "").toLowerCase() === "resolved") return false;
  const createdAt = new Date(report?.createdAt || 0).getTime();
  if (!createdAt || Number.isNaN(createdAt)) return false;
  return Date.now() - createdAt <= SOS_ACTIVE_WINDOW_MS;
}
export default function PoliceHomeScreen({
  navigation
}) {
  const translate = useTranslate();
  const UI = useMemo(() => ({
    bg: "#F6F3EE",
    card: "#FFFFFF",
    card2: "#FFF7EF",
    text: translate("#111111"),
    mut: "#6F6257",
    softText: "#9B8A7B",
    line: "#EADBCB",
    accent: "#FF7A1A",
    accent2: "#D97706",
    accentSoft: "#FFE0C2",
    emergencyBg: "#FFF1F1",
    emergencyBorder: "#F5B3B3",
    emergencyText: "#9F1239",
    danger: "#EF4444",
    warn: "#F59E0B",
    white: "#FFFFFF"
  }), []);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef(null);
  const didMountRef = useRef(false);
  const counts = useMemo(() => {
    const open = reports.filter(r => r.status === "Open").length;
    const assigned = reports.filter(r => r.status === "Assigned").length;
    const resolved = reports.filter(r => r.status === "Resolved").length;
    const emergency = reports.filter(r => isPoliceSos(r) && r.status !== "Resolved").length;
    return {
      open,
      assigned,
      resolved,
      emergency
    };
  }, [reports]);
  const badgeTone = priority => {
    if (priority === "High") return UI.danger;
    if (priority === "Medium") return UI.warn;
    return UI.accent;
  };
  const statusTone = status => {
    if (status === "Open") return UI.danger;
    if (status === "Assigned") return UI.accent2;
    return UI.accent;
  };
  const getToken = async () => AsyncStorage.getItem("token");
  const openInMaps = async geoLocation => {
    try {
      if (!Number.isFinite(geoLocation?.latitude) || !Number.isFinite(geoLocation?.longitude)) {
        return Alert.alert(translate("Location unavailable"), translate("This report does not have pinned coordinates."));
      }
      await openCoordinatesInMaps({
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
        label: translate("Police report location")
      });
    } catch (error) {
      Alert.alert(translate("Maps error"), error?.message || "Could not open the pinned location.");
    }
  };
  const showReportDetails = report => {
    const coords = extractCoordinates(report);
    const trackingActive = isSosTrackingActive(report);
    const details = [`Report: ${report.id}`, `Type: ${report.type}`, `Priority: ${report.priority}`, `Status: ${report.status}`, `Area: ${report.area || "Unknown area"}`, `Updated: ${report.time || "just now"}`, report.description ? `Description: ${report.description}` : "Description: No description provided"];
    if (coords) {
      details.push(`Pinned Coordinates: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
    }
    if (trackingActive) {
      details.push("Emergency Tracking: Active");
    }
    Alert.alert(translate("Report Details"), details.join("\n\n"), coords ? [{
      text: translate("Close"),
      style: "cancel"
    }, {
      text: translate("Open in Maps"),
      onPress: () => openInMaps(coords)
    }] : [{
      text: translate("Close"),
      style: "cancel"
    }]);
  };
  const apiGetReports = async ({
    token,
    status,
    q
  }) => {
    const params = new URLSearchParams();
    params.append("status", status || "All");
    if (q) params.append("q", q);
    const res = await fetch(`${BASE_URL}/api/police/reports?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load police reports");
    return data;
  };
  const apiPatchReport = async ({
    token,
    mongoId,
    action
  }) => {
    const res = await fetch(`${BASE_URL}/api/police/reports/${mongoId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        action
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to update report");
    return data;
  };
  const loadAll = useCallback(async ({
    showSpinner = false
  } = {}) => {
    try {
      if (showSpinner) setLoading(true);
      const token = await getToken();
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        Alert.alert(translate("Login required"), translate("Token not found. Please login again."));
        return;
      }
      const reportsRes = await apiGetReports({
        token,
        status: filter,
        q: query.trim()
      });
      const list = Array.isArray(reportsRes?.reports) ? reportsRes.reports : [];
      const normalized = list.map(r => ({
        ...r,
        id: r.reportCode || r.id || r._id,
        type: r.type || r.title || "Report",
        time: r.time || timeAgo(r.createdAt),
        area: r.area || "Unknown area",
        priority: r.priority || "Medium",
        status: r.status || "Open",
        description: r.description || ""
      })).sort((a, b) => {
        const aSos = isPoliceSos(a) ? 1 : 0;
        const bSos = isPoliceSos(b) ? 1 : 0;
        if (aSos !== bSos) return bSos - aSos;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setReports(normalized);
    } catch (error) {
      Alert.alert(translate("Error"), error?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, query]);
  useEffect(() => {
    loadAll({
      showSpinner: true
    });
    didMountRef.current = true;
  }, [loadAll]);
  useEffect(() => {
    if (!didMountRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadAll({
        showSpinner: false
      });
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, loadAll]);
  useEffect(() => {
    if (!didMountRef.current) return;
    loadAll({
      showSpinner: false
    });
  }, [filter, loadAll]);
  useFocusEffect(useCallback(() => {
    loadAll({
      showSpinner: false
    });
    const interval = setInterval(() => {
      loadAll({
        showSpinner: false
      });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadAll]));
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll({
      showSpinner: false
    });
  };
  const onAssignToMe = r => {
    Alert.alert(translate("Assign"), `Assign ${r.id} to you?`, [{
      text: translate("Cancel"),
      style: "cancel"
    }, {
      text: translate("Assign"),
      onPress: async () => {
        try {
          const token = await getToken();
          if (!token) return Alert.alert(translate("Login required"), translate("Token missing."));
          await apiPatchReport({
            token,
            mongoId: r._id,
            action: "assignToMe"
          });
          loadAll({
            showSpinner: false
          });
        } catch (error) {
          Alert.alert(translate("Error"), error?.message || "Failed to assign report");
        }
      }
    }]);
  };
  const onMarkResolved = r => {
    Alert.alert(translate("Resolve"), `Mark ${r.id} as resolved?`, [{
      text: translate("Cancel"),
      style: "cancel"
    }, {
      text: translate("Resolve"),
      onPress: async () => {
        try {
          const token = await getToken();
          if (!token) return Alert.alert(translate("Login required"), translate("Token missing."));
          await apiPatchReport({
            token,
            mongoId: r._id,
            action: "resolve"
          });
          loadAll({
            showSpinner: false
          });
        } catch (error) {
          Alert.alert(translate("Error"), error?.message || "Failed to resolve report");
        }
      }
    }]);
  };
  const titleAccentStyle = useMemo(() => [styles.titleAccent, {
    color: UI.accent
  }], [UI.accent]);
  const loadingTextStyle = useMemo(() => [styles.loadingText, {
    color: UI.mut
  }], [UI.mut]);
  const footerStyle = useMemo(() => [styles.footer, {
    color: UI.mut
  }], [UI.mut]);
  return <SafeAreaView style={[styles.safe, {
    backgroundColor: UI.bg
  }]}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.text} />}>
        <View style={[styles.hero, {
        borderColor: UI.line,
        backgroundColor: UI.card
      }]}>
          <View style={[styles.heroGlow, {
          backgroundColor: UI.card2
        }]} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, {
              color: UI.text
            }]}>{translate("Police")}<Text style={titleAccentStyle}>{translate("Desk")}</Text>
              </Text>
              <Text style={[styles.sub, {
              color: UI.mut
            }]}>{translate("Monitor reports, surface emergency SOS alerts, and move cases forward faster.")}</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity activeOpacity={0.9} style={[styles.quickBtn, {
              backgroundColor: UI.accent
            }]} onPress={() => navigation.navigate("TrafficFineCreate")}>
                <Ionicons name="card-outline" size={16} color="#fff" />
                <Text style={styles.quickBtnTxt}>{translate("Issue Fine")}</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.9} style={[styles.roundBtn, {
              borderColor: UI.line
            }]} onPress={() => navigation.navigate("Settings")}>
                <Ionicons name="settings-outline" size={22} color={UI.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroBand}>
            <HeroChip text={translate("SOS auto-refresh")} icon="alert-circle-outline" iconColor={UI.danger} textColor={UI.emergencyText} borderColor={UI.emergencyBorder} backgroundColor={UI.emergencyBg} />
            <HeroChip text={translate("Rapid assignment")} icon="flash-outline" iconColor={UI.warn} textColor={UI.text} borderColor={UI.line} backgroundColor={UI.card2} />
            <HeroChip text={translate("Open map pins")} icon="navigate-outline" iconColor={UI.accent} textColor={UI.text} borderColor={UI.line} backgroundColor={UI.card2} />
            <HeroChip text={translate("Tracking badges")} icon="pulse-outline" iconColor={UI.accent2} textColor={UI.text} borderColor={UI.line} backgroundColor={UI.card2} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatPill label={translate("Emergency")} value={counts.emergency} color={UI.danger} textColor={UI.text} mutedColor={UI.mut} borderColor={UI.line} backgroundColor={UI.card} />
          <StatPill label={translate("Open")} value={counts.open} color={UI.danger} textColor={UI.text} mutedColor={UI.mut} borderColor={UI.line} backgroundColor={UI.card} />
          <StatPill label={translate("Assigned")} value={counts.assigned} color={UI.accent2} textColor={UI.text} mutedColor={UI.mut} borderColor={UI.line} backgroundColor={UI.card} />
          <StatPill label={translate("Resolved")} value={counts.resolved} color={UI.accent} textColor={UI.text} mutedColor={UI.mut} borderColor={UI.line} backgroundColor={UI.card} />
        </View>

        <View style={[styles.searchBox, {
        borderColor: UI.line,
        backgroundColor: UI.card
      }]}>
          <Ionicons name="search-outline" size={18} color={UI.mut} />
          <TextInput value={query} onChangeText={setQuery} placeholder={translate("Search type, area, status, priority...")} placeholderTextColor={UI.softText} style={[styles.searchInput, {
          color: UI.text
        }]} />
          {!!query && <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color={UI.mut} />
            </TouchableOpacity>}
        </View>

        <View style={styles.filters}>
          {["All", "Open", "Assigned", "Resolved"].map(f => <TouchableOpacity key={f} activeOpacity={0.9} onPress={() => setFilter(f)} style={[styles.filterChip, {
          borderColor: UI.line,
          backgroundColor: filter === f ? UI.accentSoft : UI.card
        }]}>
              <Text style={[styles.filterChipText, {
            color: filter === f ? UI.accent2 : UI.mut
          }]}>
                {f}
              </Text>
            </TouchableOpacity>)}
        </View>

        <View style={[styles.section, {
        borderColor: UI.line,
        backgroundColor: UI.card
      }]}>
          <View style={styles.sectionTop}>
            <Text style={[styles.sectionTitle, {
            color: UI.text
          }]}>{translate("Priority Queue")}</Text>

            {loading ? <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={UI.text} />
                <Text style={loadingTextStyle}>{translate("Loading...")}</Text>
              </View> : null}
          </View>

          {!loading && reports.length === 0 ? <View style={[styles.empty, {
          borderColor: UI.line
        }]}>
              <Ionicons name="sparkles-outline" size={20} color={UI.accent} />
              <Text style={[styles.emptyTxt, {
            color: UI.mut
          }]}>{translate("No reports yet.")}</Text>
            </View> : null}

          {reports.map(r => {
          const coords = extractCoordinates(r);
          const emergency = isPoliceSos(r);
          const trackingActive = isSosTrackingActive(r);
          const cardBorder = emergency ? UI.emergencyBorder : UI.line;
          const cardBg = emergency ? UI.emergencyBg : UI.card2;
          const accentText = emergency ? UI.emergencyText : UI.mut;
          return <TouchableOpacity key={r._id} activeOpacity={0.92} onPress={() => showReportDetails(r)} style={[styles.reportCard, {
            borderColor: cardBorder,
            backgroundColor: cardBg
          }]}>
                <View style={styles.reportTop}>
                  <Text style={[styles.reportId, {
                color: UI.text
              }]}>{r.id}</Text>

                  <View style={[styles.badge, styles.whiteBg, {
                borderColor: cardBorder
              }]}>
                    <View style={[styles.dot, {
                  backgroundColor: badgeTone(r.priority)
                }]} />
                    <Text style={[styles.badgeTxt, {
                  color: UI.text
                }]}>{r.priority}</Text>
                  </View>
                </View>

                <View style={styles.emergencyTitleRow}>
                  <Text style={[styles.reportTitle, {
                color: emergency ? UI.emergencyText : UI.text
              }]}>{r.type}</Text>
                  {emergency ? <View style={[styles.emergencyBadge, styles.whiteBg, {
                borderColor: UI.emergencyBorder
              }]}>
                      <Text style={[styles.emergencyBadgeText, {
                  color: UI.emergencyText
                }]}>{translate("Emergency")}</Text>
                    </View> : null}
                  {trackingActive ? <View style={[styles.emergencyBadge, styles.whiteBg, {
                borderColor: UI.emergencyBorder
              }]}>
                      <Text style={[styles.emergencyBadgeText, {
                  color: UI.emergencyText
                }]}>{translate("Tracking active")}</Text>
                    </View> : null}
                </View>

                {!!r.description && <Text style={[styles.reportDescription, {
              color: accentText
            }]} numberOfLines={2}>
                    {r.description}
                  </Text>}

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={accentText} />
                  <Text style={[styles.metaTxt, {
                color: accentText
              }]}>{r.area}</Text>
                  <Text style={[styles.metaDot, {
                color: accentText
              }]}>•</Text>
                  <Ionicons name="time-outline" size={14} color={accentText} />
                  <Text style={[styles.metaTxt, {
                color: accentText
              }]}>{r.time || "just now"}</Text>
                </View>

                {coords ? <View style={styles.coordRow}>
                    <Text style={[styles.coordTxt, {
                color: accentText
              }]}>{translate("Coordinates:")}{coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                    </Text>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => openInMaps(coords)} style={[styles.mapBtn, styles.whiteBg, {
                borderColor: cardBorder
              }]}>
                      <Ionicons name="navigate-outline" size={14} color={UI.text} />
                      <Text style={[styles.mapBtnTxt, {
                  color: UI.text
                }]}>{translate("Open in Maps")}</Text>
                    </TouchableOpacity>
                  </View> : null}

                <View style={styles.actionsRow}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => showReportDetails(r)} style={[styles.actionBtn, styles.whiteBg, {
                borderColor: cardBorder
              }]}>
                    <Ionicons name="document-text-outline" size={16} color={UI.text} />
                    <Text style={[styles.actionTxt, {
                  color: UI.text
                }]}>{translate("Details")}</Text>
                  </TouchableOpacity>

                  {coords ? <TouchableOpacity activeOpacity={0.9} onPress={() => openInMaps(coords)} style={[styles.actionBtn, styles.whiteBg, {
                borderColor: cardBorder
              }]}>
                      <Ionicons name="navigate-outline" size={16} color={UI.text} />
                      <Text style={[styles.actionTxt, {
                  color: UI.text
                }]}>{translate("Maps")}</Text>
                    </TouchableOpacity> : null}

                  <View style={[styles.statusPill, styles.whiteBg, {
                borderColor: cardBorder
              }]}>
                    <View style={[styles.dot, {
                  backgroundColor: statusTone(r.status)
                }]} />
                    <Text style={[styles.statusTxt, {
                  color: UI.text
                }]}>{r.status}</Text>
                  </View>

                  {r.status !== "Assigned" && r.status !== "Resolved" && <TouchableOpacity activeOpacity={0.9} onPress={() => onAssignToMe(r)} style={[styles.actionBtn, styles.whiteBg, {
                borderColor: cardBorder
              }]}>
                      <Ionicons name="person-add-outline" size={16} color={UI.text} />
                      <Text style={[styles.actionTxt, {
                  color: UI.text
                }]}>{translate("Assign")}</Text>
                    </TouchableOpacity>}

                  {r.status !== "Resolved" && <TouchableOpacity activeOpacity={0.9} onPress={() => onMarkResolved(r)} style={[styles.actionBtn, styles.whiteBg, {
                borderColor: cardBorder
              }]}>
                      <Ionicons name="checkmark-done-outline" size={16} color={UI.accent} />
                      <Text style={[styles.actionTxt, {
                  color: UI.text
                }]}>{translate("Resolve")}</Text>
                    </TouchableOpacity>}
                </View>
              </TouchableOpacity>;
        })}
        </View>

        <Text style={footerStyle}>{translate("Live backend: GET /api/police/reports")}</Text>
      </ScrollView>
    </SafeAreaView>;
}
function HeroChip({
  icon,
  iconColor,
  text,
  textColor,
  borderColor,
  backgroundColor
}) {
  return <View style={[styles.heroChip, {
    borderColor,
    backgroundColor
  }]}>
      <Ionicons name={icon} size={14} color={iconColor} />
      <Text style={[styles.heroChipTxt, {
      color: textColor
    }]}>{text}</Text>
    </View>;
}
function StatPill({
  label,
  value,
  color,
  textColor,
  mutedColor,
  borderColor,
  backgroundColor
}) {
  return <View style={[styles.stat, {
    borderColor,
    backgroundColor
  }]}>
      <View style={styles.statTop}>
        <View style={[styles.dot, {
        backgroundColor: color
      }]} />
        <Text style={[styles.statLabel, {
        color: mutedColor
      }]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, {
      color: textColor
    }]}>{value}</Text>
    </View>;
}
const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  page: {
    padding: 16,
    paddingBottom: 26
  },
  hero: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#B45309",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 3
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  heroBand: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  heroChipTxt: {
    fontSize: 12,
    fontWeight: "800"
  },
  title: {
    fontSize: 22,
    fontWeight: "900"
  },
  titleAccent: {
    fontWeight: "900"
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  quickBtnTxt: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900"
  },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap"
  },
  stat: {
    flex: 1,
    minWidth: 76,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
    minHeight: 74
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "800"
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900"
  },
  searchBox: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 13
  },
  clearBtn: {
    padding: 2
  },
  filters: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap"
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterChipText: {
    fontWeight: "800",
    fontSize: 12
  },
  section: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14
  },
  sectionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 10
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "800"
  },
  empty: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  emptyTxt: {
    fontSize: 12,
    fontWeight: "700"
  },
  whiteBg: {
    backgroundColor: "#FFFFFF"
  },
  reportCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3
    },
    elevation: 2
  },
  reportTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  reportId: {
    fontSize: 12,
    fontWeight: "900",
    opacity: 0.95
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  badgeTxt: {
    fontSize: 11,
    fontWeight: "900"
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 99
  },
  emergencyTitleRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "900"
  },
  emergencyBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  emergencyBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  reportDescription: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700"
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap"
  },
  metaTxt: {
    fontSize: 12,
    fontWeight: "700"
  },
  metaDot: {
    marginHorizontal: 4,
    fontSize: 12,
    fontWeight: "900"
  },
  coordRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  coordTxt: {
    fontSize: 12,
    fontWeight: "700"
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  mapBtnTxt: {
    fontSize: 11,
    fontWeight: "900"
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  statusTxt: {
    fontSize: 11,
    fontWeight: "900"
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  actionTxt: {
    fontSize: 11,
    fontWeight: "900"
  },
  footer: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17
  }
});
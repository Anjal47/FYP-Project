import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { openCoordinatesInMaps } from "../../utils/maps";
import { useTranslate } from "../../utils/localization";

const BASE_URL = "http://10.0.2.2:5000";

async function muniGET(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

async function muniPATCH(path, token, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Update failed");
  return data;
}

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

function getCategoryKey(typeText) {
  const type = String(typeText || "").toLowerCase();
  if (/road|pothole|street\s*light|traffic\s*light|lighting/.test(type)) return "road";
  if (/waste|garbage|trash|litter|drain|drainage|sewage/.test(type)) return "waste";
  return "civic";
}

function getCategoryLabel(typeText) {
  const key = getCategoryKey(typeText);
  if (key === "road") return "Road";
  if (key === "waste") return "Waste";
  return "Civic";
}

export default function MunicipalityHomeScreen({
  navigation
}) {
  const translate = useTranslate();
  const UI = useMemo(() => ({
    bg: "#F6F3EE",
    card: "#FFFFFF",
    card2: "#FFF7EF",
    text: "#111111",
    mut: "#6F6257",
    softText: "#9B8A7B",
    line: "#EADBCB",
    accent: "#FF7A1A",
    accent2: "#D97706",
    accentSoft: "#FFE0C2",
    success: "#16A34A",
    successSoft: "#ECFDF3",
    successBorder: "#A7F3D0",
    warn: "#F59E0B",
    danger: "#EF4444",
    white: "#FFFFFF"
  }), []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [mode, setMode] = useState("all");
  const [category, setCategory] = useState("All");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [officerName, setOfficerName] = useState("Municipality Officer");
  const [officerEmail, setOfficerEmail] = useState("");
  const debounceRef = useRef(null);
  const didMountRef = useRef(false);

  const counts = useMemo(() => {
    const open = reports.filter(r => r.status === "Open").length;
    const assigned = reports.filter(r => r.status === "Assigned").length;
    const resolved = reports.filter(r => r.status === "Resolved").length;
    return {
      total: reports.length,
      open,
      assigned,
      resolved
    };
  }, [reports]);

  const statusTone = currentStatus => {
    if (currentStatus === "Resolved") return UI.success;
    if (currentStatus === "Assigned") return UI.accent2;
    return UI.danger;
  };

  const categoryTone = typeText => {
    const key = getCategoryKey(typeText);
    if (key === "road") return UI.warn;
    if (key === "waste") return UI.accent;
    return UI.success;
  };

  const getToken = async () => AsyncStorage.getItem("token");

  const openInMaps = async report => {
    try {
      const coords = extractCoordinates(report);
      if (!coords) {
        return Alert.alert(translate("Location unavailable"), translate("This complaint does not have pinned coordinates."));
      }
      await openCoordinatesInMaps({
        latitude: coords.latitude,
        longitude: coords.longitude,
        label: translate("Municipality report location")
      });
    } catch (error) {
      Alert.alert(translate("Maps error"), error?.message || "Could not open the pinned location.");
    }
  };

  const showReportDetails = report => {
    const coords = extractCoordinates(report);
    const details = [`Report: ${report.id}`, `Type: ${report.type}`, `Category: ${getCategoryLabel(report.type)}`, `Priority: ${report.priority}`, `Status: ${report.status}`, `Area: ${report.area || "Unknown area"}`, `Updated: ${report.time || "just now"}`, report.assignedOfficer ? `Assigned To: ${report.assignedOfficer}` : "Assigned To: Unassigned", report.description ? `Description: ${report.description}` : "Description: No description provided"];
    if (coords) {
      details.push(`Pinned Coordinates: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
    }
    Alert.alert(translate("Complaint Details"), details.join("\n\n"), coords ? [{
      text: translate("Close"),
      style: "cancel"
    }, {
      text: translate("Open in Maps"),
      onPress: () => openInMaps(report)
    }] : [{
      text: translate("Close"),
      style: "cancel"
    }]);
  };

  const loadOfficer = async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return;
      const user = JSON.parse(raw);
      if (user?.fullName) setOfficerName(user.fullName);
      if (user?.email) setOfficerEmail(user.email);
    } catch {}
  };

  const apiGetReports = async ({
    token
  }) => {
    const params = new URLSearchParams();
    params.append("mode", mode);
    params.append("status", status);
    params.append("category", category);
    if (query.trim()) params.append("q", query.trim());
    return muniGET(`/api/municipality/reports?${params.toString()}`, token);
  };

  const normalize = list => (Array.isArray(list) ? list : []).map(report => ({
    ...report,
    id: report.reportCode || report.id || report._id,
    time: report.time || timeAgo(report.createdAt),
    type: report.type || "Complaint",
    area: report.area || "Unknown area",
    description: report.description || "",
    status: report.status || "Open",
    priority: report.priority || "Medium",
    assignedOfficer: report.assignedTo?.fullName || "",
    geoLocation: report.geoLocation || null
  })).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

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
      const res = await apiGetReports({
        token
      });
      setReports(normalize(res?.reports));
    } catch (error) {
      Alert.alert(translate("Municipality"), error?.message || "Failed to load complaints");
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode, status, category, query]);

  useEffect(() => {
    loadOfficer();
    loadAll({
      showSpinner: true
    });
    didMountRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (!didMountRef.current) return;
    loadAll({
      showSpinner: false
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, status, category]);

  useFocusEffect(useCallback(() => {
    loadAll({
      showSpinner: false
    });
  }, [loadAll]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll({
      showSpinner: false
    });
  };

  const onAssignToMe = report => {
    Alert.alert(translate("Assign"), `Assign ${report.id} to you?`, [{
      text: translate("Cancel"),
      style: "cancel"
    }, {
      text: translate("Assign"),
      onPress: async () => {
        try {
          const token = await getToken();
          if (!token) return Alert.alert(translate("Login required"), translate("Token missing."));
          await muniPATCH(`/api/municipality/reports/${report._id}`, token, {
            take: true
          });
          loadAll({
            showSpinner: false
          });
        } catch (error) {
          Alert.alert(translate("Error"), error?.message || "Failed to assign complaint");
        }
      }
    }]);
  };

  const onResolve = report => {
    Alert.alert(translate("Resolve"), `Mark ${report.id} as resolved?`, [{
      text: translate("Cancel"),
      style: "cancel"
    }, {
      text: translate("Resolve"),
      onPress: async () => {
        try {
          const token = await getToken();
          if (!token) return Alert.alert(translate("Login required"), translate("Token missing."));
          await muniPATCH(`/api/municipality/reports/${report._id}`, token, {
            status: "Resolved"
          });
          loadAll({
            showSpinner: false
          });
        } catch (error) {
          Alert.alert(translate("Error"), error?.message || "Failed to resolve complaint");
        }
      }
    }]);
  };

  const logout = async () => {
    Alert.alert(translate("Logout?"), translate("You will be returned to the login screen."), [{
      text: translate("Cancel"),
      style: "cancel"
    }, {
      text: translate("Logout"),
      style: "destructive",
      onPress: async () => {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        navigation.reset({
          index: 0,
          routes: [{
            name: "Login"
          }]
        });
      }
    }]);
  };

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
            }]}>{translate("Municipality")}<Text style={[styles.titleAccent, {
                color: UI.accent
              }]}>{translate("Desk")}</Text>
              </Text>
              <Text style={[styles.sub, {
              color: UI.mut
            }]}>{translate("Coordinate waste and road complaints, assign field work, and close issues with a clearer queue.")}</Text>
              <Text style={[styles.officerLine, {
              color: UI.softText
            }]}>{translate("Officer:")} <Text style={[styles.officerValue, {
                  color: UI.text
                }]}>{officerName}</Text>{officerEmail ? ` | ${officerEmail}` : ""}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity activeOpacity={0.9} style={[styles.quickBtn, {
              backgroundColor: UI.accent
            }]} onPress={() => loadAll({
              showSpinner: true
            })}>
                <Ionicons name="refresh-outline" size={16} color="#fff" />
                <Text style={styles.quickBtnTxt}>{translate("Refresh")}</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.9} style={[styles.roundBtn, {
              borderColor: UI.line
            }]} onPress={logout}>
                <Ionicons name="log-out-outline" size={20} color={UI.danger} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroBand}>
            <HeroChip text={translate("Assigned-only mode")} icon="person-outline" iconColor={UI.accent2} textColor={UI.text} borderColor={UI.line} backgroundColor={UI.card2} />
            <HeroChip text={translate("Waste and road filters")} icon="funnel-outline" iconColor={UI.warn} textColor={UI.text} borderColor={UI.line} backgroundColor={UI.card2} />
            <HeroChip text={translate("Open map pins")} icon="navigate-outline" iconColor={UI.accent} textColor={UI.text} borderColor={UI.line} backgroundColor={UI.card2} />
            <HeroChip text={translate("Resolution queue")} icon="checkmark-done-outline" iconColor={UI.success} textColor={UI.text} borderColor={UI.successBorder} backgroundColor={UI.successSoft} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatPill label={translate("Total")} value={counts.total} color={UI.accent} textColor={UI.text} mutedColor={UI.mut} borderColor={UI.line} backgroundColor={UI.card} />
          <StatPill label={translate("Open")} value={counts.open} color={UI.danger} textColor={UI.text} mutedColor={UI.mut} borderColor={UI.line} backgroundColor={UI.card} />
          <StatPill label={translate("Assigned")} value={counts.assigned} color={UI.accent2} textColor={UI.text} mutedColor={UI.mut} borderColor={UI.line} backgroundColor={UI.card} />
          <StatPill label={translate("Resolved")} value={counts.resolved} color={UI.success} textColor={UI.text} mutedColor={UI.mut} borderColor={UI.line} backgroundColor={UI.card} />
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

        <View style={[styles.section, {
        borderColor: UI.line,
        backgroundColor: UI.card
      }]}>
          <Text style={[styles.sectionTitle, {
          color: UI.text
        }]}>{translate("Filters")}</Text>

          <FilterGroup label={translate("View")} value={mode} onChange={setMode} items={[{
            key: "assigned",
            label: translate("My Assigned")
          }, {
            key: "all",
            label: translate("All Complaints")
          }]} UI={UI} />

          <FilterGroup label={translate("Category")} value={category} onChange={setCategory} items={[{
            key: "All",
            label: translate("All")
          }, {
            key: "Waste",
            label: translate("Waste")
          }, {
            key: "Road",
            label: translate("Road")
          }]} UI={UI} />

          <FilterGroup label={translate("Status")} value={status} onChange={setStatus} items={[{
            key: "All",
            label: translate("All")
          }, {
            key: "Open",
            label: translate("Open")
          }, {
            key: "Assigned",
            label: translate("Assigned")
          }, {
            key: "Resolved",
            label: translate("Resolved")
          }]} UI={UI} />
        </View>

        <View style={[styles.section, {
        borderColor: UI.line,
        backgroundColor: UI.card
      }]}>
          <View style={styles.sectionTop}>
            <Text style={[styles.sectionTitle, {
            color: UI.text
          }]}>{translate("Complaints Queue")}</Text>

            {loading ? <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={UI.text} />
                <Text style={[styles.loadingText, {
              color: UI.mut
            }]}>{translate("Loading...")}</Text>
              </View> : null}
          </View>

          {!loading && reports.length === 0 ? <View style={[styles.empty, {
          borderColor: UI.line
        }]}>
              <Ionicons name="sparkles-outline" size={20} color={UI.accent} />
              <Text style={[styles.emptyTxt, {
            color: UI.mut
          }]}>{translate("No complaints found.")}</Text>
            </View> : null}

          {reports.map(report => {
          const coords = extractCoordinates(report);
          const categoryLabel = getCategoryLabel(report.type);
          const categoryColor = categoryTone(report.type);
          const currentStatusColor = statusTone(report.status);
          return <TouchableOpacity key={report._id} activeOpacity={0.92} onPress={() => showReportDetails(report)} style={[styles.reportCard, {
            borderColor: UI.line,
            backgroundColor: UI.card2
          }]}>
                <View style={styles.reportTop}>
                  <Text style={[styles.reportId, {
                color: UI.text
              }]}>{report.id}</Text>

                  <View style={[styles.badge, styles.whiteBg, {
                borderColor: UI.line
              }]}>
                    <View style={[styles.dot, {
                  backgroundColor: categoryColor
                }]} />
                    <Text style={[styles.badgeTxt, {
                  color: UI.text
                }]}>{translate(categoryLabel)}</Text>
                  </View>
                </View>

                <Text style={[styles.reportTitle, {
              color: UI.text
            }]}>{report.type}</Text>

                {!!report.description && <Text style={[styles.reportDescription, {
              color: UI.mut
            }]} numberOfLines={2}>
                    {report.description}
                  </Text>}

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={UI.mut} />
                  <Text style={[styles.metaTxt, {
                color: UI.mut
              }]}>{report.area}</Text>
                  <Text style={[styles.metaDot, {
                color: UI.mut
              }]}>|</Text>
                  <Ionicons name="time-outline" size={14} color={UI.mut} />
                  <Text style={[styles.metaTxt, {
                color: UI.mut
              }]}>{report.time || "just now"}</Text>
                  {!!report.assignedOfficer && <>
                      <Text style={[styles.metaDot, {
                  color: UI.mut
                }]}>|</Text>
                      <Ionicons name="person-outline" size={14} color={UI.mut} />
                      <Text style={[styles.metaTxt, {
                  color: UI.mut
                }]}>{report.assignedOfficer}</Text>
                    </>}
                </View>

                {coords ? <View style={styles.coordRow}>
                    <Text style={[styles.coordTxt, {
                color: UI.mut
              }]}>{translate("Coordinates:")} {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                    </Text>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => openInMaps(report)} style={[styles.mapBtn, styles.whiteBg, {
                borderColor: UI.line
              }]}>
                      <Ionicons name="navigate-outline" size={14} color={UI.text} />
                      <Text style={[styles.mapBtnTxt, {
                  color: UI.text
                }]}>{translate("Open in Maps")}</Text>
                    </TouchableOpacity>
                  </View> : null}

                <View style={styles.actionsRow}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => showReportDetails(report)} style={[styles.actionBtn, styles.whiteBg, {
                borderColor: UI.line
              }]}>
                    <Ionicons name="document-text-outline" size={16} color={UI.text} />
                    <Text style={[styles.actionTxt, {
                  color: UI.text
                }]}>{translate("Details")}</Text>
                  </TouchableOpacity>

                  {coords ? <TouchableOpacity activeOpacity={0.9} onPress={() => openInMaps(report)} style={[styles.actionBtn, styles.whiteBg, {
                borderColor: UI.line
              }]}>
                      <Ionicons name="navigate-outline" size={16} color={UI.text} />
                      <Text style={[styles.actionTxt, {
                  color: UI.text
                }]}>{translate("Maps")}</Text>
                    </TouchableOpacity> : null}

                  <View style={[styles.statusPill, styles.whiteBg, {
                borderColor: UI.line
              }]}>
                    <View style={[styles.dot, {
                  backgroundColor: currentStatusColor
                }]} />
                    <Text style={[styles.statusTxt, {
                  color: UI.text
                }]}>{report.status}</Text>
                  </View>

                  {report.status !== "Assigned" && report.status !== "Resolved" && <TouchableOpacity activeOpacity={0.9} onPress={() => onAssignToMe(report)} style={[styles.actionBtn, styles.whiteBg, {
                borderColor: UI.line
              }]}>
                      <Ionicons name="person-add-outline" size={16} color={UI.text} />
                      <Text style={[styles.actionTxt, {
                  color: UI.text
                }]}>{translate("Assign")}</Text>
                    </TouchableOpacity>}

                  {report.status !== "Resolved" && <TouchableOpacity activeOpacity={0.9} onPress={() => onResolve(report)} style={[styles.actionBtn, styles.whiteBg, {
                borderColor: UI.line
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

        <Text style={[styles.footer, {
        color: UI.mut
      }]}>{translate("Live backend: GET /api/municipality/reports")}</Text>
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

function FilterGroup({
  label,
  value,
  onChange,
  items,
  UI
}) {
  return <View style={styles.filterGroup}>
      <Text style={[styles.filterLabel, {
      color: UI.mut
    }]}>{label}</Text>
      <View style={styles.filters}>
        {items.map(item => <TouchableOpacity key={item.key} activeOpacity={0.9} onPress={() => onChange(item.key)} style={[styles.filterChip, {
        borderColor: UI.line,
        backgroundColor: value === item.key ? UI.accentSoft : UI.card
      }]}>
            <Text style={[styles.filterChipText, {
          color: value === item.key ? UI.accent2 : UI.mut
        }]}>{item.label}</Text>
          </TouchableOpacity>)}
      </View>
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
  officerLine: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  officerValue: {
    fontWeight: "900"
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
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
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
  section: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
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
  filterGroup: {
    marginTop: 2
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8
  },
  filters: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
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
  reportTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "900"
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
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17
  }
});

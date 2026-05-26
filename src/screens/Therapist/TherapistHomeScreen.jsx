// src/screens/therapist/TherapistHomeScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslate } from "../../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
const ORANGE = "#FF7A1A";
const BG = "#F4F4F4";

/* ----------------------------- API Helpers ----------------------------- */

/**
 * @param {string} token
 * @returns {Promise<any>}
 */
async function apiGetTherapistAppointments(token) {
  const res = await fetch(`${BASE_URL}/api/therapy/therapist/appointments`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load therapist appointments");
  return data;
}

/**
 * Therapist confirms appointment
 * PATCH /api/therapy/appointments/:id/confirm
 */
async function apiConfirmAppointment(token, appointmentId) {
  const res = await fetch(`${BASE_URL}/api/therapy/appointments/${appointmentId}/confirm`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to confirm appointment");
  return data;
}

/**
 * Therapist declines appointment
 * PATCH /api/therapy/appointments/:id/decline
 */
async function apiDeclineAppointment(token, appointmentId) {
  const res = await fetch(`${BASE_URL}/api/therapy/appointments/${appointmentId}/decline`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to decline appointment");
  return data;
}

/* --------------------------- Therapist Home --------------------------- */

/**
 * TherapistHomeScreen (Light Theme)
 * ✅ White + Orange theme (same vibe as counsellor)
 * ✅ Loads therapist appointments
 * ✅ Therapist can confirm / decline pending requests
 * ✅ Chat button appears ONLY when: status=confirmed AND mode=online
 * ✅ Chat navigation: TherapistChat (you add this route)
 * ✅ Logout button (clears token + resets to Login)
 */
export default function TherapistHomeScreen({
  navigation
}) {
  const translate = useTranslate();
  const UI = useMemo(() => ({
    bg: BG,
    card: "#FFFFFF",
    text: translate("#111"),
    mut: "#777",
    line: "#E3E3E3",
    orange: ORANGE,
    calm: "#22C55E",
    warn: "#F59E0B",
    danger: "#EF4444"
  }), []);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("Requests"); // Requests | Confirmed | All
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const badgeTone = status => {
    const s = String(status || "").toLowerCase();
    if (s === "confirmed") return UI.calm;
    if (s === "pending") return UI.warn;
    if (s === "cancelled") return UI.danger;
    if (s === "completed") return UI.calm;
    return UI.mut;
  };
  const statusLabel = status => {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return "PENDING";
    if (s === "confirmed") return "CONFIRMED";
    if (s === "cancelled") return "DECLINED";
    if (s === "completed") return "COMPLETED";
    return String(status || "").toUpperCase();
  };
  const safeNavLogin = () => navigation.reset({
    index: 0,
    routes: [{
      name: "Login"
    }]
  });

  /** ✅ Logout (clear token + reset nav) */
  const logout = () => {
    Alert.alert(translate("Log out"), translate("Are you sure you want to log out?"), [{
      text: translate("Cancel"),
      style: "cancel"
    }, {
      text: translate("Log out"),
      style: "destructive",
      onPress: async () => {
        try {
          // remove auth + any user cache if you store it
          await AsyncStorage.multiRemove(["token", "user"]);
        } catch (e) {
          // ignore remove errors, still leave the screen
        } finally {
          safeNavLogin();
        }
      }
    }]);
  };
  const load = async (opts = {
    silent: false
  }) => {
    const silent = !!opts?.silent;
    try {
      if (!silent) setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return safeNavLogin();
      const data = await apiGetTherapistAppointments(token);
      setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (e) {
      Alert.alert(translate("Therapist Hub"), e?.message || "Could not load appointments");
    } finally {
      if (!silent) setLoading(false);
    }
  };
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => load({
      silent: false
    }));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await load({
        silent: true
      });
    } finally {
      setRefreshing(false);
    }
  };
  const confirm = async appointmentId => {
    Alert.alert(translate("Confirm Appointment"), translate("Accept and confirm this appointment?"), [{
      text: translate("Cancel"),
      style: "cancel"
    }, {
      text: translate("Confirm"),
      onPress: async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return safeNavLogin();
          await apiConfirmAppointment(token, appointmentId);
          setAppointments(prev => prev.map(a => String(a.id) === String(appointmentId) ? {
            ...a,
            status: "confirmed"
          } : a));
        } catch (e) {
          Alert.alert(translate("Confirm failed"), e?.message || "Could not confirm");
        }
      }
    }]);
  };
  const decline = async appointmentId => {
    Alert.alert(translate("Decline Appointment"), translate("Decline this appointment request?"), [{
      text: translate("Cancel"),
      style: "cancel"
    }, {
      text: translate("Decline"),
      style: "destructive",
      onPress: async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return safeNavLogin();
          await apiDeclineAppointment(token, appointmentId);
          setAppointments(prev => prev.map(a => String(a.id) === String(appointmentId) ? {
            ...a,
            status: "cancelled"
          } : a));
        } catch (e) {
          Alert.alert(translate("Decline failed"), e?.message || "Could not decline");
        }
      }
    }]);
  };

  /**
   * ✅ Chat unlock rule
   * Show chat only if:
   *  - status confirmed
   *  - request.mode === "online" (case-insensitive)
   */
  const canChat = appt => {
    const status = String(appt?.status || "").toLowerCase();
    const mode = String(appt?.request?.mode || appt?.mode || "").toLowerCase();
    return status === "confirmed" && mode === "online";
  };
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byTab = a => {
      const s = String(a?.status || "").toLowerCase();
      if (tab === "Requests") return s === "pending";
      if (tab === "Confirmed") return s === "confirmed";
      return true;
    };
    const bySearch = a => {
      if (!q) return true;
      const userName = a?.user?.fullName || "";
      const problem = a?.request?.problem || "";
      const mode = a?.request?.mode || "";
      const slot = a?.slot || "";
      const month = a?.month || "";
      const status = a?.status || "";
      return String(a?.id || "").toLowerCase().includes(q) || userName.toLowerCase().includes(q) || problem.toLowerCase().includes(q) || mode.toLowerCase().includes(q) || slot.toLowerCase().includes(q) || month.toLowerCase().includes(q) || status.toLowerCase().includes(q);
    };
    return appointments.filter(a => byTab(a) && bySearch(a));
  }, [appointments, search, tab]);
  if (loading) {
    return <SafeAreaView style={[s.container, {
      backgroundColor: UI.bg
    }]}>
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={UI.orange} />
          <Text style={[s.loadingTxt, {
          color: UI.mut
        }]}>{translate("Loading Therapist Hub…")}</Text>
        </View>
      </SafeAreaView>;
  }
  return <SafeAreaView style={[s.container, {
    backgroundColor: UI.bg
  }]}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.text} />}>
        {/* Header */}
        <View style={[s.headerCard, shadow]}>
          <View style={s.headerRow}>
            <Text style={s.title}>
              <Text style={s.titleAccent}>{translate("Therapist")}</Text>
              <Text style={s.titleMain}>{translate("Hub.")}</Text>
            </Text>

            {/* ✅ Right actions: Refresh + Logout */}
            <View style={s.headerActions}>
              <TouchableOpacity activeOpacity={0.9} style={s.refreshBtn} onPress={onRefresh}>
                {refreshing ? <ActivityIndicator color="#111" /> : <Feather name="refresh-cw" size={18} color="#111" />}
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.9} style={s.logoutBtn} onPress={logout}>
                <Ionicons name="log-out-outline" size={18} color="#111" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={s.miniHint}>{translate("Confirm sessions, view details, and chat only for")}{" "}
            <Text style={{
            color: ORANGE,
            fontWeight: "900"
          }}>{translate("Online + Confirmed")}</Text>.
          </Text>

          {/* Search */}
          <View style={s.searchRow}>
            <View style={s.searchBar}>
              <Feather name="search" size={16} color="#9A9A9A" />
              <TextInput value={search} onChangeText={setSearch} placeholder={translate("Search client, problem, mode, slot...")} placeholderTextColor="#9A9A9A" style={s.searchInput} />
              {!!search && <TouchableOpacity activeOpacity={0.8} onPress={() => setSearch("")} style={s.clearBtn}>
                  <Feather name="x" size={16} color="#666" />
                </TouchableOpacity>}
            </View>
          </View>

          {/* Tabs */}
          <View style={s.tabsRow}>
            {["Requests", "Confirmed", "All"].map(t => {
            const active = tab === t;
            return <TouchableOpacity key={t} activeOpacity={0.9} onPress={() => setTab(t)} style={[s.tabChip, active ? {
              backgroundColor: "#FFF4E8",
              borderColor: "#FFD8BA"
            } : null]}>
                  <Text style={[s.tabTxt, active ? {
                color: ORANGE
              } : null]}>{t}</Text>
                </TouchableOpacity>;
          })}
          </View>
        </View>

        {/* Content */}
        <View style={{
        marginTop: 14
      }}>
          {filtered.length === 0 ? <View style={[s.emptyCard, shadow]}>
              <Text style={s.emptyTitle}>{translate("No appointments found")}</Text>
              <Text style={s.emptySub}>{translate("Try refresh or change the tab.")}</Text>
            </View> : filtered.map(a => {
          const status = String(a?.status || "pending").toLowerCase();
          const tone = badgeTone(status);
          const clientName = a?.user?.fullName || "Client";
          const problem = a?.request?.problem || "Therapy";
          const mode = a?.request?.mode || "Session";
          const language = a?.request?.language || "";
          const when = `${a?.month || ""} ${a?.day || ""} • ${a?.slot || ""}`.trim();
          const chatAllowed = canChat(a);
          return <View key={a.id} style={[s.card, shadow]}>
                  <View style={s.topRow}>
                    <View>
                      <Text style={s.name}>{clientName}</Text>
                      <Text style={s.problem}>{problem}</Text>
                    </View>

                    <View style={[s.statusPill, {
                borderColor: tone
              }]}>
                      <View style={[s.dot, {
                  backgroundColor: tone
                }]} />
                      <Text style={[s.statusTxt, {
                  color: tone
                }]}>{statusLabel(status)}</Text>
                    </View>
                  </View>

                  {!!when && <View style={s.rowLine}>
                      <Feather name="calendar" size={14} color={ORANGE} />
                      <Text style={s.rowText}>{when}</Text>
                    </View>}

                  <View style={s.rowLine}>
                    <Feather name="activity" size={14} color={ORANGE} />
                    <Text style={s.rowText}>
                      {String(mode || "").toUpperCase()}
                      {!!language ? ` • ${language}` : ""}
                    </Text>
                  </View>

                  {!!a?.request?.description && <View style={s.descBox}>
                      <Text style={s.descTitle}>{translate("Client Notes")}</Text>
                      <Text style={s.descText} numberOfLines={4}>
                        {a.request.description}
                      </Text>
                    </View>}

                  {/* Actions */}
                  {status === "pending" ? <View style={s.actionsRow}>
                      <TouchableOpacity activeOpacity={0.9} style={s.actionBtn} onPress={() => confirm(a.id)}>
                        <Ionicons name="checkmark-outline" size={18} color={UI.calm} />
                        <Text style={s.actionTxt}>{translate("Confirm")}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity activeOpacity={0.9} style={s.actionBtn} onPress={() => decline(a.id)}>
                        <Ionicons name="close-outline" size={18} color={UI.danger} />
                        <Text style={s.actionTxt}>{translate("Decline")}</Text>
                      </TouchableOpacity>

                      {/* Chat locked on pending */}
                      <View style={[s.actionBtn, {
                opacity: 0.45
              }]}>
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#111" />
                        <Text style={s.actionTxt}>{translate("Chat")}</Text>
                      </View>
                    </View> : <View style={s.actionsRow}>
                      {/* ✅ Chat shows only when confirmed + online */}
                      {chatAllowed ? <TouchableOpacity activeOpacity={0.9} style={s.actionBtn} onPress={() => navigation.navigate("TherapistChat", {
                appointmentId: String(a.id),
                clientName: clientName,
                clientPhone: String(a?.user?.phone || "")
              })}>
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#111" />
                          <Text style={s.actionTxt}>{translate("Chat")}</Text>
                        </TouchableOpacity> : <View style={[s.actionBtn, {
                opacity: 0.45
              }]}>
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#111" />
                          <Text style={s.actionTxt}>{translate("Chat")}</Text>
                        </View>}

                      <TouchableOpacity activeOpacity={0.9} style={s.actionBtn} onPress={() => Alert.alert(translate("Details"), translate("You can navigate to a details screen here."))}>
                        <Ionicons name="person-outline" size={18} color="#111" />
                        <Text style={s.actionTxt}>{translate("Details")}</Text>
                      </TouchableOpacity>

                      {!chatAllowed && <Text style={s.lockHint}>{translate("Chat unlocks only for")}<Text style={{
                  fontWeight: "900"
                }}>{translate("Online + Confirmed")}</Text>.
                        </Text>}
                    </View>}
                </View>;
        })}
        </View>

        <Text style={s.footerNote}>{translate("API: GET /api/therapy/therapist/appointments • PATCH confirm/decline")}</Text>
      </ScrollView>
    </SafeAreaView>;
}
const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: {
    width: 0,
    height: 6
  },
  elevation: 5
};
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG
  },
  page: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 26
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderRadius: 24
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  /* ✅ NEW: action wrapper on the right */
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF"
  },
  /* ✅ NEW: logout button (orange-ish vibe) */
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFD8BA"
  },
  title: {
    fontSize: 24,
    fontWeight: "900"
  },
  titleAccent: {
    color: ORANGE,
    fontWeight: "900"
  },
  titleMain: {
    color: "#111",
    fontWeight: "900"
  },
  miniHint: {
    marginTop: 2,
    fontSize: 12,
    color: "#777",
    fontWeight: "700"
  },
  searchRow: {
    marginTop: 12
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F2F2F2",
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111",
    paddingVertical: 0
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ECECEC"
  },
  tabsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap"
  },
  tabChip: {
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  tabTxt: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111"
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  loadingTxt: {
    fontSize: 13,
    fontWeight: "800"
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111"
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: "#777",
    fontWeight: "700"
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  name: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111"
  },
  problem: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#777"
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 99
  },
  statusTxt: {
    fontSize: 11,
    fontWeight: "900"
  },
  rowLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10
  },
  rowText: {
    fontSize: 13,
    color: ORANGE,
    fontWeight: "800",
    flex: 1
  },
  descBox: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDEDED",
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...shadow
  },
  descTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111",
    marginBottom: 6
  },
  descText: {
    fontSize: 13,
    color: "#777",
    fontWeight: "700",
    lineHeight: 18
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center"
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F2F2F2",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E3E3E3"
  },
  actionTxt: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111"
  },
  lockHint: {
    width: "100%",
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800",
    color: "#777"
  },
  footerNote: {
    marginTop: 10,
    fontSize: 12,
    color: "#777",
    fontWeight: "700"
  }
});
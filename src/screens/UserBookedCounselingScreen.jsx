// src/screens/UserBookedCounselingScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import FloatingHelpChat from "../components/FloatingHelpChat";

const ORANGE = "#FF7A1A";
const BASE_URL = "http://10.0.2.2:5000";

/**
 * ✅ GET logged-in user's counselling appointments
 * Backend returns: { ok:true, appointments:[ ... ] }
 */
async function apiGetMyCounselingAppointments(token) {
  const res = await fetch(`${BASE_URL}/api/counseling/appointments/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Not Found: /api/counseling/appointments/mine`);
  return json;
}

const safe = (v, fallback = "—") => (v === null || v === undefined || v === "" ? fallback : String(v));

const statusUI = (statusRaw) => {
  const s = String(statusRaw || "").toLowerCase().trim();
  if (s === "approved" || s === "confirmed") return { text: "Approved", bg: "#EAF7EE", fg: "#197A3A" };
  if (s === "rejected" || s === "cancelled" || s === "canceled") return { text: "Rejected", bg: "#FCECEC", fg: "#B42318" };
  if (s === "completed") return { text: "Completed", bg: "#EEF6FF", fg: "#175CD3" };
  return { text: "Pending", bg: "#FFF6E5", fg: "#B54708" };
};

const isApproved = (statusRaw) => {
  const s = String(statusRaw || "").toLowerCase().trim();
  return s === "approved" || s === "confirmed";
};

const isOnlineMode = (modeRaw) => {
  const m = String(modeRaw || "").toLowerCase().trim();
  return m === "online";
};

export default function UserBookedCounselingScreen({ navigation }) {
  const UI = useMemo(
    () => ({
      bg: "#F4F4F4",
      card: "#FFFFFF",
      text: "#111",
      mut: "#666",
      line: "#E3E3E3",
      orange: ORANGE,
    }),
    []
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const data = await apiGetMyCounselingAppointments(token);
      const list = Array.isArray(data?.appointments) ? data.appointments : [];
      setAppointments(list);
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not load booked sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSettingsPress = () => navigation.navigate("Settings");
  const handleHomePress = () => navigation.navigate("Home");
  const handleProfilePress = () => navigation.navigate("Profile");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: UI.bg }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color={UI.text} />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}> Counseling</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.screenTitle}>Booked Sessions.</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={UI.orange} />
            <Text style={styles.loadingTxt}>Loading booked sessions…</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: UI.card }]}>
            <Text style={styles.emptyTitle}>No booked sessions</Text>
            <Text style={styles.emptySub}>When you book counselling, sessions will show up here.</Text>

            <TouchableOpacity activeOpacity={0.9} style={styles.reloadBtn} onPress={load}>
              <Icon name="rotate-ccw" size={18} color="#111" />
              <Text style={styles.reloadTxt}>Reload</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {appointments.map((a) => {
              const key = String(a?.id || a?._id);
              const counsellorName = a?.counsellor?.fullName || "Counsellor";
              const st = statusUI(a?.status);

              const modeValue = a?.mode || a?.requestId?.mode || "";

              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.95}
                  style={[styles.sessionCard, { backgroundColor: UI.card }]}
                  onPress={() => {
                    Alert.alert(
                      "Session Details",
                      `Counsellor: ${safe(counsellorName)}\nStatus: ${safe(a?.status)}\nMode: ${safe(
                        modeValue
                      )}\nDate: ${safe(a?.month)} ${safe(a?.day)}\nTime: ${safe(a?.slot)}\nRequestId: ${safe(
                        a?.requestId?._id || a?.requestId || ""
                      )}\n\nCreated: ${safe(a?.createdAt || "")}`,
                      [{ text: "OK" }]
                    );
                  }}
                >
                  {/* top row */}
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.counsellorName} numberOfLines={1}>
                        {counsellorName}
                      </Text>
                      <Text style={styles.smallMeta} numberOfLines={1}>
                        {safe(a?.month)} {safe(a?.day)} • {safe(a?.slot)} • {safe(modeValue)}
                      </Text>
                    </View>

                    {/* ✅ message icon ONLY if Approved + Online */}
                    {isApproved(a?.status) && isOnlineMode(modeValue) ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.msgBtn}
                        onPress={() => {
                          navigation.navigate("CounselingChat", {
                            appointmentId: String(a?.id || a?._id),
                            counsellorId: String(a?.counsellor?._id || a?.counsellor?.id || ""),
                            counsellorName: counsellorName,
                          });
                        }}
                      >
                        <Icon name="message-circle" size={18} color="#fff" />
                      </TouchableOpacity>
                    ) : null}

                    <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusTxt, { color: st.fg }]}>{st.text}</Text>
                    </View>
                  </View>

                  {/* divider */}
                  <View style={styles.divider} />

                  {/* bottom info */}
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>RequestId</Text>
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {safe(a?.requestId?._id || a?.requestId || "—")}
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Session ID</Text>
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {safe(a?.id || a?._id)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ORANGE SIDE PILL */}
      <FloatingHelpChat bottom={110} fabBottom={145} />

      {/* ✅ BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem} onPress={handleSettingsPress} activeOpacity={0.8}>
          <Icon name="settings" size={20} color="#9A9A9A" />
          <Text style={styles.tabLabel}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={handleHomePress} activeOpacity={0.8}>
          <View style={styles.homeIconWrapper}>
            <Icon name="home" size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={handleProfilePress} activeOpacity={0.8}>
          <Icon name="user" size={20} color="#9A9A9A" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F4" },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", marginLeft: 8 },
  headerHighlight: { color: ORANGE },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 160 },

  screenTitle: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 16 },

  loadingWrap: { paddingTop: 40, alignItems: "center" },
  loadingTxt: { marginTop: 10, color: "#666", fontWeight: "700" },

  emptyCard: {
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#111" },
  emptySub: { marginTop: 6, color: "#666", fontWeight: "700" },
  reloadBtn: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  reloadTxt: { fontWeight: "900", color: "#111" },

  sessionCard: {
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  counsellorName: { fontSize: 15, fontWeight: "900", color: "#111" },
  smallMeta: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#666" },

  msgBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusTxt: { fontWeight: "900", fontSize: 12 },

  divider: { height: 1, backgroundColor: "#EDEDED", marginTop: 14, marginBottom: 12 },

  infoRow: { flexDirection: "row", gap: 12 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "900", color: "#777" },
  infoValue: { marginTop: 4, fontSize: 12, fontWeight: "800", color: "#111" },

  sidePill: {
    position: "absolute",
    right: 0,
    bottom: 110,
    width: 56,
    height: 110,
    backgroundColor: ORANGE,
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: -2, height: 2 },
  },

  bottomBar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  homeIconWrapper: {
    backgroundColor: ORANGE,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  tabLabel: { fontSize: 11, color: "#9A9A9A", marginTop: 2 },
  tabLabelActive: { color: ORANGE, fontWeight: "600" },
});

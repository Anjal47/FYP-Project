import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ORANGE = "#FF7A1A";
const BG = "#F4F4F4";
const BASE_URL = "http://10.0.2.2:5000";

export default function CounsellorAppointmentsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [actingId, setActingId] = useState("");

  const badgeColor = (status) => {
    if (status === "confirmed") return "#22C55E";
    if (status === "pending") return "#F59E0B";
    if (status === "cancelled") return "#EF4444";
    if (status === "completed") return "#22C55E";
    return "#999";
  };

  const apiGetCounsellorAppointments = async (token) => {
    const res = await fetch(`${BASE_URL}/api/counseling/counsellor/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to load appointments");
    return data;
  };

  const apiAction = async (token, id, action) => {
    const res = await fetch(`${BASE_URL}/api/counseling/appointments/${id}/${action}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Failed to ${action}`);
    return data;
  };

  const load = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const data = await apiGetCounsellorAppointments(token);
      setRows(data?.appointments || []);
    } catch (e) {
      Alert.alert("Appointments", e?.message || "Could not load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation]);

  const onConfirm = (id) => {
    Alert.alert("Confirm", "Confirm this appointment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            setActingId(id);
            const token = await AsyncStorage.getItem("token");
            await apiAction(token, id, "confirm");
            await load();
          } catch (e) {
            Alert.alert("Confirm failed", e?.message || "Could not confirm");
          } finally {
            setActingId("");
          }
        },
      },
    ]);
  };

  const onDecline = (id) => {
    Alert.alert("Decline", "Decline this appointment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          try {
            setActingId(id);
            const token = await AsyncStorage.getItem("token");
            await apiAction(token, id, "decline");
            await load();
          } catch (e) {
            Alert.alert("Decline failed", e?.message || "Could not decline");
          } finally {
            setActingId("");
          }
        },
      },
    ]);
  };

  const pendingCount = rows.filter((item) => item.status === "pending").length;
  const confirmedCount = rows.filter((item) => item.status === "confirmed").length;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        <View style={s.headerCard}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.roundBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={20} color="#111" />
            </TouchableOpacity>

            <View style={s.headerCopy}>
              <Text style={s.title}>
                <Text style={s.titleMain}>Counsellor</Text>
                <Text style={s.titleAccent}> Appointments.</Text>
              </Text>
              <Text style={s.sub}>Confirm or decline pending sessions.</Text>
            </View>

            <TouchableOpacity style={s.roundBtn} onPress={load}>
              <Feather name="refresh-cw" size={18} color="#111" />
            </TouchableOpacity>
          </View>

          <View style={s.summaryRow}>
            <View style={s.summaryPill}>
              <Text style={s.summaryCount}>{rows.length}</Text>
              <Text style={s.summaryLabel}>Total</Text>
            </View>

            <View style={s.summaryPill}>
              <Text style={s.summaryCount}>{pendingCount}</Text>
              <Text style={s.summaryLabel}>Pending</Text>
            </View>

            <View style={s.summaryPill}>
              <Text style={s.summaryCount}>{confirmedCount}</Text>
              <Text style={s.summaryLabel}>Confirmed</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={ORANGE} />
            <Text style={s.loadingTxt}>Loading appointments...</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={s.empty}>
            <Feather name="calendar" size={20} color={ORANGE} />
            <Text style={s.emptyTxt}>No appointments yet.</Text>
          </View>
        ) : (
          rows.map((x) => {
            const isPending = x.status === "pending";
            const busy = actingId === x.id;

            return (
              <View key={x.id} style={s.card}>
                <View style={s.rowTop}>
                  <Text style={s.client}>{x?.user?.fullName || "Client"}</Text>

                  <View style={[s.statusPill, { borderColor: badgeColor(x.status) }]}>
                    <View style={[s.dot, { backgroundColor: badgeColor(x.status) }]} />
                    <Text style={[s.statusTxt, { color: badgeColor(x.status) }]}>
                      {String(x.status || "pending").toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={s.infoRow}>
                  <Feather name="calendar" size={14} color={ORANGE} />
                  <Text style={s.meta}>
                    {x.month} {x.day} • {x.slot}
                  </Text>
                </View>

                {!!x?.request?.problem && (
                  <View style={s.infoRow}>
                    <Feather name="activity" size={14} color={ORANGE} />
                    <Text style={s.problem}>
                      {x.request.problem}
                      <Text style={s.problemMeta}>
                        {" "}({x.request.mode}, {x.request.language})
                      </Text>
                    </Text>
                  </View>
                )}

                {!!x?.request?.description && (
                  <View style={s.descBox}>
                    <Text style={s.descTitle}>Client Notes</Text>
                    <Text style={s.desc} numberOfLines={3}>
                      {x.request.description}
                    </Text>
                  </View>
                )}

                <View style={s.actions}>
                  <TouchableOpacity
                    disabled={!isPending || busy}
                    activeOpacity={0.9}
                    style={[s.btn, s.confirmBtn, { opacity: !isPending || busy ? 0.55 : 1 }]}
                    onPress={() => onConfirm(x.id)}
                  >
                    {busy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Feather name="check" size={18} color="#FFFFFF" />
                    )}
                    <Text style={s.btnTxtLight}>Confirm</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={!isPending || busy}
                    activeOpacity={0.9}
                    style={[s.btn, s.declineBtn, { opacity: !isPending || busy ? 0.55 : 1 }]}
                    onPress={() => onDecline(x.id)}
                  >
                    {busy ? (
                      <ActivityIndicator color="#EF4444" />
                    ) : (
                      <Feather name="x" size={18} color="#EF4444" />
                    )}
                    <Text style={s.btnTxt}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingBottom: 26 },

  headerCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, marginLeft: 10 },
  title: { fontSize: 22, fontWeight: "900" },
  titleMain: { color: "#111" },
  titleAccent: { color: ORANGE },
  sub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#777" },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 10,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
  },
  summaryCount: { fontSize: 18, fontWeight: "900", color: ORANGE },
  summaryLabel: { marginTop: 2, fontSize: 11, fontWeight: "800", color: "#666" },

  loadingBox: { padding: 32, alignItems: "center", gap: 10 },
  loadingTxt: { fontWeight: "900", color: "#666" },

  empty: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 3,
  },
  emptyTxt: { fontSize: 13, fontWeight: "800", color: "#666" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  client: { fontSize: 16, fontWeight: "900", color: "#111" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusTxt: { fontSize: 10, fontWeight: "900" },
  dot: { width: 8, height: 8, borderRadius: 99 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  meta: { fontSize: 13, fontWeight: "800", color: "#777" },
  problem: { flex: 1, fontSize: 13, fontWeight: "900", color: "#111" },
  problemMeta: { color: "#777", fontWeight: "700" },

  descBox: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDEDED",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  descTitle: { fontSize: 12, fontWeight: "900", color: "#111", marginBottom: 6 },
  desc: { fontSize: 12, fontWeight: "700", lineHeight: 18, color: "#777" },

  actions: { marginTop: 14, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  confirmBtn: { backgroundColor: ORANGE },
  declineBtn: { backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#F3D2D2" },
  btnTxt: { fontSize: 12, fontWeight: "900", color: "#111" },
  btnTxtLight: { fontSize: 12, fontWeight: "900", color: "#FFFFFF" },
});

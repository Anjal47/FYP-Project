import React, { useEffect, useMemo, useState } from "react";
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
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.0.2.2:5000";

export default function CounsellorAppointmentsScreen({ navigation }) {
  const UI = useMemo(
    () => ({
      bg: "#0B0F14",
      card: "#111826",
      card2: "#0F172A",
      text: "#EAF0FF",
      mut: "rgba(234,240,255,0.68)",
      line: "rgba(255,255,255,0.08)",
      accent: "#FF7A1A",
      ok: "#22C55E",
      warn: "#F59E0B",
      danger: "#EF4444",
    }),
    []
  );

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [actingId, setActingId] = useState("");

  const badgeColor = (status) => {
    if (status === "confirmed") return UI.ok;
    if (status === "pending") return UI.warn;
    if (status === "cancelled") return UI.danger;
    if (status === "completed") return UI.ok;
    return UI.mut;
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
      if (!token) return navigation.reset({ index: 0, routes: [{ name: "Login" }] });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity style={[s.roundBtn, { borderColor: UI.line }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={UI.text} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.title, { color: UI.text }]}>
              Counsellor <Text style={{ color: UI.accent, fontWeight: "900" }}>Appointments</Text>
            </Text>
            <Text style={[s.sub, { color: UI.mut }]}>Confirm or decline pending sessions.</Text>
          </View>

          <TouchableOpacity style={[s.roundBtn, { borderColor: UI.line }]} onPress={load}>
            <Ionicons name="refresh" size={20} color={UI.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={UI.accent} />
            <Text style={[s.loadingTxt, { color: UI.mut }]}>Loading…</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={[s.empty, { borderColor: UI.line }]}>
            <Ionicons name="sparkles-outline" size={20} color={UI.accent} />
            <Text style={[s.emptyTxt, { color: UI.mut }]}>No appointments yet.</Text>
          </View>
        ) : (
          rows.map((x) => {
            const isPending = x.status === "pending";
            const busy = actingId === x.id;

            return (
              <View key={x.id} style={[s.card, { borderColor: UI.line, backgroundColor: UI.card }]}>
                <View style={s.rowTop}>
                  <Text style={[s.client, { color: UI.text }]}>{x?.user?.fullName || "Client"}</Text>

                  <View style={[s.statusPill, { borderColor: badgeColor(x.status) }]}>
                    <View style={[s.dot, { backgroundColor: badgeColor(x.status) }]} />
                    <Text style={[s.statusTxt, { color: badgeColor(x.status) }]}>
                      {String(x.status || "pending").toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={[s.meta, { color: UI.mut }]}>
                  {x.month} {x.day} • {x.slot}
                </Text>

                {!!x?.request?.problem && (
                  <Text style={[s.problem, { color: UI.text }]}>
                    {x.request.problem}{" "}
                    <Text style={{ color: UI.mut, fontWeight: "700" }}>
                      ({x.request.mode}, {x.request.language})
                    </Text>
                  </Text>
                )}

                {!!x?.request?.description && (
                  <Text style={[s.desc, { color: UI.mut }]} numberOfLines={3}>
                    {x.request.description}
                  </Text>
                )}

                <View style={s.actions}>
                  <TouchableOpacity
                    disabled={!isPending || busy}
                    activeOpacity={0.9}
                    style={[
                      s.btn,
                      { borderColor: UI.line, opacity: !isPending || busy ? 0.55 : 1 },
                    ]}
                    onPress={() => onConfirm(x.id)}
                  >
                    {busy ? (
                      <ActivityIndicator color={UI.ok} />
                    ) : (
                      <Ionicons name="checkmark" size={18} color={UI.ok} />
                    )}
                    <Text style={[s.btnTxt, { color: UI.text }]}>Confirm</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={!isPending || busy}
                    activeOpacity={0.9}
                    style={[
                      s.btn,
                      { borderColor: UI.line, opacity: !isPending || busy ? 0.55 : 1 },
                    ]}
                    onPress={() => onDecline(x.id)}
                  >
                    {busy ? (
                      <ActivityIndicator color={UI.danger} />
                    ) : (
                      <Ionicons name="close" size={18} color={UI.danger} />
                    )}
                    <Text style={[s.btnTxt, { color: UI.text }]}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <Text style={[s.footer, { color: UI.mut }]}>
          API used: GET /api/counseling/counsellor/appointments, PATCH /api/counseling/appointments/:id/confirm|decline
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { padding: 16, paddingBottom: 26 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 18, fontWeight: "900" },
  sub: { marginTop: 2, fontSize: 12, fontWeight: "700" },

  loadingBox: { padding: 24, alignItems: "center", gap: 10 },
  loadingTxt: { fontWeight: "900" },

  empty: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  emptyTxt: { fontSize: 12, fontWeight: "800" },

  card: { borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 10 },

  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  client: { fontSize: 14, fontWeight: "900" },

  statusPill: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusTxt: { fontSize: 10, fontWeight: "900" },
  dot: { width: 8, height: 8, borderRadius: 99 },

  meta: { marginTop: 8, fontSize: 12, fontWeight: "800" },
  problem: { marginTop: 8, fontSize: 13, fontWeight: "900" },
  desc: { marginTop: 6, fontSize: 12, fontWeight: "700", lineHeight: 18 },

  actions: { marginTop: 12, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  btn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  btnTxt: { fontSize: 11, fontWeight: "900" },

  footer: { marginTop: 10, fontSize: 11, fontWeight: "700", lineHeight: 16 },
});

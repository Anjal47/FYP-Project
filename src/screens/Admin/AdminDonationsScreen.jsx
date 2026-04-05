import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  RefreshControl,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { adminGET, adminPATCH } from "../../utils/adminApi";

export default function AdminDonationsScreen() {
  const UI = useMemo(
    () => ({
      bg: "#0B0F14",
      card: "#111826",
      card2: "#0F172A",
      text: "#EAF0FF",
      mut: "rgba(234,240,255,0.68)",
      line: "rgba(255,255,255,0.08)",
      accent: "#7C3AED",
      good: "#22C55E",
      danger: "#EF4444",
      warn: "#F59E0B",
    }),
    []
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState("");
  const [pending, setPending] = useState([]);
  const [q, setQ] = useState("");

  const load = useCallback(async (spinner = true) => {
    try {
      if (spinner) setLoading(true);
      const data = await adminGET("/api/donations/pending");
      setPending(Array.isArray(data?.donations) ? data.donations : []);
    } catch (e) {
      Alert.alert("Donations error", e?.message || "Failed to load pending donations");
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  };

  const updateDonation = async (id, action) => {
    try {
      setSubmittingId(id);
      await adminPATCH(`/api/donations/${id}/${action}`, {});
      setPending((prev) => prev.filter((item) => item._id !== id));
      const actionLabel = action === "approve" ? "approved" : "rejected";
      Alert.alert("Updated", `Donation request ${actionLabel} successfully.`);
    } catch (e) {
      Alert.alert("Update failed", e?.message || `Could not ${action} donation request`);
    } finally {
      setSubmittingId("");
    }
  };

  const filtered = pending.filter((item) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    const hay = [
      item?.fullName,
      item?.contact,
      item?.location,
      item?.helpType,
      item?.description,
      item?.createdBy?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(s);
  });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: UI.bg }]}>
      <ScrollView
        contentContainerStyle={s.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.title, { color: UI.text }]}>Donations</Text>
        <Text style={[s.sub, { color: UI.mut }]}>
          Review donation requests before they appear in the public charity feed.
        </Text>

        <View style={[s.search, { backgroundColor: UI.card, borderColor: UI.line }]}>
          <Ionicons name="search-outline" size={18} color={UI.mut} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by requester, location, help type..."
            placeholderTextColor="rgba(234,240,255,0.45)"
            style={[s.input, { color: UI.text }]}
          />
          {!!q && (
            <TouchableOpacity onPress={() => setQ("")}>
              <Ionicons name="close-circle" size={20} color={UI.mut} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[s.panel, { backgroundColor: UI.card, borderColor: UI.line }]}>
          {loading ? (
            <View style={s.centerBox}>
              <ActivityIndicator color={UI.accent} />
              <Text style={[s.centerText, { color: UI.mut }]}>Loading pending donations...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={s.centerBox}>
              <Ionicons name="checkmark-done-outline" size={22} color={UI.good} />
              <Text style={[s.centerText, { color: UI.mut }]}>No pending donation requests.</Text>
            </View>
          ) : (
            filtered.map((item) => {
              const busy = submittingId === item._id;
              return (
                <View key={item._id} style={[s.card, { backgroundColor: UI.card2, borderColor: UI.line }]}>
                  <View style={s.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cardTitle, { color: UI.text }]}>{item.helpType || "Donation Request"}</Text>
                      <Text style={[s.cardMeta, { color: UI.mut }]}>{item.fullName} • {item.location}</Text>
                    </View>
                    <View style={[s.badge, { borderColor: UI.warn }]}>
                      <View style={[s.dot, { backgroundColor: UI.warn }]} />
                      <Text style={[s.badgeText, { color: UI.warn }]}>Pending</Text>
                    </View>
                  </View>

                  <Text style={[s.amount, { color: UI.text }]}>Need: Rs. {item.amountNeeded}</Text>
                  <Text style={[s.desc, { color: UI.mut }]}>{item.description}</Text>

                  <Text style={[s.detail, { color: UI.mut }]}>Contact: {item.contact}</Text>
                  {item?.createdBy?.email ? (
                    <Text style={[s.detail, { color: UI.mut }]}>Submitted by: {item.createdBy.email}</Text>
                  ) : null}

                  <View style={s.previewRow}>
                    {item?.qrImage ? (
                      <Image source={{ uri: item.qrImage }} style={s.preview} resizeMode="cover" />
                    ) : null}
                    {item?.proofImage ? (
                      <Image source={{ uri: item.proofImage }} style={s.preview} resizeMode="cover" />
                    ) : null}
                  </View>

                  <View style={s.actions}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => updateDonation(item._id, "approve")}
                      disabled={busy}
                      style={[s.btn, { backgroundColor: UI.good, opacity: busy ? 0.7 : 1 }]}
                    >
                      <Text style={s.btnTxt}>{busy ? "Working..." : "Approve"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => updateDonation(item._id, "reject")}
                      disabled={busy}
                      style={[s.btn, { backgroundColor: UI.danger, opacity: busy ? 0.7 : 1 }]}
                    >
                      <Text style={s.btnTxt}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  page: { padding: 16, paddingBottom: 26 },
  title: { fontSize: 20, fontWeight: "900" },
  sub: { marginTop: 4, fontSize: 13, marginBottom: 12 },
  search: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 13 },
  panel: { borderWidth: 1, borderRadius: 18, padding: 12 },
  centerBox: { padding: 18, alignItems: "center" },
  centerText: { marginTop: 10, fontSize: 12, fontWeight: "800" },
  card: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10 },
  cardTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  cardTitle: { fontSize: 15, fontWeight: "900" },
  cardMeta: { marginTop: 4, fontSize: 12, fontWeight: "700" },
  amount: { marginTop: 10, fontSize: 13, fontWeight: "900" },
  desc: { marginTop: 8, fontSize: 13, lineHeight: 19 },
  detail: { marginTop: 6, fontSize: 12, fontWeight: "700" },
  previewRow: { flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" },
  preview: { width: 88, height: 88, borderRadius: 12, backgroundColor: "#1F2937" },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTxt: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "900" },
  dot: { width: 8, height: 8, borderRadius: 99 },
});

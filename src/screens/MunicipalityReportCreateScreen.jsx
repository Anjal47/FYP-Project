import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.0.2.2:5000";
const ORANGE = "#FF7A1A";

/**
 * Create a municipality-related report:
 * - Waste Management
 * - Road Complaint
 */
async function apiCreateReport(token, payload) {
  const res = await fetch(`${BASE_URL}/api/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to submit report");
  return data;
}

export default function MunicipalityReportCreateScreen({ navigation }) {
  // ✅ gets params from navigation (works with your Home navigation.navigate(..., {initialCategory}))
  const initialCategory =
    navigation?.getState?.()?.routes?.slice(-1)?.[0]?.params?.initialCategory;

  const [category, setCategory] = useState(initialCategory || "Waste Management");

  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);

  const typeValue = useMemo(() => {
    if (category === "Road Complaint") return "road complaint";
    return "waste management";
  }, [category]);

  const canSubmit = useMemo(() => {
    return String(area || "").trim().length >= 2;
  }, [area]);

  const chip = (label, active, onPress, iconName) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[s.chip, active ? s.chipActive : s.chipIdle]}
    >
      <Ionicons
        name={iconName}
        size={16}
        color={active ? "#fff" : ORANGE}
        style={{ marginRight: 8 }}
      />
      <Text style={[s.chipText, active ? s.chipTextActive : s.chipTextIdle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const submit = async () => {
    if (!canSubmit) {
      Alert.alert("Missing info", "Please enter a valid area/location.");
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found. Please login again.");

      const payload = {
        type: typeValue,
        area: String(area).trim(),
        description: String(description || "").trim(),
        priority,
      };

      const out = await apiCreateReport(token, payload);

      Alert.alert(
        "Submitted ✅",
        `Your report has been created.\n\nReport Code: ${out?.report?.reportCode || "N/A"}`,
        [
          { text: "OK", onPress: () => navigation.goBack?.() },
          { text: "View My Reports", onPress: () => navigation.navigate?.("MyReports") },
        ]
      );
    } catch (e) {
      Alert.alert("Submit failed", e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack?.()}
            activeOpacity={0.85}
            style={s.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={s.title}>Municipality Report</Text>
            <Text style={s.subtitle}>Waste Management / Road Complaint</Text>
          </View>

          <View style={s.badge}>
            <Ionicons name="shield-checkmark" size={16} color={ORANGE} />
            <Text style={s.badgeText}>Official</Text>
          </View>
        </View>

        {/* Category */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Category</Text>
          <Text style={s.cardHint}>
            Select what you are reporting so the municipality officer receives it correctly.
          </Text>

          <View style={s.rowWrap}>
            {chip("Waste Management", category === "Waste Management", () => setCategory("Waste Management"), "trash")}
            {chip("Road Complaint", category === "Road Complaint", () => setCategory("Road Complaint"), "alert-circle")}
          </View>

          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Backend type:</Text>
            <Text style={s.metaValue}>{typeValue}</Text>
          </View>
        </View>

        {/* Area */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Area / Location</Text>
          <Text style={s.cardHint}>Example: “New Road, Ward 10” or “Near City Hospital”</Text>

          <View style={s.inputWrap}>
            <Ionicons name="location-outline" size={18} color="#9A9A9A" />
            <TextInput
              value={area}
              onChangeText={setArea}
              placeholder="Enter area..."
              placeholderTextColor="#9A9A9A"
              style={s.input}
            />
          </View>
        </View>

        {/* Description */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Description (optional)</Text>
          <Text style={s.cardHint}>
            Give details like landmark, what happened, and any safety risk.
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Write a short description..."
            placeholderTextColor="#9A9A9A"
            multiline
            style={s.textarea}
          />
        </View>

        {/* Priority */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Priority</Text>
          <Text style={s.cardHint}>High = urgent or safety risk</Text>

          <View style={s.rowWrap}>
            {chip("Low", priority === "Low", () => setPriority("Low"), "leaf-outline")}
            {chip("Medium", priority === "Medium", () => setPriority("Medium"), "radio-button-on-outline")}
            {chip("High", priority === "High", () => setPriority("High"), "flame-outline")}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={submit}
          disabled={submitting || !canSubmit}
          style={[s.submitBtn, (submitting || !canSubmit) && { opacity: 0.65 }]}
        >
          {submitting ? (
            <View style={s.submitRow}>
              <ActivityIndicator color="#fff" />
              <Text style={s.submitText}>Submitting...</Text>
            </View>
          ) : (
            <View style={s.submitRow}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={s.submitText}>Send to Municipality</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={s.footerNote}>
          Tip: You can track status later from “My Reports” using your Report Code.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F4F4" },
  page: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  title: { color: "#111", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "#777", fontSize: 12, marginTop: 2 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#FFE2C6",
  },
  badgeText: { marginLeft: 6, fontSize: 12, fontWeight: "800", color: ORANGE },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardTitle: { color: "#111", fontSize: 14, fontWeight: "800" },
  cardHint: { color: "#777", fontSize: 12, marginTop: 6, lineHeight: 16 },

  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  chipIdle: { backgroundColor: "#FFF4E8", borderColor: "#FFE2C6" },
  chipText: { fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: "#fff" },
  chipTextIdle: { color: "#111" },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  metaLabel: { color: "#777", fontSize: 12, marginRight: 8, fontWeight: "700" },
  metaValue: { color: "#111", fontSize: 12, fontWeight: "900" },

  inputWrap: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: { flex: 1, color: "#111", fontSize: 14, fontWeight: "700" },

  textarea: {
    marginTop: 10,
    minHeight: 110,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#111",
    textAlignVertical: "top",
    fontSize: 13,
    fontWeight: "700",
  },

  submitBtn: {
    marginTop: 16,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ORANGE,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "900" },

  footerNote: {
    marginTop: 12,
    color: "#777",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});

// src/screens/CrimeReportScreen.jsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ORANGE = "#FF7A1A";
const BASE_URL = "http://10.0.2.2:5000";

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

export default function CrimeReportScreen({ navigation, route }) {
  // ✅ hooks ALWAYS at top, no conditional returns above them
  const category = route?.params?.category || "Crime";

  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ safe split (no hooks)
  const words = String(category).split(" ");
  const firstWord = words[0] || "Crime";
  const rest = words.slice(1).join(" ");

  const handleBack = () => navigation.goBack();
  const handleHomePress = () => navigation.navigate("Home");

  const getToken = async () => AsyncStorage.getItem("token");

  const onSubmit = async () => {
    try {
      const d = description.trim();
      const a = area.trim();

      if (!d) return Alert.alert("Incomplete", "Please enter a description.");
      if (!a) return Alert.alert("Missing", "Area / Location is required.");

      setSubmitting(true);

      const token = await getToken();
      if (!token) {
        return Alert.alert("Login required", "Token not found. Please login again.");
      }

      const payload = {
        type: category,     // ✅ Domestic Violence / Harassment / Cyber Crime / Theft etc.
        area: a,            // ✅ required
        description: d,
        priority: "Medium",
      };

      const data = await apiCreateReport(token, payload);

      // ✅ DEBUG (look at Metro console)
      console.log("✅ CREATE REPORT RESPONSE:", JSON.stringify(data, null, 2));

      const reportObj =
        data?.report ||
        data?.data?.report ||
        data?.result?.report ||
        data?.payload?.report ||
        null;

      const reportId =
        reportObj?.reportCode ||
        reportObj?.id ||
        data?.reportCode ||
        data?.id ||
        "N/A";

      Alert.alert(
        "Report Submitted ✅",
        `Category: ${category}\nLocation: ${a}\n\nYour Report ID:\n${reportId}\n\nKeep this ID safe to check status later.`,
        [
          {
            text: "OK",
            onPress: () => {
              setDescription("");
              setArea("");
              navigation.goBack();
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert("Error", e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={handleBack}>
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}> {firstWord}</Text>
            {rest ? <Text style={styles.headerDot}> {rest}.</Text> : null}
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <TextInput
          style={styles.descriptionInput}
          placeholder="Enter Description..."
          placeholderTextColor="#B0B0B0"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Area / Location */}
        <View style={styles.locationHeaderRow}>
          <Icon name="map-pin" size={16} color={ORANGE} />
          <Text style={styles.locationLabel}> Area / Location (required)</Text>
        </View>

        <TextInput
          style={styles.locationInput}
          placeholder="e.g. Kathmandu, Baneshwor, near XYZ..."
          placeholderTextColor="#B0B0B0"
          value={area}
          onChangeText={setArea}
        />

        {/* MEDIA ROW */}
        <View style={styles.mediaRow}>
          <TouchableOpacity
            style={styles.mediaCard}
            onPress={() => Alert.alert("Later", "Image upload next step")}
          >
            <Icon name="image" size={20} color="#111" />
            <Text style={styles.mediaLabel}>Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaCard}
            onPress={() => Alert.alert("Later", "Audio upload next step")}
          >
            <Icon name="mic" size={20} color="#111" />
            <Text style={styles.mediaLabel}>Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaCard}
            onPress={() => Alert.alert("Later", "Video upload next step")}
          >
            <Icon name="video" size={20} color="#111" />
            <Text style={styles.mediaLabel}>Video</Text>
          </TouchableOpacity>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.submitButton, submitting && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ActivityIndicator color="#111" />
              <Text style={[styles.submitText, { marginLeft: 10 }]}>Submitting…</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ORANGE SIDE PILL */}
      <View style={styles.sidePill} />

      {/* BOTTOM BAR */}

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
  headerDot: { color: "#111" },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 140 },

  descriptionInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#222",
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  locationHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  locationLabel: { fontSize: 14, fontWeight: "600", color: "#111" },

  locationInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: "#222",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  mediaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  mediaCard: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  mediaLabel: { fontSize: 12, color: "#555", marginTop: 6 },

  submitButton: {
    alignSelf: "center",
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 60,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  submitText: { fontSize: 16, fontWeight: "700", color: "#111" },

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
  },

  bottomBar: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    width: 220,
    elevation: 6,
  },
  tabItem: { paddingHorizontal: 12, paddingVertical: 4 },
});

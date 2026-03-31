// src/screens/WasteReportScreen.jsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to submit report");
  return data;
}

export default function WasteReportScreen({ navigation }) {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getToken = async () => AsyncStorage.getItem("token");
  const handleBack = () => navigation?.goBack?.();
  const handleHomePress = () => navigation.navigate("Home");

  const pickReportCode = (resp) =>
    resp?.reportCode ||
    resp?.code ||
    resp?.data?.reportCode ||
    resp?.report?.reportCode ||
    resp?.report?._id ||
    resp?._id ||
    null;

  const resetForm = () => {
    setDescription("");
    setLocation("");
  };

  const onSubmit = async () => {
    try {
      const d = description.trim();
      const l = location.trim();
      if (!d) return Alert.alert("Missing", "Please enter description.");
      if (!l) return Alert.alert("Missing", "Please add location / area.");

      setSubmitting(true);

      const token = await getToken();
      if (!token) {
        setSubmitting(false);
        return Alert.alert("Login required", "Token not found. Please login again.");
      }

      const payload = {
        type: "Waste", // ✅ important so we can filter later
        area: l,
        description: d,
        priority: "Medium",
      };

      const resp = await apiCreateReport(token, payload);
      const reportCode = pickReportCode(resp) || "N/A";

      Alert.alert(
        "Submitted ✅",
        `Waste report sent successfully.\n\nReport Code: ${reportCode}`,
        [
          {
            text: "Check Status",
            onPress: () => {
              resetForm();
              navigation.navigate("WasteReportStatus", { reportCode });
            },
          },
          {
            text: "OK",
            style: "cancel",
            onPress: () => {
              resetForm();
              handleBack();
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
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Waste</Text>
            <Text style={styles.titleNormal}>Report.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Describe the waste issue..."
          placeholderTextColor="#9A9A9A"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.locationLabel}>Add Location</Text>
        <TextInput
          style={styles.locationBox}
          placeholder="Type address / landmark..."
          placeholderTextColor="#9A9A9A"
          multiline
          value={location}
          onChangeText={setLocation}
        />

        <View style={styles.mediaRow}>
          <MediaButton label="Image" onPress={() => Alert.alert("Later", "Image upload next step")} />
          <MediaButton label="Audio" onPress={() => Alert.alert("Later", "Audio upload next step")} />
          <MediaButton label="Video" onPress={() => Alert.alert("Later", "Video upload next step")} />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onSubmit}
          disabled={submitting}
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
        >
          {submitting ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submitTxt}>Submitting…</Text>
            </View>
          ) : (
            <Text style={styles.submitTxt}>Submit Report</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          You’ll receive a Report Code after submission to track your waste report status.
        </Text>
      </View>

      <View style={styles.sidePill} />


    </SafeAreaView>
  );
}

function MediaButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.mediaButton} onPress={onPress} activeOpacity={0.9}>
      <Text style={styles.mediaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F4" },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  titleHighlight: { color: ORANGE },
  titleNormal: { color: "#111" },

  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },

  descriptionInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginBottom: 26,
    minHeight: 120,
    textAlignVertical: "top",
  },

  locationLabel: { fontSize: 15, fontWeight: "600", color: "#111", marginBottom: 10 },

  locationBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
    minHeight: 140,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginBottom: 28,
  },

  mediaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  mediaButton: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  mediaLabel: { fontSize: 13, fontWeight: "600", color: "#111" },

  submitBtn: {
    marginTop: 6,
    backgroundColor: ORANGE,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },

  hint: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
    paddingHorizontal: 10,
  },

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

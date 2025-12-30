// src/screens/ReportStatusScreen.jsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

const ORANGE = "#FF7A1A";

const ReportStatusScreen = ({ navigation }) => {
  const [reportId, setReportId] = useState("");

  const handleBack = () => navigation.goBack();
  const handleHomePress = () => navigation.navigate("Home");

  const handleCheckStatus = () => {
    if (!reportId.trim()) {
      Alert.alert("Missing ID", "Please enter your report ID.");
      return;
    }
    Alert.alert(
      "Status",
      `Status for report ${reportId}:\n\n• Received\n• Under review by authorities\n• You will be contacted if more info is needed.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={handleBack}>
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}> Report</Text>
            <Text style={styles.headerDot}> Status.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Text style={styles.title}>Check your report status</Text>
        <Text style={styles.subtitle}>
          Enter the report ID you received after submitting your case.
        </Text>

        <Text style={styles.label}>Report ID</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. AT-2025-00123"
          placeholderTextColor="#B0B0B0"
          value={reportId}
          onChangeText={setReportId}
        />

        <TouchableOpacity
          style={styles.checkButton}
          onPress={handleCheckStatus}
        >
          <Text style={styles.checkButtonText}>Check Status</Text>
        </TouchableOpacity>

        <View style={styles.tipBox}>
          <Icon name="info" size={16} color={ORANGE} />
          <Text style={styles.tipText}>
            Keep your report ID safe. You’ll need it to follow up or provide
            more information later.
          </Text>
        </View>
      </View>

      {/* ORANGE SIDE PILL */}
      <View style={styles.sidePill} />

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="settings" size={20} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={handleHomePress}>
          <Icon name="home" size={22} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="user" size={20} color="#111" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ReportStatusScreen;

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

  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 140,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#222",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  checkButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  checkButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tipText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 8,
    flex: 1,
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
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: -2, height: 2 },
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
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tabItem: { paddingHorizontal: 12, paddingVertical: 4 },
});

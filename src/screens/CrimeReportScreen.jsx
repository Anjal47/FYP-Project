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
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

const ORANGE = "#FF7A1A";

const CrimeReportScreen = ({ navigation, route }) => {
  const category = route.params?.category || "Crime";

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const handleBack = () => navigation.goBack();

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert("Incomplete", "Please enter a description.");
      return;
    }
    Alert.alert(
      "Report Submitted",
      `Category: ${category}\nLocation: ${location || "Not provided"}`,
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  const handleHomePress = () => navigation.navigate("Home");

  // Split category to color first word like "Domestic" in orange, rest black
  const [firstWord, ...restWords] = category.split(" ");
  const rest = restWords.join(" ");

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

        {/* Location */}
        <View style={styles.locationHeaderRow}>
          <Icon name="map-pin" size={16} color={ORANGE} />
          <Text style={styles.locationLabel}> Add Location</Text>
        </View>

        <TouchableOpacity
          style={styles.locationBox}
          onPress={() =>
            Alert.alert("Location", "Later you can connect GPS / map picker.")
          }
        >
          <Text style={styles.locationPlaceholder}>
            Tap to add location (optional)
          </Text>
        </TouchableOpacity>

        {/* MEDIA ROW */}
        <View style={styles.mediaRow}>
          <TouchableOpacity style={styles.mediaCard}>
            <Icon name="image" size={20} color="#111" />
            <Text style={styles.mediaLabel}>Image</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaCard}>
            <Icon name="mic" size={20} color="#111" />
            <Text style={styles.mediaLabel}>Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaCard}>
            <Icon name="video" size={20} color="#111" />
            <Text style={styles.mediaLabel}>Video</Text>
          </TouchableOpacity>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>

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

export default CrimeReportScreen;

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
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 140,
  },

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

  locationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  locationBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  locationPlaceholder: {
    fontSize: 13,
    color: "#999",
  },

  mediaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
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
  mediaLabel: {
    fontSize: 12,
    color: "#555",
    marginTop: 6,
  },

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

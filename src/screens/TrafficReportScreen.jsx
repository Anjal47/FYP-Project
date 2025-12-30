import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

const TrafficReportScreen = ({ navigation }) => {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation?.goBack?.()}
        >
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Traffic</Text>
            <Text style={styles.titleNormal}>Violence.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        {/* Description box */}
        <TextInput
          style={styles.descriptionInput}
          placeholder="Enter Description..."
          placeholderTextColor="#9A9A9A"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Location label + box */}
        <Text style={styles.locationLabel}>Add Location</Text>
        <TextInput
          style={styles.locationBox}
          placeholder="Type address / landmark..."
          placeholderTextColor="#9A9A9A"
          multiline
          value={location}
          onChangeText={setLocation}
        />

        {/* Media options */}
        <View style={styles.mediaRow}>
          <MediaButton label="Image" onPress={() => {}} />
          <MediaButton label="Audio" onPress={() => {}} />
          <MediaButton label="Video" onPress={() => {}} />
        </View>
      </View>

      {/* ORANGE SIDE PILL */}
      <View style={styles.sidePill} />

      {/* BOTTOM TABS */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="settings" size={20} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="home" size={22} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="user" size={20} color="#111" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const MediaButton = ({ label, onPress }) => (
  <TouchableOpacity style={styles.mediaButton} onPress={onPress}>
    <Text style={styles.mediaLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  titleHighlight: {
    color: "#FF7A1A",
  },
  titleNormal: {
    color: "#111",
  },

  /* BODY LAYOUT */
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

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
    marginBottom: 26, // more gap before "Add Location"
  },

  locationLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 10, // small gap above the big box
  },

  locationBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
    minHeight: 140, // bigger like the mockup
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginBottom: 28, // good breathing room before media row
  },

  mediaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  mediaButton: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14, // slightly taller, feels less cramped
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  mediaLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },

  sidePill: {
    position: "absolute",
    right: 0,
    bottom: 110,
    width: 56,
    height: 110,
    backgroundColor: "#FF7A1A",
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
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});

export default TrafficReportScreen;

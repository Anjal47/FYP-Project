// src/screens/SettingsScreen.jsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState("English");
  const [isDark, setIsDark] = useState(false); // local only – does not change whole app yet

  const handleLanguagePress = () => {
    Alert.alert(
      "Choose Language",
      "",
      [
        {
          text: "English",
          onPress: () => setLanguage("English"),
        },
        {
          text: "नेपाली (Nepali)",
          onPress: () => setLanguage("Nepali"),
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handlePolicy = () => {
    Alert.alert(
      "Policy",
      "• Your information is kept confidential.\n" +
        "• Emergency contacts are used only during alerts.\n" +
        "• Reports are encrypted and stored securely.\n" +
        "• You can request your data to be deleted at any time."
    );
  };

  const handleLogout = () => {
    Alert.alert("Log out", "You will be logged out from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: () => navigation.replace("Welcome"),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.headerTitle}> Settings</Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications */}
        <SettingsItem
          title="Notifications"
          subtitle={notificationsEnabled ? "Enabled" : "Disabled"}
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#DDD", true: "#FFB278" }}
              thumbColor={notificationsEnabled ? "#FF7A1A" : "#FFFFFF"}
            />
          }
        />

        {/* Language */}
        <SettingsItem
          title="Language"
          subtitle={language}
          onPress={handleLanguagePress}
          rightComponent={<Icon name="chevron-right" size={18} color="#555" />}
        />

        {/* Theme (Dark / Light) – local toggle only */}
        <SettingsItem
          title="Theme"
          subtitle={isDark ? "Dark mode" : "Light mode"}
          rightComponent={
            <Switch
              value={isDark}
              onValueChange={setIsDark}
              trackColor={{ false: "#DDD", true: "#FFB278" }}
              thumbColor={isDark ? "#FF7A1A" : "#FFFFFF"}
            />
          }
        />

        {/* Set Location (kept simple) */}
        <SettingsItem
          title="Set Location"
          subtitle="Use device location for nearby help"
          onPress={() =>
            Alert.alert(
              "Set Location",
              "Location settings coming soon.\nYou can later allow GPS to find nearby support."
            )
          }
          rightComponent={<Icon name="chevron-right" size={18} color="#555" />}
        />

        {/* Policy */}
        <SettingsItem
          title="Policy"
          subtitle="Read AngelTouch safety & privacy rules"
          onPress={handlePolicy}
          rightComponent={<Icon name="chevron-right" size={18} color="#555" />}
        />

        {/* Log Out button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ORANGE SIDE PILL */}
      <View style={styles.sidePill} />
    </SafeAreaView>
  );
};

const SettingsItem = ({ title, subtitle, onPress, rightComponent }) => (
  <TouchableOpacity
    style={styles.item}
    activeOpacity={onPress ? 0.7 : 1}
    onPress={onPress}
  >
    <View>
      <Text style={styles.itemTitle}>{title}</Text>
      {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
    </View>
    <View>{rightComponent}</View>
  </TouchableOpacity>
);

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF7A1A",
    marginLeft: 8,
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 140,
  },
  item: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  itemTitle: {
    fontSize: 16,
    color: "#111",
    fontWeight: "600",
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 24,
    alignSelf: "center",
    backgroundColor: "#FF7A1A",
    paddingHorizontal: 60,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
});

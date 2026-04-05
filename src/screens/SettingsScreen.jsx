import React, { useMemo, useState } from "react";
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
import { useAppTheme } from "../context/ThemeContext";

export default function SettingsScreen({ navigation }) {
  const { isDark, setThemeMode, theme } = useAppTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState("English");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.background,
        },
        header: {
          backgroundColor: theme.surface,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.border,
        },
        backRow: {
          flexDirection: "row",
          alignItems: "center",
        },
        headerTitle: {
          fontSize: 20,
          fontWeight: "700",
          color: theme.accent,
          marginLeft: 8,
        },
        body: {
          flex: 1,
        },
        content: {
          paddingHorizontal: 24,
          paddingTop: 18,
          paddingBottom: 60,
        },
        item: {
          backgroundColor: theme.surface,
          borderRadius: 18,
          paddingHorizontal: 18,
          paddingVertical: 14,
          marginBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.16 : 0.08,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        },
        itemTitle: {
          fontSize: 16,
          color: theme.text,
          fontWeight: "600",
        },
        itemSubtitle: {
          fontSize: 12,
          color: theme.muted,
          marginTop: 2,
        },
        logoutButton: {
          marginTop: 24,
          alignSelf: "center",
          backgroundColor: theme.accent,
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
      }),
    [theme, isDark]
  );

  const handleLanguagePress = () => {
    Alert.alert(
      "Choose Language",
      "",
      [
        { text: "English", onPress: () => setLanguage("English") },
        { text: "Nepali", onPress: () => setLanguage("Nepali") },
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color={theme.text} />
          <Text style={styles.headerTitle}> Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsItem
          styles={styles}
          title="Notifications"
          subtitle={notificationsEnabled ? "Enabled" : "Disabled"}
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#DDD", true: "#FFB278" }}
              thumbColor={notificationsEnabled ? theme.accent : "#FFFFFF"}
            />
          }
        />

        <SettingsItem
          styles={styles}
          title="Language"
          subtitle={language}
          onPress={handleLanguagePress}
          rightComponent={<Icon name="chevron-right" size={18} color={theme.muted} />}
        />

        <SettingsItem
          styles={styles}
          title="Theme"
          subtitle={isDark ? "Dark mode" : "Light mode"}
          rightComponent={
            <Switch
              value={isDark}
              onValueChange={(value) => setThemeMode(value ? "dark" : "light")}
              trackColor={{ false: "#DDD", true: "#FFB278" }}
              thumbColor={isDark ? theme.accent : "#FFFFFF"}
            />
          }
        />

        <SettingsItem
          styles={styles}
          title="Set Location"
          subtitle="Use device location for nearby help"
          onPress={() =>
            Alert.alert(
              "Set Location",
              "Location settings coming soon.\nYou can later allow GPS to find nearby support."
            )
          }
          rightComponent={<Icon name="chevron-right" size={18} color={theme.muted} />}
        />

        <SettingsItem
          styles={styles}
          title="Emergency Contact"
          subtitle="Add or update your personal SOS number"
          onPress={() => navigation.navigate("EmergencyContact")}
          rightComponent={<Icon name="chevron-right" size={18} color={theme.muted} />}
        />

        <SettingsItem
          styles={styles}
          title="Policy"
          subtitle="Read AngelTouch safety & privacy rules"
          onPress={handlePolicy}
          rightComponent={<Icon name="chevron-right" size={18} color={theme.muted} />}
        />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsItem({ title, subtitle, onPress, rightComponent, styles }) {
  return (
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
}

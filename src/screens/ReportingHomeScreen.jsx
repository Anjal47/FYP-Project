// src/screens/ReportingHomeScreen.jsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

const ORANGE = "#FF7A1A";

const REPORT_CARDS = [
  { id: "dv", label: "Domestic Violence", icon: "users" },
  { id: "harassment", label: "Harassment", icon: "alert-triangle" },
  { id: "cyber", label: "Cyber Crime", icon: "cpu" },
  { id: "kidnapping", label: "Kidnapping", icon: "user-x" },
  { id: "theft", label: "Theft", icon: "briefcase" },
  { id: "missing", label: "Missing Person", icon: "search" },
  { id: "weapon", label: "Weapon Violence", icon: "target" },
  { id: "my_reports", label: "My Reports", icon: "file-text" },
  { id: "status", label: "Report Status", icon: "help-circle" }, // 👈 "Other" -> Report Status
];

const ReportingHomeScreen = ({ navigation }) => {
  const handleBack = () => navigation.goBack();

  const handleCardPress = (card) => {
    if (card.id === "status") {
      navigation.navigate("ReportStatus");
    } else if (card.id === "my_reports") {
      // later you can make a separate MyReports screen
      navigation.navigate("ReportStatus"); // or "MyReports"
    } else {
      navigation.navigate("CrimeReport", { category: card.label });
    }
  };

  const handleHomePress = () => navigation.navigate("Home");

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={handleBack}>
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}> Reporting</Text>
            <Text style={styles.headerDot}>Crime.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsGrid}>
          {REPORT_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.card}
              onPress={() => handleCardPress(card)}
            >
              <View style={styles.cardIconWrapper}>
                <Icon name={card.icon} size={22} color="#111" />
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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

export default ReportingHomeScreen;

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

  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    alignItems: "flex-start",
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardLabel: {
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

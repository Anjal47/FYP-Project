// src/screens/HomeScreen.jsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

const HomeScreen = ({ navigation }) => {
  const handleSOSPress = () => {
    console.log("SOS tapped");
  };

  const handleSettingsPress = () => {
    console.log("Settings pressed");
  };

  const handleProfilePress = () => {
    console.log("Profile pressed");
  };

  const handleHomePress = () => {
    console.log("Home pressed");
  };

  const goToCounseling = () => {
    navigation.navigate("Counseling");
  };

  const goToReporting = () => {
    console.log("Reporting card pressed");
  };

  const goToTraffic = () => {
    console.log("Traffic card pressed");
  };

  const goToSupport = () => {
    console.log("Support card pressed");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER CARD */}
      <View style={styles.headerCard}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>
            <Text style={styles.brandMain}>Angel</Text>
            <Text style={styles.brandAccent}>Touch.</Text>
          </Text>
        </View>

        <Text style={styles.tagline}>You are not alone.</Text>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Safe Space</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>24/7 Support</Text>
          </View>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        {/* 🔸 CARDS GRID – heading "Quick Actions" removed */}
        <View style={styles.cardsGrid}>
          <TouchableOpacity style={styles.card} onPress={goToReporting}>
            <View style={styles.cardIconWrapper}>
              <Icon name="file-text" size={20} color="#FF7A1A" />
            </View>
            <Text style={styles.cardTitle}>Reporting</Text>
            <Text style={styles.cardSubtitle}>
              File a report quickly & safely.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={goToCounseling}>
            <View style={styles.cardIconWrapper}>
              <Icon name="message-circle" size={20} color="#FF7A1A" />
            </View>
            <Text style={styles.cardTitle}>Counseling & Therapy</Text>
            <Text style={styles.cardSubtitle}>Talk to a professional.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={goToTraffic}>
            <View style={styles.cardIconWrapper}>
              <Icon name="map-pin" size={20} color="#FF7A1A" />
            </View>
            <Text style={styles.cardTitle}>Traffic</Text>
            <Text style={styles.cardSubtitle}>
              Safe route & traffic alerts.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={goToSupport}>
            <View style={styles.cardIconWrapper}>
              <Icon name="help-circle" size={20} color="#FF7A1A" />
            </View>
            <Text style={styles.cardTitle}>Support</Text>
            <Text style={styles.cardSubtitle}>Get help & resources.</Text>
          </TouchableOpacity>
        </View>

        {/* SOS concentric circles */}
        <View style={styles.sosWrapper}>
          <View style={styles.sosOuterCircle}>
            <View style={styles.sosMiddleCircle}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.sosInnerCircle}
                onPress={handleSOSPress}
              >
                <Icon name="alert-triangle" size={32} color="#FFFFFF" />
                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosHint}>Tap & hold for 3 seconds</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ORANGE SIDE PILL */}
      <View style={styles.sidePill} />

      {/* BOTTOM NAV BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem} onPress={handleSettingsPress}>
          <Icon name="settings" size={20} color="#9A9A9A" />
          <Text style={styles.tabLabel}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={handleHomePress}>
          <View style={styles.homeIconWrapper}>
            <Icon name="home" size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={handleProfilePress}>
          <Icon name="user" size={20} color="#9A9A9A" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },

  /* HEADER */
  headerCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  brand: {
    fontSize: 26,
    fontWeight: "700",
  },
  brandMain: {
    color: "#111",
  },
  brandAccent: {
    color: "#FF7A1A",
  },
  tagline: {
    fontSize: 14,
    color: "#666",
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    backgroundColor: "#FFEBDD",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  chipText: {
    fontSize: 12,
    color: "#FF7A1A",
    fontWeight: "600",
  },

  /* BODY */
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
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
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#777",
  },

  sosWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  sosOuterCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#FFE3C4",
    alignItems: "center",
    justifyContent: "center",
  },
  sosMiddleCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FF9B3B",
    alignItems: "center",
    justifyContent: "center",
  },
  sosInnerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FF7A1A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  sosText: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sosHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#FFEBD2",
    textAlign: "center",
  },

  sidePill: {
    position: "absolute",
    right: 0,
    top: "55%",
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
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  homeIconWrapper: {
    backgroundColor: "#FF7A1A",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: "#9A9A9A",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#FF7A1A",
    fontWeight: "600",
  },
});

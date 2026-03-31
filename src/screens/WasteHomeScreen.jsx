// src/screens/WasteHomeScreen.jsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Feather";

const ORANGE = "#FF7A1A";

const WasteHomeScreen = ({ navigation }) => {
  const handleHomePress = () => navigation.navigate("Home");

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation?.goBack?.()}>
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Waste</Text>
            <Text style={styles.titleNormal}>.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Text style={styles.subtitle}>Keep your city clean & safe.</Text>

        <View style={styles.cardsGrid}>
          <WasteCard
            icon="trash-2"
            title="Report Waste Issue"
            subtitle="Garbage, dumping, overflow."
            onPress={() => navigation.navigate("WasteReport")}
          />

          <WasteCard
            icon="info"
            title="Waste Guidelines"
            subtitle="How to dispose correctly."
            onPress={() => navigation.navigate("WasteGuidelines")}
          />

          <WasteCard
            icon="credit-card"
            title="Pay Penalty"
            subtitle="Clear municipal penalties."
            onPress={() => console.log("Pay Penalty")}
          />

          <WasteCard
            icon="file-text"
            title="Reporting"
            subtitle="Track your submissions."
            onPress={() => navigation.navigate("WasteReportStatus")}
          />
        </View>
      </View>

      {/* ORANGE SIDE PILL */}
      <View style={styles.sidePill} />

      {/* BOTTOM TABS */}
   
    </SafeAreaView>
  );
};

const WasteCard = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.cardIconWrap}>
      <Icon name={icon} size={20} color="#111" />
    </View>

    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>

    <View style={styles.cardArrow}>
      <Icon name="arrow-right" size={16} color={ORANGE} />
    </View>
  </TouchableOpacity>
);

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
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 28,
  },

  cardsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  card: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    overflow: "hidden",
  },

  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  cardTitle: { fontSize: 14, fontWeight: "800", color: "#111", marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: "#777", lineHeight: 16, paddingRight: 10 },

  cardArrow: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
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

export default WasteHomeScreen;

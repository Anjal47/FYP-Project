// src/screens/TrafficHomeScreen.jsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

const TrafficHomeScreen = ({ navigation }) => {
  const handleHomePress = () => navigation.navigate("Home");

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
            <Text style={styles.titleNormal}>.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Text style={styles.subtitle}>Stay safe on the road.</Text>

        <View style={styles.cardsGrid}>
          <TrafficCard
            title="Report a Violation"
            subtitle="Report unsafe driving or incidents."
            onPress={() => navigation.navigate("TrafficReport")}
          />

          <TrafficCard
            title="View Traffic Rules"
            subtitle="Know your rights and duties."
            onPress={() => navigation.navigate("TrafficRules")}
          />

          <TrafficCard
            title="Pay Fine"
            subtitle="Manage and clear penalties."
            onPress={() => console.log("Pay Fine")}
          />

          <TrafficCard
            title="Reporting"
            subtitle="See your previous submissions."
            onPress={() => console.log("Reporting")}
          />
        </View>
      </View>

      {/* ORANGE SIDE PILL */}
      <View style={styles.sidePill} />

      {/* BOTTOM TABS */}
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

const TrafficCard = ({ title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardIconPlaceholder} />
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
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
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 28,
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
    marginBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardIconPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF4E8",
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

export default TrafficHomeScreen;

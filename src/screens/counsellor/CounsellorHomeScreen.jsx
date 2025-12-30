// src/screens/counsellor/CounsellorHomeScreen.jsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";

const ORANGE = "#FF7A1A";
const BG = "#F4F4F4";

export default function CounsellorHomeScreen({ navigation }) {
  const goSettings = () => navigation.navigate("Settings");

  const goClients = () => navigation.navigate("CounsellorClients");
  const goAppointments = () => navigation.navigate("CounsellorAppointments"); // create later
  const goReports = () => navigation.navigate("CounsellorReports"); // create later
  const goProfile = () => navigation.navigate("CounsellorProfile"); // create later

  const goStats = () => console.log("Stats tapped (later)");
  const goHome = () => navigation.navigate("CounsellorHome");
  const goAddClient = () => console.log("Add client tapped (later)");

  return (
    <SafeAreaView style={s.container}>
      {/* Header Card */}
      <View style={s.headerCard}>
        <View style={s.brandRow}>
          <Text style={s.brand}>
            <Text style={s.brandMain}>Angel</Text>
            <Text style={s.brandAccent}>Touch.</Text>
          </Text>

          <TouchableOpacity activeOpacity={0.85} style={s.settingsBtn} onPress={goSettings}>
            <Feather name="settings" size={22} color="#111" />
          </TouchableOpacity>
        </View>

        <Text style={s.tagline}>Counsellor dashboard</Text>

        {/* mini “search-like” pill (optional, looks pro) */}
        <TouchableOpacity activeOpacity={0.85} style={s.searchBar} onPress={() => console.log("Search later")}>
          <Feather name="search" size={16} color="#9A9A9A" />
          <Text style={s.searchPlaceholder}>Search clients, sessions...</Text>
          <View style={s.searchRightIconWrap}>
            <Feather name="chevron-right" size={18} color="#B5B5B5" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <View style={s.cardsGrid}>
          <TouchableOpacity activeOpacity={0.9} style={s.card} onPress={goClients}>
            <View style={s.cardIconWrapper}>
              <Ionicons name="people" size={20} color={ORANGE} />
            </View>
            <Text style={s.cardTitle}>My Clients</Text>
            <Text style={s.cardSubtitle}>Manage & view client info.</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} style={s.card} onPress={goAppointments}>
            <View style={s.cardIconWrapper}>
              <Ionicons name="calendar-outline" size={20} color={ORANGE} />
            </View>
            <Text style={s.cardTitle}>Appointments</Text>
            <Text style={s.cardSubtitle}>Upcoming sessions & schedule.</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} style={s.card} onPress={goReports}>
            <View style={s.cardIconWrapper}>
              <Ionicons name="document-text-outline" size={20} color={ORANGE} />
            </View>
            <Text style={s.cardTitle}>Report / Data</Text>
            <Text style={s.cardSubtitle}>Notes, progress & summaries.</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} style={s.card} onPress={goProfile}>
            <View style={s.cardIconWrapper}>
              <Ionicons name="person-circle-outline" size={22} color={ORANGE} />
            </View>
            <Text style={s.cardTitle}>My Profile</Text>
            <Text style={s.cardSubtitle}>Edit profile & availability.</Text>
          </TouchableOpacity>
        </View>

        {/* spacing so nothing hides behind bottom bar */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Side Orange Pill */}
      <View style={s.sidePill} />

      {/* Bottom Nav (same vibe as your reference) */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.tabItem} onPress={goStats} activeOpacity={0.85}>
          <Ionicons name="stats-chart-outline" size={22} color="#9A9A9A" />
          <Text style={s.tabLabel}>Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.tabItem} onPress={goHome} activeOpacity={0.85}>
          <View style={s.homeIconWrapper}>
            <Ionicons name="home" size={22} color="#FFFFFF" />
          </View>
          <Text style={[s.tabLabel, s.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.tabItem} onPress={goAddClient} activeOpacity={0.85}>
          <Ionicons name="person-add-outline" size={22} color="#9A9A9A" />
          <Text style={s.tabLabel}>Add</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...shadow,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  brand: { fontSize: 26, fontWeight: "900" },
  brandMain: { color: "#111" },
  brandAccent: { color: ORANGE },

  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  tagline: { fontSize: 14, color: "#666", marginBottom: 14, fontWeight: "700" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E3E3E3",
  },

  searchPlaceholder: { fontSize: 13, color: "#9A9A9A", flex: 1, fontWeight: "700" },

  searchRightIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  scrollContent: { paddingHorizontal: 24, paddingTop: 18 },

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

  cardTitle: { fontSize: 14, fontWeight: "900", color: "#111", marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: "#777", fontWeight: "700" },

  sidePill: {
    position: "absolute",
    right: 0,
    top: "55%",
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

  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },

  homeIconWrapper: {
    backgroundColor: ORANGE,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  tabLabel: { fontSize: 11, color: "#9A9A9A", marginTop: 2, fontWeight: "700" },
  tabLabelActive: { color: ORANGE, fontWeight: "900" },
});

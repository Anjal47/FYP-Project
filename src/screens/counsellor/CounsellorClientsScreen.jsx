// src/screens/counsellor/CounsellorClientsScreen.jsx
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

const ORANGE = "#FF7A1A";
const BG = "#F4F4F4";

const { width: SCREEN_W } = Dimensions.get("window");

export default function CounsellorClientsScreen({ navigation }) {
  const [search, setSearch] = useState("");

  const clients = useMemo(
    () => [
      {
        id: "c1",
        name: "Anjal Basnet",
        email: "anjalbasnet77@gmail.com",
        phone: "+977 9841234567",
        desc: "Quick Description...",
      },
      {
        id: "c2",
        name: "Sujan Chaulagain",
        email: "sujanchaulagain@gmail.com",
        phone: "+977 9800000000",
        desc: "Quick Description...",
      },
      {
        id: "c3",
        name: "Ritwiz Acharya",
        email: "ritwizacharya@gmail.com",
        phone: "+977 9811111111",
        desc: "Quick Description...",
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    });
  }, [clients, search]);

  const goBack = () => navigation.goBack();

  const goHome = () => navigation.navigate("CounsellorHome");
  const goAdd = () => console.log("Add client tapped (later)");
  const goStats = () => console.log("Stats tapped (later)");

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.headerCard}>
        <View style={s.headerRow}>
          <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={goBack}>
            <Feather name="arrow-left" size={22} color="#111" />
          </TouchableOpacity>

          <Text style={s.title}>
            <Text style={s.titleAccent}>My</Text>
            <Text style={s.titleMain}>Clients.</Text>
          </Text>

          <View style={{ width: 42 }} />
        </View>

        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Feather name="search" size={16} color="#9A9A9A" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search clients..."
              placeholderTextColor="#9A9A9A"
              style={s.searchInput}
            />
            {!!search && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSearch("")}
                style={s.clearBtn}
              >
                <Feather name="x" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Horizontal scroll cards */}
      <View style={s.bodyWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.hScrollContent}
          snapToInterval={SCREEN_W * 0.78 + 18}
          decelerationRate="fast"
        >
          {filtered.map((c) => (
            <View key={c.id} style={s.card}>
              <View style={s.avatar} />

              <Text style={s.name}>{c.name}</Text>

              <View style={s.rowLine}>
                <Feather name="mail" size={14} color={ORANGE} />
                <Text style={s.rowText}>{c.email}</Text>
              </View>

              <View style={s.rowLine}>
                <Feather name="phone" size={14} color={ORANGE} />
                <Text style={s.rowText}>{c.phone}</Text>
              </View>

              <View style={s.descBox}>
                <Text style={s.descText}>{c.desc}</Text>
              </View>
            </View>
          ))}

          {/* If no results */}
          {filtered.length === 0 && (
            <View style={[s.card, { justifyContent: "center" }]}>
              <Text style={s.emptyTitle}>No clients found</Text>
              <Text style={s.emptySub}>Try a different search.</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Side orange pill */}
      <View style={s.sidePill} />

      {/* Bottom pill nav */}
      <View style={s.bottomWrap}>
        <View style={s.bottomPill}>
          <TouchableOpacity activeOpacity={0.85} style={s.pillBtn} onPress={goStats}>
            <Feather name="bar-chart-2" size={22} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={[s.pillBtn, s.pillBtnActive]} onPress={goHome}>
            <Feather name="home" size={22} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={s.pillBtn} onPress={goAdd}>
            <Feather name="user-plus" size={22} color="#111" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 5,
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...shadow,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  title: { fontSize: 24, fontWeight: "900" },
  titleAccent: { color: ORANGE, fontWeight: "900" },
  titleMain: { color: "#111", fontWeight: "900" },

  searchRow: { flexDirection: "row" },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F2F2F2",
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111",
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  bodyWrap: {
    flex: 1,
    paddingTop: 22,
  },

  hScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 140,
  },

  card: {
    width: SCREEN_W * 0.78,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginRight: 18,
    alignItems: "center",
    ...shadow,
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#D9D9D9",
    marginBottom: 16,
  },

  name: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    marginBottom: 10,
  },

  rowLine: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },

  rowText: {
    fontSize: 13,
    color: ORANGE,
    fontWeight: "800",
  },

  descBox: {
    width: "100%",
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDEDED",
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...shadow,
  },

  descText: {
    fontSize: 13,
    color: "#777",
    fontWeight: "700",
  },

  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#111", marginBottom: 6 },
  emptySub: { fontSize: 13, color: "#777", fontWeight: "700" },

  sidePill: {
    position: "absolute",
    right: 0,
    top: "58%",
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

  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
  },

  bottomPill: {
    width: "78%",
    height: 58,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    ...shadow,
  },

  pillBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  pillBtnActive: {
    backgroundColor: "#F2F2F2",
  },
});

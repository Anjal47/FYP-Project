// src/screens/CounselorsScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";

const BASE_URL = "http://10.0.2.2:5000";

async function apiGetCounsellors(token) {
  const res = await fetch(`${BASE_URL}/api/counseling/counsellors`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load counsellors");
  return data;
}

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const CounselorsScreen = ({ navigation, route }) => {
  const requestId = route?.params?.requestId || null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counsellors, setCounsellors] = useState([]);

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const data = await apiGetCounsellors(token);
      setCounsellors(Array.isArray(data?.counsellors) ? data.counsellors : []);
    } catch (e) {
      Alert.alert("Error", e?.message || "Unable to load counsellors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // keep your “3 rows” vibe using backend list
  const list = useMemo(() => counsellors, [counsellors]);
  const rows = useMemo(() => chunk(list, 7), [list]); // horizontal rows

  const handleCardPress = (c) => {
    // For now just show details (later you can “Select counsellor” and attach to requestId)
    Alert.alert(
      "Counsellor",
      `${c.fullName}\n\n${c.workingArea || "—"}\n${c.qualification || "—"}\n${c.phone || "—"}\n\nRequestId: ${requestId || "—"}`,
      [{ text: "OK" }]
    );
  };

  const handleHomePress = () => navigation.navigate("Home");

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Choose</Text>
            <Text style={styles.titleNormal}>Counselor.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#FF7A1A" />
            <Text style={{ marginTop: 10, color: "#666", fontWeight: "700" }}>Loading counsellors...</Text>
          </View>
        ) : counsellors.length === 0 ? (
          <Text style={{ color: "#666", fontWeight: "700" }}>
            No counsellors available right now. (Ask admin to create staff)
          </Text>
        ) : (
          <>
            {rows.map((row, idx) => (
              <View key={`row-${idx}`} style={{ marginBottom: idx === 0 ? 0 : 26 }}>
                <Text style={styles.sectionTitle}>
                  <Text style={styles.sectionHighlight}>
                    {idx === 0 ? "Currently" : idx === 1 ? "Best" : "Other"}
                  </Text>
                  <Text style={styles.sectionNormal}>
                    {idx === 0 ? "Available." : idx === 1 ? "Fit." : "Counselor."}
                  </Text>
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rowScrollContent}
                >
                  {row.map((c) => (
                    <CounselorCard
                      key={c._id}
                      name={c.fullName}
                      sub={c.workingArea || "Available"}
                      onPress={() => handleCardPress(c)}
                    />
                  ))}
                </ScrollView>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* ORANGE SIDE PILL */}
      <View style={styles.sidePill} />

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Settings")}>
          <Icon name="settings" size={20} color="#111" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={handleHomePress}>
          <Icon name="home" size={22} color="#111" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate("Profile")}>
          <Icon name="user" size={20} color="#111" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const CounselorCard = ({ name, sub, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.avatar} />
    <Text style={styles.cardName} numberOfLines={2}>{name}</Text>
    <Text style={styles.cardSub} numberOfLines={1}>{sub}</Text>
  </TouchableOpacity>
);

export default CounselorsScreen;

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
  title: { fontSize: 20, fontWeight: "700" },
  titleHighlight: { color: "#FF7A1A" },
  titleNormal: { color: "#111" },

  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 140,
  },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  sectionHighlight: { color: "#FF7A1A" },
  sectionNormal: { color: "#111" },

  rowScrollContent: { paddingBottom: 4, paddingRight: 10 },

  card: {
    width: 130,
    height: 140,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E0E0E0",
    marginBottom: 8,
  },
  cardName: { fontSize: 12, color: "#222", textAlign: "center", fontWeight: "800" },
  cardSub: { marginTop: 4, fontSize: 11, color: "#666", textAlign: "center" },

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
  tabItem: { paddingHorizontal: 12, paddingVertical: 4 },
});

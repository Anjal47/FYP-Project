// src/screens/CounselorsScreen.jsx
import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

// Pool of Nepali counselor names
const counselorNames = [
  "Dr. Anisha Sharma",
  "Dr. Prakash Basnet",
  "Dr. Saurav Karki",
  "Dr. Nisha Thapa",
  "Dr. Bikash Shrestha",
  "Dr. Sita Gurung",
  "Dr. Milan Adhikari",
  "Dr. Rupa Magar",
  "Dr. Binod Bhandari",
  "Dr. Kabita Tamang",
  "Dr. Roshan Khadka",
  "Dr. Smriti Oli",
];

// simple shuffle
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const useRandomCounselors = (count) => {
  // memoised so it doesn't change on every re-render
  return useMemo(() => {
    const shuffled = shuffleArray(counselorNames);
    return shuffled.slice(0, count).map((name, index) => ({
      id: index,
      name,
    }));
  }, [count]);
};

const CounselorsScreen = ({ navigation }) => {
  // 5 cards per row (or any number you like)
  const currentList = useRandomCounselors(5);
  const bestFitList = useRandomCounselors(5);
  const otherList = useRandomCounselors(5);

  const handleCardPress = (c) => {
    // later: navigate to counselor profile
    console.log("Selected counselor:", c.name);
  };

  const handleHomePress = () => {
    navigation.navigate("Home");
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
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Choose</Text>
            <Text style={styles.titleNormal}>Counselor.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY – vertical scroll */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Currently Available */}
        <Text style={styles.sectionTitle}>
          <Text style={styles.sectionHighlight}>Currently</Text>
          <Text style={styles.sectionNormal}>Available.</Text>
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowScrollContent}
        >
          {currentList.map((c) => (
            <CounselorCard
              key={`current-${c.id}-${c.name}`}
              name={c.name}
              onPress={() => handleCardPress(c)}
            />
          ))}
        </ScrollView>

        {/* Best Fit */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
          <Text style={styles.sectionHighlight}>Best</Text>
          <Text style={styles.sectionNormal}>Fit.</Text>
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowScrollContent}
        >
          {bestFitList.map((c) => (
            <CounselorCard
              key={`best-${c.id}-${c.name}`}
              name={c.name}
              onPress={() => handleCardPress(c)}
            />
          ))}
        </ScrollView>

        {/* Other Counselor */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
          <Text style={styles.sectionHighlight}>Other</Text>
          <Text style={styles.sectionNormal}>Counselor.</Text>
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowScrollContent}
        >
          {otherList.map((c) => (
            <CounselorCard
              key={`other-${c.id}-${c.name}`}
              name={c.name}
              onPress={() => handleCardPress(c)}
            />
          ))}
        </ScrollView>
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

const CounselorCard = ({ name, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.avatar} />
    <Text style={styles.cardName}>{name}</Text>
  </TouchableOpacity>
);

export default CounselorsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F4" },

  // header
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

  // body
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 140,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  sectionHighlight: { color: "#FF7A1A" },
  sectionNormal: { color: "#111" },

  rowScrollContent: {
    paddingBottom: 4,
    paddingRight: 10,
  },

  card: {
    width: 110,
    height: 120,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
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
  cardName: {
    fontSize: 12,
    color: "#222",
    textAlign: "center",
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
  tabItem: { paddingHorizontal: 12, paddingVertical: 4 },
});

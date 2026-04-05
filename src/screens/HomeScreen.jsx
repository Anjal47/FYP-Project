import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { createThemedStyles } from "../utils/themeStyles";

const HomeScreen = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const [homeState, setHomeState] = useState({
    searchQuery: "",
  });
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );
  const { searchQuery } = homeState;
  const query = searchQuery.trim().toLowerCase();
  const filteredActions = query
    ? importantActions.filter((item) => {
        const text = `${item.title} ${item.desc}`.toLowerCase();
        return text.includes(query);
      })
    : [];

  const handleActionPress = (item) => {
    if (typeof item.onPress === "function") {
      item.onPress(navigation);
      setHomeState((prev) => ({ ...prev, searchQuery: "" }));
      return;
    }

    if (item.screen) {
      navigation.navigate(item.screen);
      setHomeState((prev) => ({ ...prev, searchQuery: "" }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.logo}>
            <Text style={{ color: theme.text }}>Angel</Text>
            <Text style={{ color: "#FF7A1A" }}>Touch.</Text>
          </Text>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
            activeOpacity={0.9}
          >
            <Icon name="settings" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.tagline}>You are not alone</Text>

        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={theme.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={(text) =>
              setHomeState((prev) => ({ ...prev, searchQuery: text }))
            }
            placeholder="Search important services"
            placeholderTextColor={theme.muted}
            style={styles.searchInput}
          />
        </View>

        {searchQuery.trim() ? (
          <View style={styles.searchResults}>
            {filteredActions.length ? (
              filteredActions.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.searchResultItem}
                  onPress={() => handleActionPress(item)}
                  activeOpacity={0.9}
                >
                  <View style={styles.searchResultIcon}>
                    <Icon name={item.icon} size={16} color="#FF7A1A" />
                  </View>
                  <View style={styles.searchResultCopy}>
                    <Text style={styles.searchResultTitle}>{item.title}</Text>
                    <Text style={styles.searchResultDesc}>{item.desc}</Text>
                  </View>
                  <Icon name="arrow-right" size={16} color="#FF7A1A" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noResultsText}>
                No matching service found.
              </Text>
            )}
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {cards.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => handleActionPress(item)}
              activeOpacity={0.9}
            >
              <View style={styles.iconWrap}>
                <Icon name={item.icon} size={20} color="#FF7A1A" />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sosWrap}>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => navigation.navigate("EmergencySOS")}
          >
            <View style={styles.sosIconWrap}>
              <Icon name="phone-call" size={30} color="#fff" />
            </View>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
          <Text style={styles.sosSubtext}>
            Fast help for police, ambulance, or your saved contact.
          </Text>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigation.navigate("UserBookedCounseling")}
          activeOpacity={0.85}
        >
          <Icon name="message-circle" size={20} color={theme.accent} />
          <Text style={[styles.tabText, styles.chatTabText]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="home" size={20} color="#FF7A1A" />
          <Text style={[styles.tabText, styles.activeTabText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigation.navigate("Profile")}
        >
          <Icon name="user" size={20} color="#999" />
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const importantActions = [
  {
    key: "reporting",
    title: "Reporting",
    desc: "File important reports safely",
    icon: "file-text",
    screen: "ReportingHome",
  },
  {
    key: "counselors",
    title: "Visit Counselors",
    desc: "Book support with a counselor",
    icon: "message-circle",
    screen: "Counseling",
  },
  {
    key: "pay-fine",
    title: "Traffic",
    desc: "Reports, rules, and fines",
    icon: "credit-card",
    screen: "TrafficHome",
  },
  {
    key: "support",
    title: "Support",
    desc: "Get help and quick assistance",
    icon: "help-circle",
    screen: "Support",
  },
  {
    key: "donation",
    title: "Donate / Charity",
    desc: "Support verified requests",
    icon: "heart",
    screen: "Donation",
  },
  {
    key: "sos",
    title: "Emergency SOS",
    desc: "Police, ambulance, or personal contact",
    icon: "phone-call",
    screen: "EmergencySOS",
  },
  {
    key: "therapy",
    title: "Urgent Therapy",
    desc: "Reach therapy support quickly",
    icon: "activity",
    screen: "TherapyScreen",
  },
];

const cards = importantActions.filter((item) =>
  ["reporting", "counselors", "pay-fine", "support", "donation"].includes(
    item.key
  )
);

export default HomeScreen;

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    fontSize: 26,
    fontWeight: "700",
  },

  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  tagline: {
    color: "#777",
    marginTop: 4,
    marginBottom: 12,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: "#111",
    fontSize: 14,
    paddingVertical: 0,
  },

  searchResults: {
    marginTop: 10,
    backgroundColor: "#F8F8F8",
    borderRadius: 18,
    padding: 8,
  },

  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },

  searchResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF3E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  searchResultCopy: {
    flex: 1,
    paddingRight: 10,
  },

  searchResultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  searchResultDesc: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  noResultsText: {
    paddingVertical: 14,
    textAlign: "center",
    color: "#777",
    fontSize: 13,
  },

  content: {
    padding: 16,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    elevation: 3,
  },

  iconWrap: {
    backgroundColor: "#FFF3E8",
    padding: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },

  cardTitle: {
    fontWeight: "700",
    fontSize: 14,
  },

  cardDesc: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },

  sosWrap: {
    alignItems: "center",
    marginTop: 24,
  },

  sosButton: {
    width: 138,
    height: 138,
    backgroundColor: "#FF3B30",
    borderRadius: 69,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  sosIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  sosText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 24,
    marginTop: 12,
  },

  sosSubtext: {
    color: "#777",
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 220,
  },

  bottomBar: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 10,
    zIndex: 999,
  },

  tab: {
    alignItems: "center",
  },

  tabText: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },

  chatTabText: {
    color: "#999",
  },

  activeTabText: {
    color: "#FF7A1A",
    fontWeight: "600",
  },
};

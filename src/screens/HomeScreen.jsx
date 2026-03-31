import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import call from "react-native-phone-call";

const HomeScreen = ({ navigation }) => {
  const [sosNumber, setSosNumber] = useState("");

  const sanitizePhone = (raw) => {
    if (!raw) return "";
    const trimmed = raw.trim();
    const plus = trimmed.startsWith("+") ? "+" : "";
    const digitsOnly = trimmed.replace(/[^\d]/g, "");
    return plus + digitsOnly;
  };

  const isValidPhone = (value) => {
    const cleaned = sanitizePhone(value);
    const digitCount = cleaned.replace(/[^\d]/g, "").length;
    return digitCount >= 6;
  };

  const handleSOSPress = async () => {
    const cleaned = sanitizePhone(sosNumber);

    if (!isValidPhone(sosNumber)) {
      Alert.alert("Invalid SOS Number", "Enter a valid phone number.");
      return;
    }

    try {
      await call({
        number: cleaned,
        prompt: true,
        skipCanOpen: true,
      });
    } catch (err) {
      Alert.alert("Call Failed", "Unable to place call.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          <Text style={{ color: "#111" }}>Angel</Text>
          <Text style={{ color: "#FF7A1A" }}>Touch.</Text>
        </Text>

        <Text style={styles.tagline}>You are not alone</Text>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Emergency Contact</Text>
          <TextInput
            value={sosNumber}
            onChangeText={setSosNumber}
            placeholder="+614XXXXXXXX"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.searchBar} activeOpacity={0.9}>
          <Icon name="search" size={18} color="#999" />
          <Text style={styles.searchText}>Search services</Text>
        </TouchableOpacity>
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
              onPress={() => navigation.navigate(item.screen)}
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

        <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
          <Icon name="phone-call" size={24} color="#fff" />
          <Text style={styles.sosText}>Emergency SOS</Text>
        </TouchableOpacity>

        <View style={{ height: 140 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigation.navigate("Settings")}
        >
          <Icon name="settings" size={20} color="#999" />
          <Text style={styles.tabText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="home" size={20} color="#FF7A1A" />
          <Text style={[styles.tabText, { color: "#FF7A1A" }]}>Home</Text>
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

const cards = [
  { title: "Reporting", desc: "File reports safely", icon: "file-text", screen: "ReportingHome" },
  { title: "Counseling", desc: "Talk to a pro", icon: "message-circle", screen: "Counseling" },
  { title: "Traffic", desc: "Live alerts", icon: "map-pin", screen: "TrafficHome" },
  { title: "Support", desc: "Get help", icon: "help-circle", screen: "Support" },
  { title: "Donate/Charity", desc: "Help someone today", icon: "heart", screen: "Donation" },
];

export default HomeScreen;

const styles = StyleSheet.create({
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

  logo: {
    fontSize: 26,
    fontWeight: "700",
  },

  tagline: {
    color: "#777",
    marginTop: 4,
    marginBottom: 12,
  },

  inputCard: {
    backgroundColor: "#F2F2F2",
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 10,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    padding: 12,
    borderRadius: 20,
  },

  searchText: {
    marginLeft: 10,
    color: "#999",
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

  sosButton: {
    flexDirection: "row",
    backgroundColor: "#FF3B30",
    paddingVertical: 20,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    elevation: 6,
  },

  sosText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    marginLeft: 10,
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
});
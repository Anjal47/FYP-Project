// src/screens/SupportScreen.jsx
import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import FloatingHelpChat from "../components/FloatingHelpChat";
import { useAppTheme } from "../context/ThemeContext";
import { createThemedStyles } from "../utils/themeStyles";

const ORANGE = "#FF7A1A";

const emergencyNumbers = [
  {
    label: "Police (नेपाल प्रहरी)",
    number: "100",
    description: "For immediate danger, crime, or safety threats.",
  },
  {
    label: "Fire Service (दमकल)",
    number: "101",
    description: "For fire, smoke, or explosion emergencies.",
  },
  {
    label: "Ambulance (एम्बुलेन्स)",
    number: "102",
    description: "Medical emergency / serious injury.",
  },
  {
    label: "Traffic Control (ट्राफिक)",
    number: "103",
    description: "Road accidents, traffic issues, unsafe driving.",
  },
  {
    label: "Child Helpline (बाल हेल्पलाइन)",
    number: "1098",
    description: "For children at risk or in distress.",
  },
];

const mentalHealthAndSafety = [
  {
    label: "National Suicide Prevention Helpline",
    number: "1166",
    description:
      "24/7 confidential support if you or someone you know is in emotional crisis.",
  },
  {
    label: "Khabar Garaun – Women & GBV Support",
    number: "1145",
    description: "National Women Commission helpline for violence & abuse.",
  },
];

const SupportScreen = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );
  const handleBack = () => navigation?.goBack?.();

  const callNumber = (num) => {
    const url = `tel:${num}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Unable to open dialer on this device.")
    );
  };

  const handleHomePress = () => navigation.navigate("Home");

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={handleBack}>
          <Icon name="arrow-left" size={20} color={theme.text} />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}> Support</Text>
            <Text style={styles.headerDot}>.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>You’re not alone.</Text>
        <Text style={styles.screenSubtitle}>
          Quick access to emergency contacts and help resources in Nepal.
        </Text>

        {/* EMERGENCY NUMBERS */}
        <Text style={styles.sectionTitle}>Emergency Numbers (Nepal)</Text>
        {emergencyNumbers.map((item) => (
          <View key={item.label} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconWrapper}>
                <Icon name="phone-call" size={18} color={ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.label}</Text>
                <Text style={styles.cardNumber}>{item.number}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => callNumber(item.number)}
              >
                <Icon name="phone" size={16} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        ))}

        {/* MENTAL HEALTH / SAFETY HELPLINES */}
        <Text style={styles.sectionTitle}>Mental Health & Safety</Text>
        {mentalHealthAndSafety.map((item) => (
          <View key={item.label} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconWrapper}>
                <Icon name="heart" size={18} color={ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.label}</Text>
                <Text style={styles.cardNumber}>{item.number}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => callNumber(item.number)}
              >
                <Icon name="phone" size={16} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        ))}

        {/* INFO TEXT SECTION */}
        <Text style={styles.sectionTitle}>How this section helps</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            • If you are in **immediate danger**, call Police (100) or Ambulance
            (102) first.{"\n\n"}
            • For **violence, abuse, or unsafe home situations**, you can call
            1145 (National Women Commission) for support and guidance.{"\n\n"}
            • For **emotional crisis, suicidal thoughts, or mental health
            struggles**, you can call the 24/7 helpline 1166 to talk to trained
            counselors.{"\n\n"}
            • Save these numbers in your phone so you don’t have to search when
            you’re stressed.
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          Disclaimer: Numbers may change in the future. Always follow the latest
          official guidance from government and service providers.
        </Text>
      </ScrollView>

      {/* ORANGE SIDE PILL */}
      <FloatingHelpChat bottom={110} fabBottom={145} />

      {/* BOTTOM BAR (same style as other screens) */}

    </SafeAreaView>
  );
};

export default SupportScreen;

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  headerHighlight: {
    color: ORANGE,
  },
  headerDot: {
    color: "#111",
  },

  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 140,
  },

  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: "#555",
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginTop: 16,
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  cardNumber: {
    fontSize: 13,
    color: ORANGE,
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: "#666",
  },

  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  callButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginTop: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoText: {
    fontSize: 12,
    color: "#444",
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 11,
    color: "#888",
    marginTop: 10,
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
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
};

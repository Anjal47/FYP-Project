import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import call from "react-native-phone-call";
import FloatingHelpChat from "../components/FloatingHelpChat";
import { useAppTheme } from "../context/ThemeContext";
import { createThemedStyles } from "../utils/themeStyles";
import { createReportRequest } from "../utils/reportApi";
import { getCurrentPreciseLocation } from "../utils/location";

const ORANGE = "#FF7A1A";
const STORAGE_KEY = "emergency_contact_number";

const sanitizePhone = (raw) => {
  if (!raw) return "";
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  return plus + digitsOnly;
};

const pickReportCode = (resp) =>
  resp?.reportCode ||
  resp?.code ||
  resp?.data?.reportCode ||
  resp?.data?.code ||
  resp?.report?.reportCode ||
  resp?.report?.code ||
  resp?.report?.id ||
  resp?.report?._id ||
  resp?.id ||
  resp?._id ||
  null;

export default function EmergencySOSScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );
  const [personalContact, setPersonalContact] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadEmergencyContact = async () => {
      try {
        const savedNumber = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted) {
          setPersonalContact(savedNumber || "");
        }
      } catch (error) {
        if (mounted) {
          setPersonalContact("");
        }
      }
    };

    const unsubscribe = navigation.addListener("focus", loadEmergencyContact);
    loadEmergencyContact();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [navigation]);

  const getToken = async () => AsyncStorage.getItem("token");

  const placeCall = async (number) => {
    try {
      await call({
        number,
        prompt: true,
        skipCanOpen: true,
      });
    } catch (error) {
      Alert.alert("Call Failed", "Unable to place the call right now.");
    }
  };

  const sendPoliceSosReport = async () => {
    const token = await getToken();
    if (!token) {
      throw new Error("Token not found. Please login again.");
    }

    let geoLocation = null;
    try {
      geoLocation = await getCurrentPreciseLocation();
    } catch (error) {
      geoLocation = null;
    }

    const area = geoLocation
      ? `${geoLocation.latitude.toFixed(6)}, ${geoLocation.longitude.toFixed(6)}`
      : "Live location unavailable";

    const description = geoLocation
      ? `Emergency SOS triggered from the app. Immediate police attention needed at coordinates ${geoLocation.latitude.toFixed(6)}, ${geoLocation.longitude.toFixed(6)}.`
      : "Emergency SOS triggered from the app. Immediate police attention needed, but live coordinates could not be captured.";

    const payload = {
      type: "Police SOS",
      area,
      description,
      priority: "High",
      geoLocation,
    };

    return createReportRequest(token, payload);
  };

  const handlePoliceSos = async () => {
    let reportCode = null;

    try {
      const resp = await sendPoliceSosReport();
      reportCode = pickReportCode(resp);
    } catch (error) {
      Alert.alert(
        "SOS Warning",
        error?.message || "Could not send the police dashboard warning. The call will still continue."
      );
    }

    await placeCall("100");

    if (reportCode) {
      Alert.alert(
        "Police Alert Sent",
        `A high-priority SOS report was also sent to the police dashboard.\n\nReport Code: ${reportCode}`
      );
    }
  };

  const handlePersonalCall = async () => {
    const cleaned = sanitizePhone(personalContact);

    if (!cleaned) {
      Alert.alert(
        "No Emergency Contact",
        "Add a personal emergency contact in Settings first.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => navigation.navigate("EmergencyContact"),
          },
        ]
      );
      return;
    }

    await placeCall(cleaned);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color={theme.text} />
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Emergency</Text>
            <Text style={styles.titleNormal}> SOS.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>
          Choose who you want to contact right now.
        </Text>

        <SOSOptionCard
          styles={styles}
          iconColor={theme.text}
          icon="user"
          title="Personal Contact"
          subtitle={
            personalContact
              ? `Call ${personalContact}`
              : "Call your saved emergency contact"
          }
          onPress={handlePersonalCall}
        />

        <SOSOptionCard
          styles={styles}
          iconColor={theme.text}
          icon="shield"
          title="Police"
          subtitle="Call police helpline 100"
          onPress={handlePoliceSos}
        />

        <SOSOptionCard
          styles={styles}
          iconColor={theme.text}
          icon="plus-circle"
          title="Ambulance"
          subtitle="Call ambulance helpline 102"
          onPress={() => placeCall("102")}
        />
      </View>

      <FloatingHelpChat bottom={110} fabBottom={145} />
    </SafeAreaView>
  );
}

const SOSOptionCard = ({ icon, title, subtitle, onPress, styles, iconColor }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.cardIconWrap}>
      <Icon name={icon} size={20} color={iconColor} />
    </View>

    <View style={styles.cardCopy}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>

    <View style={styles.cardArrow}>
      <Icon name="phone-call" size={16} color={ORANGE} />
    </View>
  </TouchableOpacity>
);

const baseStyles = {
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
    color: ORANGE,
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardCopy: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#777",
    lineHeight: 18,
    marginTop: 4,
  },
  cardArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  },
};

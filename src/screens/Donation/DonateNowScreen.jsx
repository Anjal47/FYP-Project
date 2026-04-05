import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { createThemedStyles } from "../../utils/themeStyles";

export default function DonateNowScreen({ route, navigation }) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );
  const donation = route?.params?.donation || {};
  const title = donation.helpType || "Donation Request";
  const amountNeeded = Number(donation.amountNeeded || 0);
  const raisedAmount = Number(donation.raisedAmount || 0);
  const progress = amountNeeded > 0 ? Math.min((raisedAmount / amountNeeded) * 100, 100) : 0;
  const contactNumber = donation.contact || "Not provided";
  const physicalHelpNote =
    donation.description || "Contact the requester directly if you want to provide in-person help.";
  const qrNote = donation.qrImage
    ? "Scan the requester QR code to donate instantly."
    : "This request does not have a QR image yet. Please contact the requester directly.";

  const handleCall = () => {
    Alert.alert("Contact", `Call: ${contactNumber}`);
  };

  const handleShare = () => {
    Alert.alert("Share", "Share feature can be connected later.");
  };

  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case "Urgent":
        return {
          backgroundColor: "#FDECEC",
          color: "#E53935",
        };
      case "Medium":
        return {
          backgroundColor: "#FFF4E5",
          color: "#FB8C00",
        };
      default:
        return {
          backgroundColor: "#EAF7EE",
          color: "#43A047",
        };
    }
  };

  const urgencyStyle = getUrgencyStyle(donation.urgency);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

          <Text style={styles.headerTitle}>Donate Now</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topCard}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.location}>{donation.location || "Location not provided"}</Text>
          <Text style={styles.description}>{donation.description || "No description available."}</Text>

          <View style={styles.amountRow}>
            <Text style={styles.amountText}>Need: Rs. {amountNeeded}</Text>
            <Text style={styles.amountText}>Raised: Rs. {raisedAmount}</Text>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>

          <View
            style={[
              styles.urgencyWrap,
              { backgroundColor: urgencyStyle.backgroundColor },
            ]}
          >
            <Text style={[styles.urgencyText, { color: urgencyStyle.color }]}>
              {donation.urgency || "Medium"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Donate by QR</Text>
          <Text style={styles.sectionSubtitle}>{qrNote}</Text>

          <View style={styles.qrBox}>
            {donation.qrImage ? (
              <Image source={{ uri: donation.qrImage }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <Text style={styles.helperText}>No QR image uploaded for this request.</Text>
            )}
          </View>

          {!!donation.proofImage && (
            <>
              <Text style={styles.sectionTitle}>Proof Image</Text>
              <Image source={{ uri: donation.proofImage }} style={styles.proofImage} resizeMode="cover" />
            </>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact & Physical Help</Text>

          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>Phone Number</Text>
            <Text style={styles.contactValue}>{contactNumber}</Text>
          </View>

          <View style={styles.helpBox}>
            <Text style={styles.contactLabel}>How you can help physically</Text>
            <Text style={styles.helpText}>{physicalHelpNote}</Text>
          </View>

          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCall}
            activeOpacity={0.9}
          >
            <Text style={styles.callButtonText}>Contact Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Share This Cause</Text>
          <Text style={styles.sectionSubtitle}>
            Help more people see this request and support it.
          </Text>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.9}
          >
            <Text style={styles.shareButtonText}>Share Cause</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  content: {
    padding: 16,
  },

  topCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  location: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
  },

  description: {
    marginTop: 12,
    fontSize: 14,
    color: "#374151",
    lineHeight: 21,
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },

  amountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 14,
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#4A90E2",
    borderRadius: 999,
  },

  urgencyWrap: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  urgencyText: {
    fontSize: 13,
    fontWeight: "700",
  },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 14,
  },

  qrBox: {
    height: 260,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#BFC7D5",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },

  qrImage: {
    width: 210,
    height: 210,
  },

  helperText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
    textAlign: "center",
  },
  proofImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginTop: 12,
  },

  contactBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  helpBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  contactLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
  },

  contactValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  helpText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },

  callButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  callButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  shareButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  shareButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
};

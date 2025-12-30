import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

/**
 * ConnectToNGOsScreen
 * - UI styled like your Support screen: title + subtitle + card list + action buttons
 * - Includes NGO phone + email + description
 * - Uses Linking for call/email
 */
const ConnectToNGOsScreen = ({ navigation }) => {
  /**
   * NOTE:
   * Replace these demo contacts with VERIFIED NGO contacts before production.
   * Keeping placeholders avoids accidentally shipping wrong phone/email info.
   */
  const ngos = useMemo(
    () => [
      {
        id: "ngo-1",
        name: "SafeSpace Nepal",
        phoneDisplay: "+977-1-4000000",
        phoneDial: "+97714000000",
        email: "support@safespace.org.np",
        description:
          "Crisis support, referrals, and safe guidance. Works with local services for urgent and non-urgent cases.",
        category: "Crisis & Referral",
      },
      {
        id: "ngo-2",
        name: "HopeLine Nepal",
        phoneDisplay: "+977-9800000000",
        phoneDial: "+9779800000000",
        email: "helpline@hopeline.org.np",
        description:
          "Confidential emotional support and mental health referrals. Helps you connect with counselors and community resources.",
        category: "Mental Health",
      },
      {
        id: "ngo-3",
        name: "WomenCare Network",
        phoneDisplay: "+977-1-4100000",
        phoneDial: "+97714100000",
        email: "contact@womencare.org.np",
        description:
          "Support for women facing violence, harassment, or unsafe situations. Guidance, shelter referrals, and legal direction.",
        category: "Women Safety",
      },
      {
        id: "ngo-4",
        name: "ChildShield Nepal",
        phoneDisplay: "+977-1-4200000",
        phoneDial: "+97714200000",
        email: "help@childshield.org.np",
        description:
          "Child protection support and referrals. Helps report incidents and connect to safe services for children at risk.",
        category: "Child Protection",
      },
      {
        id: "ngo-5",
        name: "AccessAble Nepal",
        phoneDisplay: "+977-9801111111",
        phoneDial: "+9779801111111",
        email: "info@accessable.org.np",
        description:
          "Support and referrals for people with disabilities. Works on accessibility, inclusion, and wellbeing resources.",
        category: "Disability Support",
      },
    ],
    []
  );

  /** Dialer open (Android/iOS) */
  const handleCall = async (phoneDial) => {
    try {
      if (!phoneDial) return;
      const url = `tel:${phoneDial}`;
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert("Call not supported", "Your device cannot place calls from this app.");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", "Could not open dialer.");
    }
  };

  /** Email compose */
  const handleEmail = async (email) => {
    try {
      if (!email) return;
      const url = `mailto:${email}`;
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert("Email not supported", "No email app found on this device.");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", "Could not open email app.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER ROW (like your other screens) */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <Icon name="arrow-left" size={20} color="#111" />
        </TouchableOpacity>

        <Text style={styles.screenTitle}>
          <Text style={styles.titleAccent}>Connect</Text>
          <Text style={styles.titleNormal}>.</Text>
        </Text>

        {/* spacer for symmetry */}
        <View style={styles.rightSpacer} />
      </View>

      {/* INTRO */}
      <View style={styles.introWrap}>
        <Text style={styles.introTitle}>Find help nearby.</Text>
        <Text style={styles.introSub}>
          Quick access to NGOs, contact details, and support resources in Nepal.
        </Text>
      </View>

      {/* LIST */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>NGO Directory (Nepal)</Text>

        {ngos.map((ngo) => (
          <View key={ngo.id} style={styles.card}>
            {/* LEFT ICON */}
            <View style={styles.iconBubble}>
              <Icon name="heart" size={16} color="#ff7a00" />
            </View>

            {/* MIDDLE INFO */}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{ngo.name}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{ngo.category}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{ngo.phoneDisplay}</Text>
              </View>

              <Text style={styles.descText}>{ngo.description}</Text>

              {/* Email shown like support screen info line */}
              <View style={styles.emailRow}>
                <Icon name="mail" size={14} color="#666" />
                <Text style={styles.emailText} numberOfLines={1}>
                  {ngo.email}
                </Text>
              </View>
            </View>

            {/* RIGHT ACTIONS */}
            <View style={styles.actionsCol}>
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.9}
                onPress={() => handleCall(ngo.phoneDial)}
              >
                <Icon name="phone" size={14} color="#fff" />
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                activeOpacity={0.9}
                onPress={() => handleEmail(ngo.email)}
              >
                <Icon name="send" size={14} color="#fff" />
                <Text style={styles.actionText}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Extra space so bottom tab / FAB never overlaps */}
        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConnectToNGOsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    elevation: 2,
  },
  rightSpacer: {
    width: 40,
    height: 40,
  },

  screenTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  titleAccent: {
    color: "#ff7a00",
    fontWeight: "900",
  },
  titleNormal: {
    color: "#111",
    fontWeight: "900",
  },

  introWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    marginBottom: 6,
  },
  introSub: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },

  sectionTitle: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "800",
    color: "#222",
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12, // IMPORTANT: spacing like your Support screen
    elevation: 3,
  },

  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff3e8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  cardBody: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111",
    marginBottom: 4,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#ff7a00",
    fontWeight: "800",
  },
  metaDot: {
    marginHorizontal: 8,
    color: "#bbb",
    fontWeight: "900",
  },

  descText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 17,
    marginBottom: 10,
  },

  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emailText: {
    fontSize: 12,
    color: "#555",
    flex: 1,
  },

  actionsCol: {
    gap: 10,
    paddingTop: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ff7a00",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    minWidth: 86,
    elevation: 2,
  },
  actionBtnSecondary: {
    backgroundColor: "#111",
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
});

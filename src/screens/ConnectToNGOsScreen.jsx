import React, { useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { useTranslate } from "../utils/localization";
export default function ConnectToNGOsScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const ngos = useMemo(() => [{
    id: "ngo-1",
    name: "SafeSpace Nepal",
    phoneDisplay: "+977-9800000001",
    phoneDial: "+9779800000001",
    email: "safespace.demo@example.com",
    description: "Crisis support, referrals, and safe guidance for urgent and non-urgent cases.",
    category: "Crisis & Referral"
  }, {
    id: "ngo-2",
    name: "HopeLine Nepal",
    phoneDisplay: "+977-9800000002",
    phoneDial: "+9779800000002",
    email: "hopeline.demo@example.com",
    description: "Confidential emotional support and mental health referral guidance.",
    category: "Mental Health"
  }, {
    id: "ngo-3",
    name: "WomenCare Network",
    phoneDisplay: "+977-9800000003",
    phoneDial: "+9779800000003",
    email: "womencare.demo@example.com",
    description: "Support for violence, harassment, shelter referrals, and legal direction.",
    category: "Women Safety"
  }, {
    id: "ngo-4",
    name: "ChildShield Nepal",
    phoneDisplay: "+977-9800000004",
    phoneDial: "+9779800000004",
    email: "childshield.demo@example.com",
    description: "Child protection support and referral help for children at risk.",
    category: "Child Protection"
  }], []);
  const handleCall = async phoneDial => {
    try {
      await Linking.openURL(`tel:${phoneDial}`);
    } catch {
      Alert.alert(translate("Error"), translate("Could not open the dialer."));
    }
  };
  const handleEmail = async email => {
    try {
      await Linking.openURL(`mailto:${email}?subject=${encodeURIComponent("AngelTouch NGO Support")}`);
    } catch {
      Alert.alert(translate("Error"), translate("Could not open the email app."));
    }
  };
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack?.()} activeOpacity={0.85}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{translate("Back")}</Text>
          </TouchableOpacity>

          <View style={styles.glow} />
          <Text style={styles.eyebrow}>{translate("NGO Directory")}</Text>
          <Text style={styles.title}>{translate("Reach trusted support contacts without second-guessing where to start.")}</Text>
          <Text style={styles.subtitle}>{translate("Clear contact cards, fewer distractions, and faster ways to call or email the right organization.")}</Text>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>{translate("Available contacts")}</Text>
          <Text style={styles.sectionSubtitle}>{translate("Choose a support organization and connect in the way that feels safest for you.")}</Text>

          {ngos.map(ngo => <View key={ngo.id} style={styles.ngoCard}>
              <View style={styles.iconWrap}>
                <Icon name="heart" size={16} color={theme.accentStrong} />
              </View>
              <View style={styles.ngoCopy}>
                <Text style={styles.ngoTitle}>{ngo.name}</Text>
                <Text style={styles.ngoMeta}>
                  {ngo.category} • {ngo.phoneDisplay}
                </Text>
                <Text style={styles.ngoDescription}>{ngo.description}</Text>
              </View>
              <View style={styles.actionColumn}>
                <TouchableOpacity style={styles.primaryAction} onPress={() => handleCall(ngo.phoneDial)} activeOpacity={0.9}>
                  <Icon name="phone" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction} onPress={() => handleEmail(ngo.email)} activeOpacity={0.9}>
                  <Icon name="send" size={14} color={theme.accentStrong} />
                </TouchableOpacity>
              </View>
            </View>)}
        </View>
      </ScrollView>
    </SafeAreaView>;
}
function createStyles(theme, isDark) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    content: {
      padding: 12,
      paddingBottom: 32
    },
    hero: {
      position: "relative",
      overflow: "hidden",
      backgroundColor: theme.surface,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.24 : 0.08,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 10
      },
      elevation: 4
    },
    glow: {
      position: "absolute",
      top: -84,
      right: -70,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: theme.accentSoft
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 10,
      marginBottom: 20
    },
    backIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center"
    },
    backText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700"
    },
    eyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800",
      letterSpacing: -0.8,
      maxWidth: 580
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 520
    },
    listCard: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800"
    },
    sectionSubtitle: {
      marginTop: 6,
      marginBottom: 14,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    ngoCard: {
      flexDirection: "row",
      gap: 12,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginTop: 10
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.surfaceElevated,
      alignItems: "center",
      justifyContent: "center"
    },
    ngoCopy: {
      flex: 1
    },
    ngoTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800"
    },
    ngoMeta: {
      marginTop: 4,
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "700"
    },
    ngoDescription: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    ngoEmail: {
      marginTop: 6,
      color: theme.text,
      fontSize: 12,
      fontWeight: "600"
    },
    actionColumn: {
      justifyContent: "space-between",
      alignItems: "center"
    },
    primaryAction: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center"
    },
    secondaryAction: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center"
    }
  };
}
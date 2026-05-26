import React, { useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../../context/ThemeContext";
import { useTranslate } from "../../utils/localization";

function getDonationLifecycle(donation) {
  if (donation?.isClosed) return "Closed";
  if (donation?.status === "rejected") return "Rejected";
  if (donation?.isFunded) return "Funded";
  if (donation?.status === "approved") return "Approved";
  return "Pending";
}

export default function DonateNowScreen({
  route,
  navigation
}) {
  const translate = useTranslate();
  const donation = route?.params?.donation || {};
  const amountNeeded = Number(donation.amountNeeded || 0);
  const raisedAmount = Number(donation.raisedAmount || 0);
  const remainingAmount = Math.max(0, Number(donation.remainingAmount ?? amountNeeded - raisedAmount));
  const donorCount = Number(donation.donorCount || 0);
  const progress = amountNeeded > 0 ? Math.min(raisedAmount / amountNeeded * 100, 100) : 0;
  const lifecycle = getDonationLifecycle(donation);
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);

  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{translate("Back")}</Text>
          </TouchableOpacity>

          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{translate("Donate Now")}</Text>
              <Text style={styles.heroTitle}>{donation.helpType || translate("Support Request")}</Text>
              <Text style={styles.heroSubtitle}>{donation.location || translate("Location will appear here")}</Text>
            </View>
            <StatusBadge label={translate(lifecycle)} styles={styles} theme={theme} tone={lifecycle === "Funded" ? "success" : lifecycle === "Closed" ? "muted" : "default"} />
          </View>
          <Text style={styles.description}>{donation.description || translate("More details will appear here.")}</Text>
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
              width: `${progress}%`,
              backgroundColor: lifecycle === "Funded" ? theme.success || theme.accentStrong : theme.accentStrong
            }]} />
            </View>
            <Text style={styles.progressText}>{translate("Need Rs.")}{amountNeeded} | {translate("Raised Rs.")}{raisedAmount} | {translate("Remaining Rs.")}{remainingAmount}</Text>
            <Text style={styles.progressMeta}>{translate("Donors")}: {donorCount} | {Number(donation.progressPercent ?? progress).toFixed(0)}%</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <InfoCard label={translate("Contact")} value={donation.contact || "Not provided"} styles={styles} />
          <InfoCard label={translate("Urgency")} value={donation.urgency || "Medium"} styles={styles} />
        </View>

        {!!donation.adminNotes && <View style={styles.panel}>
            <Text style={styles.sectionTitle}>{translate("Verification note")}</Text>
            <Text style={styles.helperText}>{donation.adminNotes}</Text>
          </View>}

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{translate("Donate by QR")}</Text>
          <View style={styles.qrBox}>
            {donation.qrImage ? <Image source={{
            uri: donation.qrImage
          }} style={styles.qrImage} resizeMode="contain" /> : <Text style={styles.helperText}>{translate("Payment QR will appear here when it is available.")}</Text>}
          </View>
          {!!donation.proofImage && <Image source={{
          uri: donation.proofImage
        }} style={styles.proofImage} resizeMode="cover" />}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{translate("Contact & in-person help")}</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{translate("Phone Number")}</Text>
            <Text style={styles.infoValue}>{donation.contact || "Not provided"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{translate("How you can help in person")}</Text>
            <Text style={styles.infoText}>{donation.description || "Contact the requester directly if you want to provide in-person help."}</Text>
          </View>
          <TouchableOpacity style={[styles.primaryButton, lifecycle === "Closed" && styles.buttonDisabled]} onPress={() => lifecycle !== "Closed" && Alert.alert(translate("Contact"), `Call: ${donation.contact || "Not provided"}`)} activeOpacity={0.9} disabled={lifecycle === "Closed"}>
            <Text style={styles.primaryButtonText}>{lifecycle === "Closed" ? translate("Request Closed") : translate("Contact Now")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>;
}

function StatusBadge({
  label,
  styles,
  theme,
  tone
}) {
  const palette = tone === "success" ? {
    backgroundColor: "#DCFCE7",
    color: "#166534"
  } : tone === "muted" ? {
    backgroundColor: theme.surfaceSoft,
    color: theme.muted
  } : {
    backgroundColor: theme.accentSoft,
    color: theme.accentStrong
  };
  return <View style={[styles.statusBadge, {
    backgroundColor: palette.backgroundColor
  }]}>
      <Text style={[styles.statusBadgeText, {
      color: palette.color
    }]}>{label}</Text>
    </View>;
}

function InfoCard({
  label,
  value,
  styles
}) {
  return <View style={styles.infoMiniCard}>
      <Text style={styles.infoMiniLabel}>{label}</Text>
      <Text style={styles.infoMiniValue}>{value}</Text>
    </View>;
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
      borderRadius: 30,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 22,
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
    heroGlow: {
      position: "absolute",
      top: -86,
      right: -60,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: theme.accentSoft
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 10,
      marginBottom: 18
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
    heroTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12
    },
    heroCopy: {
      flex: 1
    },
    heroEyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    heroTitle: {
      marginTop: 8,
      color: theme.text,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "800",
      letterSpacing: -0.8
    },
    heroSubtitle: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 13,
      fontWeight: "700"
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "800"
    },
    description: {
      marginTop: 12,
      color: theme.text,
      fontSize: 13,
      lineHeight: 20
    },
    progressWrap: {
      marginTop: 16
    },
    progressTrack: {
      width: "100%",
      height: 8,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: theme.border
    },
    progressFill: {
      height: "100%",
      borderRadius: 999
    },
    progressText: {
      marginTop: 8,
      color: theme.text,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18
    },
    progressMeta: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 11,
      fontWeight: "700"
    },
    metaGrid: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16
    },
    infoMiniCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14
    },
    infoMiniLabel: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.7
    },
    infoMiniValue: {
      marginTop: 6,
      color: theme.text,
      fontSize: 13,
      fontWeight: "800"
    },
    panel: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      marginBottom: 16
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 10
    },
    qrBox: {
      height: 260,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      marginBottom: 12
    },
    qrImage: {
      width: 210,
      height: 210
    },
    proofImage: {
      width: "100%",
      height: 220,
      borderRadius: 18,
      marginTop: 4
    },
    helperText: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      paddingHorizontal: 20
    },
    infoCard: {
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10
    },
    infoLabel: {
      color: theme.muted,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 6
    },
    infoValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800"
    },
    infoText: {
      color: theme.text,
      fontSize: 12,
      lineHeight: 19
    },
    primaryButton: {
      marginTop: 6,
      minHeight: 48,
      borderRadius: 18,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center"
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800"
    },
    buttonDisabled: {
      opacity: 0.7
    }
  };
}

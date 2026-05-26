import React, { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import call from "react-native-phone-call";
import { useAppTheme } from "../context/ThemeContext";
import { createReportRequest } from "../utils/reportApi";
import { getCurrentPreciseLocation } from "../utils/location";
import { useTranslate } from "../utils/localization";
const STORAGE_KEY = "emergency_contact_number";
const SOS_SESSION_LOG_KEY = "sos_session_history";
const SOS_TRACKING_DURATION_MS = 5 * 60 * 1000;
const SOS_TRACKING_INTERVAL_MS = 30 * 1000;
const sanitizePhone = raw => {
  if (!raw) return "";
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  return plus + digitsOnly;
};
const pickReportCode = resp => resp?.reportCode || resp?.code || resp?.data?.reportCode || resp?.data?.code || resp?.report?.reportCode || resp?.report?.code || resp?.report?.id || resp?.report?._id || resp?.id || resp?._id || null;
const formatCoords = geoLocation => geoLocation ? `${geoLocation.latitude.toFixed(6)}, ${geoLocation.longitude.toFixed(6)}` : "Live location unavailable";
const buildMapsLink = geoLocation => geoLocation ? `https://maps.google.com/?q=${geoLocation.latitude.toFixed(6)},${geoLocation.longitude.toFixed(6)}` : "";
async function saveEmergencySessionLog(entry) {
  try {
    const raw = await AsyncStorage.getItem(SOS_SESSION_LOG_KEY);
    const parsed = JSON.parse(raw || "[]");
    const existing = Array.isArray(parsed) ? parsed : [];
    const next = [entry, ...existing].slice(0, 10);
    await AsyncStorage.setItem(SOS_SESSION_LOG_KEY, JSON.stringify(next));
  } catch (_error) {
    // Ignore local logging failures during emergency flow.
  }
}
export default function EmergencySOSScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const [personalContact, setPersonalContact] = useState("");
  const [session, setSession] = useState(null);
  const trackingTimerRef = useRef(null);
  const trackingStopRef = useRef(null);
  useEffect(() => {
    let mounted = true;
    const loadEmergencyContact = async () => {
      try {
        const savedNumber = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted) {
          setPersonalContact(savedNumber || "");
        }
      } catch (_error) {
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
      if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
      if (trackingStopRef.current) clearTimeout(trackingStopRef.current);
    };
  }, [navigation]);
  const getToken = async () => AsyncStorage.getItem("token");
  const placeCall = async number => {
    try {
      await call({
        number,
        prompt: true,
        skipCanOpen: true
      });
      return true;
    } catch (_error) {
      Alert.alert(translate("Call Failed"), translate("Unable to place the call right now."));
      return false;
    }
  };
  const updateSession = patch => {
    setSession(prev => ({
      ...(prev || {
        startedAt: new Date().toISOString(),
        trackingActive: false,
        emergencyCallPlaced: false,
        policeAlertSent: false,
        trustedContactAlerted: false,
        reportCode: "",
        lastLocation: null,
        statusText: "Starting SOS"
      }),
      ...patch
    }));
  };
  const stopTrackingSession = (statusText = "Emergency tracking stopped") => {
    if (trackingTimerRef.current) {
      clearInterval(trackingTimerRef.current);
      trackingTimerRef.current = null;
    }
    if (trackingStopRef.current) {
      clearTimeout(trackingStopRef.current);
      trackingStopRef.current = null;
    }
    updateSession({
      trackingActive: false,
      statusText
    });
  };
  const sendPoliceSosReport = async geoLocation => {
    const token = await getToken();
    if (!token) {
      throw new Error("Token not found. Please login again.");
    }
    const area = formatCoords(geoLocation);
    const description = geoLocation ? `Emergency SOS triggered from the app. Immediate police attention needed at coordinates ${geoLocation.latitude.toFixed(6)}, ${geoLocation.longitude.toFixed(6)}.` : "Emergency SOS triggered from the app. Immediate police attention needed, but live coordinates could not be captured.";
    return createReportRequest(token, {
      type: "Police SOS",
      area,
      description,
      priority: "High",
      geoLocation: geoLocation || null
    });
  };
  const sendTrustedContactSms = async (number, geoLocation, reportCode) => {
    const mapsLink = buildMapsLink(geoLocation);
    const lines = ["Emergency SOS triggered from AngelTouch.", `Location: ${formatCoords(geoLocation)}`, mapsLink ? `Map: ${mapsLink}` : "", reportCode ? `Police alert code: ${reportCode}` : "", "Please check on me immediately."].filter(Boolean);
    const smsUrl = `sms:${number}?body=${encodeURIComponent(lines.join("\n"))}`;
    const supported = await Linking.canOpenURL(smsUrl);
    if (!supported) {
      throw new Error("SMS is not available on this device.");
    }
    await Linking.openURL(smsUrl);
  };
  const startLocationTracking = (initialLocation, reportCode) => {
    if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
    if (trackingStopRef.current) clearTimeout(trackingStopRef.current);
    updateSession({
      lastLocation: initialLocation || null,
      trackingActive: true,
      statusText: "Emergency tracking active",
      reportCode: reportCode || ""
    });
    trackingTimerRef.current = setInterval(async () => {
      try {
        const nextLocation = await getCurrentPreciseLocation();
        updateSession({
          lastLocation: nextLocation,
          trackingActive: true,
          statusText: "Emergency tracking active"
        });
      } catch (_error) {
        updateSession({
          trackingActive: true,
          statusText: "Tracking active, waiting for a fresh location"
        });
      }
    }, SOS_TRACKING_INTERVAL_MS);
    trackingStopRef.current = setTimeout(() => {
      stopTrackingSession("Emergency tracking finished");
    }, SOS_TRACKING_DURATION_MS);
  };
  const handlePoliceSos = async () => {
    let geoLocation = null;
    let reportCode = null;
    let policeAlertSent = false;
    let emergencyCallPlaced = false;
    let trustedContactAlerted = false;
    updateSession({
      startedAt: new Date().toISOString(),
      trackingActive: false,
      emergencyCallPlaced: false,
      policeAlertSent: false,
      trustedContactAlerted: false,
      reportCode: "",
      lastLocation: null,
      statusText: "Preparing emergency cascade"
    });
    try {
      geoLocation = await getCurrentPreciseLocation();
      updateSession({
        lastLocation: geoLocation,
        statusText: "Location captured"
      });
    } catch (_error) {
      updateSession({
        statusText: "Continuing without live location"
      });
    }
    try {
      const resp = await sendPoliceSosReport(geoLocation);
      reportCode = pickReportCode(resp);
      policeAlertSent = true;
      updateSession({
        policeAlertSent: true,
        reportCode: reportCode || "",
        statusText: reportCode ? `Police alert sent • ${reportCode}` : "Police alert sent"
      });
    } catch (error) {
      Alert.alert(translate("SOS Warning"), error?.message || "Could not send the police dashboard warning. The call will still continue.");
      updateSession({
        statusText: "Police alert failed, continuing call"
      });
    }
    emergencyCallPlaced = await placeCall("100");
    if (emergencyCallPlaced) {
      updateSession({
        emergencyCallPlaced: true,
        statusText: policeAlertSent ? "Police call started and alert sent" : "Police call started"
      });
    }
    const cleanedContact = sanitizePhone(personalContact);
    if (cleanedContact) {
      try {
        await sendTrustedContactSms(cleanedContact, geoLocation, reportCode);
        trustedContactAlerted = true;
        updateSession({
          trustedContactAlerted: true,
          statusText: "Trusted contact message ready to send"
        });
      } catch (error) {
        Alert.alert(translate("Trusted Contact"), error?.message || "Could not open the emergency text draft for your saved contact.");
      }
    }
    startLocationTracking(geoLocation, reportCode);
    await saveEmergencySessionLog({
      startedAt: new Date().toISOString(),
      reportCode: reportCode || "",
      policeAlertSent,
      emergencyCallPlaced,
      trustedContactAlerted,
      lastLocation: geoLocation || null
    });
  };
  const handlePersonalCall = async () => {
    const cleaned = sanitizePhone(personalContact);
    if (!cleaned) {
      Alert.alert(translate("No Emergency Contact"), translate("Add a personal emergency contact in Settings first."), [{
        text: translate("Cancel"),
        style: "cancel"
      }, {
        text: translate("Open Settings"),
        onPress: () => navigation.navigate("EmergencyContact")
      }]);
      return;
    }
    await placeCall(cleaned);
  };
  const cards = [{
    icon: "user",
    title: translate("Personal Contact"),
    subtitle: personalContact ? `Call ${personalContact}` : "Call your saved emergency contact",
    onPress: handlePersonalCall,
    tone: "default"
  }, {
    icon: "shield",
    title: translate("Police Cascade"),
    subtitle: translate("Call police, alert dashboard, notify contact, and start emergency tracking."),
    onPress: handlePoliceSos,
    tone: "danger"
  }, {
    icon: "plus-circle",
    title: translate("Ambulance"),
    subtitle: translate("Call ambulance helpline 102 immediately."),
    onPress: () => placeCall("102"),
    tone: "default"
  }];
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{translate("Back")}</Text>
          </TouchableOpacity>

          <Text style={styles.eyebrow}>{translate("Emergency SOS")}</Text>
          <Text style={styles.title}>{translate("Choose the fastest emergency action without extra steps.")}</Text>
          <Text style={styles.subtitle}>{translate("Police cascade now combines calling, reporting, contact notification, and a short live tracking session.")}</Text>
        </View>

        <View style={styles.stack}>
          {cards.map(item => <TouchableOpacity key={item.title} style={[styles.card, item.tone === "danger" && styles.cardDanger]} onPress={item.onPress} activeOpacity={0.92}>
              <View style={[styles.cardIconWrap, item.tone === "danger" && styles.cardIconWrapDanger]}>
                <Icon name={item.icon} size={18} color={item.tone === "danger" ? "#FFFFFF" : theme.accentStrong} />
              </View>

              <View style={styles.cardCopy}>
                <Text style={[styles.cardTitle, item.tone === "danger" && styles.cardTitleDanger]}>{item.title}</Text>
                <Text style={[styles.cardSubtitle, item.tone === "danger" && styles.cardSubtitleDanger]}>
                  {item.subtitle}
                </Text>
              </View>

              <Icon name="arrow-up-right" size={16} color={item.tone === "danger" ? "#FFFFFF" : theme.accentStrong} />
            </TouchableOpacity>)}
        </View>
      </ScrollView>

      {session ? <View style={styles.sessionDock}>
          <View style={styles.sessionCard}>
            <Text style={styles.sessionEyebrow}>{translate("SOS Session")}</Text>
            <Text style={styles.sessionTitle}>{session.statusText || "Emergency flow started"}</Text>

            <View style={styles.sessionGrid}>
              <StatusPill styles={styles} label={translate("Police Alert")} value={session.policeAlertSent ? "Sent" : "Pending"} active={session.policeAlertSent} />
              <StatusPill styles={styles} label={translate("Call")} value={session.emergencyCallPlaced ? "Started" : "Pending"} active={session.emergencyCallPlaced} />
              <StatusPill styles={styles} label={translate("Contact")} value={session.trustedContactAlerted ? "Text Ready" : "Not Sent"} active={session.trustedContactAlerted} />
              <StatusPill styles={styles} label={translate("Tracking")} value={session.trackingActive ? "Active" : "Idle"} active={session.trackingActive} />
            </View>

            {!!session.reportCode && <Text style={styles.sessionMeta}>{translate("Report Code:")}{session.reportCode}</Text>}
            <Text style={styles.sessionMeta}>{translate("Last location:")}{formatCoords(session.lastLocation)}</Text>
            {!!buildMapsLink(session.lastLocation) && <Text style={styles.sessionMeta}>{translate("Map:")}{buildMapsLink(session.lastLocation)}</Text>}
            {session.trackingActive ? <TouchableOpacity style={styles.stopTrackingButton} activeOpacity={0.9} onPress={() => stopTrackingSession("Emergency tracking stopped by user")}>
                <Text style={styles.stopTrackingButtonText}>{translate("Stop Tracking")}</Text>
              </TouchableOpacity> : null}
          </View>
        </View> : null}

    </SafeAreaView>;
}
function StatusPill({
  label,
  value,
  active,
  styles
}) {
  return <View style={[styles.statusPill, active && styles.statusPillActive]}>
      <Text style={[styles.statusPillLabel, active && styles.statusPillLabelActive]}>{label}</Text>
      <Text style={[styles.statusPillValue, active && styles.statusPillValueActive]}>{value}</Text>
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
      paddingBottom: 300
    },
    hero: {
      backgroundColor: theme.surface,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.22 : 0.08,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 10
      },
      elevation: 4
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 10
    },
    backIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border
    },
    backText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700"
    },
    eyebrow: {
      marginTop: 22,
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: 29,
      lineHeight: 35,
      fontWeight: "800",
      letterSpacing: -0.9,
      maxWidth: 560
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 520
    },
    stack: {
      gap: 12
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 14
    },
    cardDanger: {
      backgroundColor: "#D64545",
      borderColor: "#D64545"
    },
    cardIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    cardIconWrapDanger: {
      backgroundColor: "rgba(255,255,255,0.14)"
    },
    cardCopy: {
      flex: 1
    },
    cardTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    cardTitleDanger: {
      color: "#FFFFFF"
    },
    cardSubtitle: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4
    },
    cardSubtitleDanger: {
      color: "rgba(255,255,255,0.84)"
    },
    sessionDock: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 180
    },
    sessionCard: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.24 : 0.1,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 10
      },
      elevation: 6
    },
    sessionEyebrow: {
      color: theme.accentStrong,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    sessionTitle: {
      marginTop: 8,
      color: theme.text,
      fontSize: 16,
      fontWeight: "800"
    },
    sessionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 14
    },
    statusPill: {
      minWidth: "47%",
      flexGrow: 1,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12
    },
    statusPillActive: {
      backgroundColor: theme.accentSoft,
      borderColor: theme.accentStrong
    },
    statusPillLabel: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    statusPillLabelActive: {
      color: theme.accentStrong
    },
    statusPillValue: {
      marginTop: 6,
      color: theme.text,
      fontSize: 12,
      fontWeight: "800"
    },
    statusPillValueActive: {
      color: theme.accentStrong
    },
    sessionMeta: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    stopTrackingButton: {
      marginTop: 16,
      alignSelf: "flex-start",
      backgroundColor: theme.text,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 11
    },
    stopTrackingButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800"
    }
  };
}

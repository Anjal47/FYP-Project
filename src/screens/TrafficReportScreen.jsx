import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createReportRequest, isReportAudioPickerAvailable, pickReportAudio, pickReportPhoto, pickReportVideo } from "../utils/reportApi";
import { useAppTheme } from "../context/ThemeContext";
import { formatPinnedLocation, getCurrentPreciseLocation, showLocationUnavailableAlert } from "../utils/location";
import { useTranslate } from "../utils/localization";
export default function TrafficReportScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [media, setMedia] = useState({
    photo: null,
    audio: null,
    video: null
  });
  const [geoLocation, setGeoLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const audioPickerAvailable = isReportAudioPickerAvailable();
  const getToken = async () => AsyncStorage.getItem("token");
  const pickReportCode = resp => resp?.reportCode || resp?.code || resp?.data?.reportCode || resp?.data?.code || resp?.report?.reportCode || resp?.report?.code || resp?.report?.id || resp?.report?._id || resp?.id || resp?._id || null;
  const resetForm = () => {
    setDescription("");
    setLocation("");
    setGeoLocation(null);
  };
  const onUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const current = await getCurrentPreciseLocation();
      setGeoLocation(current);
      setLocation(prev => String(prev || "").trim() ? prev : `${current.latitude.toFixed(6)}, ${current.longitude.toFixed(6)}`);
    } catch (error) {
      showLocationUnavailableAlert(error);
    } finally {
      setLocating(false);
    }
  };
  const onSubmit = async () => {
    try {
      const d = description.trim();
      const l = location.trim();
      if (!d) return Alert.alert(translate("Missing"), translate("Please enter description."));
      if (!l) return Alert.alert(translate("Missing"), translate("Please add location / area."));
      setSubmitting(true);
      const token = await getToken();
      if (!token) return Alert.alert(translate("Login required"), translate("Token not found. Please login again."));
      const resp = await createReportRequest(token, {
        type: "Traffic",
        area: l,
        description: d,
        priority: "Medium",
        geoLocation
      }, media);
      const reportCode = pickReportCode(resp) || "N/A";
      Alert.alert(translate("Submitted"), `Traffic report sent successfully.\n\nReport Code: ${reportCode}`, [{
        text: translate("Check Status"),
        onPress: () => {
          resetForm();
          setMedia({
            photo: null,
            audio: null,
            video: null
          });
          navigation.navigate("TrafficReportStatus", {
            reportCode
          });
        }
      }, {
        text: translate("Done"),
        style: "cancel",
        onPress: () => {
          resetForm();
          setMedia({
            photo: null,
            audio: null,
            video: null
          });
          navigation.goBack?.();
        }
      }]);
    } catch (error) {
      Alert.alert(translate("Error"), error?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ReportHero title={translate("Traffic Report")} subtitle={translate("Report road issues with clearer structure and fewer distractions.")} onBack={() => navigation.goBack?.()} styles={styles} theme={theme} />

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{translate("What happened?")}</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder={translate("Describe the traffic issue...")} placeholderTextColor={theme.muted} multiline value={description} onChangeText={setDescription} />
          <Text style={styles.fieldLabel}>{translate("Location")}</Text>
          <TextInput style={[styles.input, styles.textareaSm]} placeholder={translate("Type address / landmark...")} placeholderTextColor={theme.muted} multiline value={location} onChangeText={setLocation} />

          <TouchableOpacity style={[styles.secondaryButton, (locating || submitting) && styles.buttonDisabled]} onPress={onUseCurrentLocation} activeOpacity={0.9} disabled={locating || submitting}>
            {locating ? <ActivityIndicator size="small" color={theme.text} /> : <Text style={styles.secondaryButtonText}>{translate("Use Current Location")}</Text>}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{translate("Pinned point")}</Text>
            <Text style={styles.infoText}>{formatPinnedLocation(geoLocation)}</Text>
          </View>

          <View style={styles.mediaRow}>
            <MediaChip label={media.photo ? "Change Image" : "Image"} onPress={async () => {
            const file = await pickReportPhoto({
              title: translate("Add Image"),
              message: translate("Choose how to add an image for this report."),
              uploadLabel: translate("Upload"),
              captureLabel: translate("Capture"),
              cancelLabel: translate("Cancel")
            }).catch(e => Alert.alert(translate("Picker Error"), e?.message || "Could not pick image"));
            if (file) setMedia(prev => ({
              ...prev,
              photo: file
            }));
          }} styles={styles} />
            <MediaChip label={media.audio ? "Change Audio" : "Audio"} onPress={async () => {
            try {
              const file = await pickReportAudio();
              if (file) setMedia(prev => ({
                ...prev,
                audio: file
              }));
            } catch (error) {
              Alert.alert(translate("Picker Error"), error?.message || "Could not pick audio");
            }
          }} disabled={!audioPickerAvailable} styles={styles} />
            <MediaChip label={media.video ? "Change Video" : "Video"} onPress={async () => {
            const file = await pickReportVideo({
              title: translate("Add Video"),
              message: translate("Choose how to add a video for this report."),
              uploadLabel: translate("Upload"),
              captureLabel: translate("Capture"),
              cancelLabel: translate("Cancel")
            }).catch(e => Alert.alert(translate("Picker Error"), e?.message || "Could not pick video"));
            if (file) setMedia(prev => ({
              ...prev,
              video: file
            }));
          }} styles={styles} />
          </View>

          {!audioPickerAvailable ? <MediaMeta label={translate("Audio upload")} value="Rebuild the app once to enable audio attachments." styles={styles} /> : null}
          <MediaMeta label={translate("Selected image")} value={media.photo?.name} styles={styles} />
          <MediaMeta label={translate("Selected audio")} value={media.audio?.name} styles={styles} />
          <MediaMeta label={translate("Selected video")} value={media.video?.name} styles={styles} />

          <TouchableOpacity style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={onSubmit} activeOpacity={0.9} disabled={submitting}>
            {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{translate("Submit Report")}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>;
}
function ReportHero({
  title,
  subtitle,
  onBack,
  styles
}) {
  const translate = useTranslate();
  return <View style={styles.hero}>
      <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.85}>
        <View style={styles.backIconWrap}>
          <Text style={styles.backArrow}>←</Text>
        </View>
        <Text style={styles.backText}>{translate("Back")}</Text>
      </TouchableOpacity>
      <View style={styles.heroGlow} />
      <Text style={styles.heroEyebrow}>{translate("Reporting")}</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
    </View>;
}
function MediaChip({
  label,
  onPress,
  styles,
  disabled = false
}) {
  return <TouchableOpacity style={[styles.mediaChip, disabled && styles.mediaChipDisabled]} onPress={onPress} activeOpacity={0.9} disabled={disabled}>
      <Text style={[styles.mediaChipText, disabled && styles.mediaChipTextDisabled]}>{label}</Text>
    </TouchableOpacity>;
}
function MediaMeta({
  label,
  value,
  styles
}) {
  if (!value) return null;
  return <View style={styles.mediaMetaCard}>
      <Text style={styles.mediaMetaText}>{label}: {value}</Text>
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
      paddingBottom: 140
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
    backArrow: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800"
    },
    backText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700"
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
      letterSpacing: -0.8,
      maxWidth: 540
    },
    heroSubtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 500
    },
    panel: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 10
    },
    fieldLabel: {
      marginBottom: 6,
      color: theme.muted,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.7
    },
    input: {
      minHeight: 48,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.text,
      fontSize: 13
    },
    textarea: {
      minHeight: 110,
      textAlignVertical: "top",
      marginBottom: 12
    },
    textareaSm: {
      minHeight: 90,
      textAlignVertical: "top",
      marginBottom: 12
    },
    secondaryButton: {
      minHeight: 46,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800"
    },
    infoCard: {
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 12
    },
    infoTitle: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800"
    },
    infoText: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    mediaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 14
    },
    mediaChip: {
      flex: 1,
      minHeight: 44,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8
    },
    mediaChipDisabled: {
      opacity: 0.6
    },
    mediaChipText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: "800"
    },
    mediaChipTextDisabled: {
      color: theme.muted
    },
    mediaMetaCard: {
      backgroundColor: theme.surfaceSoft,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10
    },
    mediaMetaText: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    primaryButton: {
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
      opacity: 0.75
    }
  };
}

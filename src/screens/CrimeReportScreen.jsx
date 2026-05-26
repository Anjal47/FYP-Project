import React, { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import {
  createReportRequest,
  isReportAudioPickerAvailable,
  pickReportAudio,
  pickReportPhoto,
  pickReportVideo,
} from "../utils/reportApi";
import { useAppTheme } from "../context/ThemeContext";
import {
  formatPinnedLocation,
  getCurrentPreciseLocation,
  showLocationUnavailableAlert,
} from "../utils/location";
import {
  getLocalizedCopy,
  translateText,
  useResolvedAppLanguage,
} from "../utils/localization";

const DOMESTIC_VIOLENCE_COPY_BY_LANGUAGE = {
  English: {
    heroEyebrow: "Domestic Violence Report",
    title: "Domestic Violence",
    subtitle:
      "Share what happened, where you are safe, and any evidence you can add right now.",
    descriptionTitle: "What happened at home?",
    descriptionPlaceholder:
      "Briefly describe the abuse, threats, injuries, or unsafe situation...",
    locationLabel: "Area / Safe location",
    locationPlaceholder:
      "e.g. Kathmandu, Baneshwor or your current safe place...",
    useCurrentLocation: "Use Current Location",
    pinnedPoint: "Pinned point",
    noPinnedPoint: "No pinpoint selected",
    image: "Image",
    changeImage: "Change Image",
    audio: "Audio",
    changeAudio: "Change Audio",
    audioUnavailable: "Audio Unavailable",
    video: "Video",
    changeVideo: "Change Video",
    audioUpload: "Audio upload",
    audioUnavailableMeta:
      "Rebuild the app once to enable audio attachments.",
    selectedImage: "Selected image",
    selectedAudio: "Selected audio",
    selectedVideo: "Selected video",
    submit: "Submit Report",
    incompleteTitle: "Incomplete",
    incompleteMessage: "Please describe what happened.",
    missingTitle: "Missing",
    missingMessage: "Area or safe location is required.",
    loginRequiredTitle: "Login required",
    loginRequiredMessage: "Token not found. Please login again.",
    reportSubmittedTitle: "Report Submitted",
    reportSummaryCategory: "Category",
    reportSummaryLocation: "Location",
    reportSummaryId: "Report ID",
    done: "Done",
    pickerErrorTitle: "Picker Error",
    pickImageError: "Could not pick image",
    pickAudioError: "Could not pick audio",
    pickVideoError: "Could not pick video",
    unknownError: "Something went wrong",
    locationPermissionTitle: "Allow precise location",
    locationPermissionMessage:
      "AngelTouch needs your location to pin the report exactly.",
    locationPermissionAllow: "Allow",
    locationPermissionDeny: "Deny",
    locationPermissionDeniedMessage: "Location permission was denied",
    locationUnavailableTitle: "Location unavailable",
    locationUnavailableMessage: "We couldn't fetch your current location.",
  },
  Nepali: {
    heroEyebrow: "घरेलु हिंसा रिपोर्ट",
    title: "घरेलु हिंसा",
    subtitle:
      "के भयो, तपाईं कहाँ सुरक्षित हुनुहुन्छ, र अहिले सुरक्षित रूपमा दिन सकिने प्रमाण भए यहाँ राख्नुहोस्।",
    descriptionTitle: "घरभित्र के भयो?",
    descriptionPlaceholder:
      "दुव्र्यवहार, धम्की, चोटपटक वा असुरक्षित अवस्थाबारे छोटकरीमा लेख्नुहोस्...",
    locationLabel: "क्षेत्र / सुरक्षित स्थान",
    locationPlaceholder:
      "जस्तै: काठमाडौं, बानेश्वर वा तपाईंको हालको सुरक्षित स्थान...",
    useCurrentLocation: "हालको स्थान प्रयोग गर्नुहोस्",
    pinnedPoint: "पिन गरिएको स्थान",
    noPinnedPoint: "कुनै पिन गरिएको स्थान छैन",
    image: "तस्बिर",
    changeImage: "तस्बिर परिवर्तन गर्नुहोस्",
    audio: "अडियो",
    changeAudio: "अडियो परिवर्तन गर्नुहोस्",
    audioUnavailable: "अडियो उपलब्ध छैन",
    video: "भिडियो",
    changeVideo: "भिडियो परिवर्तन गर्नुहोस्",
    audioUpload: "अडियो अपलोड",
    audioUnavailableMeta: "अडियो संलग्न गर्न एप फेरि निर्माण गर्नुपर्छ।",
    selectedImage: "छानिएको तस्बिर",
    selectedAudio: "छानिएको अडियो",
    selectedVideo: "छानिएको भिडियो",
    submit: "रिपोर्ट पेश गर्नुहोस्",
    incompleteTitle: "अपूर्ण",
    incompleteMessage: "के भयो भन्ने विवरण लेख्नुहोस्।",
    missingTitle: "अपूर्ण",
    missingMessage: "क्षेत्र वा सुरक्षित स्थान आवश्यक छ।",
    loginRequiredTitle: "लगइन आवश्यक छ",
    loginRequiredMessage: "टोकन भेटिएन। कृपया फेरि लगइन गर्नुहोस्।",
    reportSubmittedTitle: "रिपोर्ट पेश गरियो",
    reportSummaryCategory: "श्रेणी",
    reportSummaryLocation: "स्थान",
    reportSummaryId: "रिपोर्ट आईडी",
    done: "ठीक छ",
    pickerErrorTitle: "फाइल छान्दा त्रुटि",
    pickImageError: "तस्बिर छान्न सकिएन",
    pickAudioError: "अडियो छान्न सकिएन",
    pickVideoError: "भिडियो छान्न सकिएन",
    unknownError: "केही समस्या भयो",
    locationPermissionTitle: "सटीक स्थान अनुमति दिनुहोस्",
    locationPermissionMessage:
      "AngelTouch लाई रिपोर्ट ठीक ठाउँमा पिन गर्न तपाईंको स्थान चाहिन्छ।",
    locationPermissionAllow: "अनुमति दिनुहोस्",
    locationPermissionDeny: "अस्वीकार गर्नुहोस्",
    locationPermissionDeniedMessage: "स्थान अनुमति अस्वीकार गरियो",
    locationUnavailableTitle: "स्थान उपलब्ध भएन",
    locationUnavailableMessage: "तपाईंको हालको स्थान ल्याउन सकिएन।",
  },
};

export default function CrimeReportScreen({ navigation, route }) {
  const { theme, isDark } = useAppTheme();
  const { language, refreshLanguage } = useResolvedAppLanguage();
  const translate = useMemo(() => (value) => translateText(value, language), [language]);
  const styles = useMemo(
    () => StyleSheet.create(createStyles(theme, isDark)),
    [theme, isDark]
  );
  useFocusEffect(useCallback(() => {
    refreshLanguage();
  }, [refreshLanguage]));
  const category = route?.params?.category || "Crime";
  const categoryKey = route?.params?.categoryKey || "";
  const isDomesticViolence =
    categoryKey === "domestic-violence" || category === "Domestic Violence";
  const domesticCopy = useMemo(
    () => getLocalizedCopy(DOMESTIC_VIOLENCE_COPY_BY_LANGUAGE, language),
    [language]
  );
  const reportCopy = isDomesticViolence ? domesticCopy : null;
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [media, setMedia] = useState({
    photo: null,
    audio: null,
    video: null,
  });
  const [geoLocation, setGeoLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const audioPickerAvailable = isReportAudioPickerAvailable();

  const screenTitle = reportCopy
    ? reportCopy.title
    : route?.params?.displayTitle || category;
  const heroEyebrow = reportCopy
    ? reportCopy.heroEyebrow
    : translate("Reporting");
  const heroSubtitle = reportCopy
    ? reportCopy.subtitle
    : translate(
        "The crime reporting form now keeps location, evidence, and details easier to follow."
      );
  const descriptionTitle = reportCopy
    ? reportCopy.descriptionTitle
    : translate("What happened?");
  const descriptionPlaceholder = reportCopy
    ? reportCopy.descriptionPlaceholder
    : translate("Enter description...");
  const locationLabel = reportCopy
    ? reportCopy.locationLabel
    : translate("Area / Location");
  const locationPlaceholder = reportCopy
    ? reportCopy.locationPlaceholder
    : translate("e.g. Kathmandu, Baneshwor...");
  const currentLocationLabel = reportCopy
    ? reportCopy.useCurrentLocation
    : translate("Use Current Location");
  const pinnedPointTitle = reportCopy
    ? reportCopy.pinnedPoint
    : translate("Pinned point");
  const submitLabel = reportCopy ? reportCopy.submit : translate("Submit Report");
  const pickerErrorTitle = reportCopy
    ? reportCopy.pickerErrorTitle
    : translate("Picker Error");
  const photoLabel = media.photo
    ? reportCopy?.changeImage || "Change Image"
    : reportCopy?.image || "Image";
  const audioLabel = media.audio
    ? reportCopy?.changeAudio || "Change Audio"
    : reportCopy?.audio || "Audio";
  const videoLabel = media.video
    ? reportCopy?.changeVideo || "Change Video"
    : reportCopy?.video || "Video";
  const locationCopy = reportCopy
    ? {
        permissionTitle: reportCopy.locationPermissionTitle,
        permissionMessage: reportCopy.locationPermissionMessage,
        permissionAllow: reportCopy.locationPermissionAllow,
        permissionDeny: reportCopy.locationPermissionDeny,
        permissionDeniedMessage: reportCopy.locationPermissionDeniedMessage,
        locationUnavailableTitle: reportCopy.locationUnavailableTitle,
        locationUnavailableMessage: reportCopy.locationUnavailableMessage,
        noPinnedPoint: reportCopy.noPinnedPoint,
      }
    : undefined;

  const getToken = async () => AsyncStorage.getItem("token");

  const onUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const current = await getCurrentPreciseLocation(locationCopy);
      setGeoLocation(current);
      setArea((prev) =>
        String(prev || "").trim()
          ? prev
          : `${current.latitude.toFixed(6)}, ${current.longitude.toFixed(6)}`
      );
    } catch (error) {
      showLocationUnavailableAlert(error, locationCopy);
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async () => {
    try {
      const d = description.trim();
      const a = area.trim();

      if (!d) {
        return Alert.alert(
          reportCopy ? reportCopy.incompleteTitle : translate("Incomplete"),
          reportCopy
            ? reportCopy.incompleteMessage
            : translate("Please enter a description.")
        );
      }

      if (!a) {
        return Alert.alert(
          reportCopy ? reportCopy.missingTitle : translate("Missing"),
          reportCopy
            ? reportCopy.missingMessage
            : translate("Area / location is required.")
        );
      }

      setSubmitting(true);
      const token = await getToken();

      if (!token) {
        return Alert.alert(
          reportCopy
            ? reportCopy.loginRequiredTitle
            : translate("Login required"),
          reportCopy
            ? reportCopy.loginRequiredMessage
            : translate("Token not found. Please login again.")
        );
      }

      const data = await createReportRequest(
        token,
        {
          type: category,
          area: a,
          description: d,
          priority: "Medium",
          geoLocation,
        },
        media
      );

      const reportObj =
        data?.report ||
        data?.data?.report ||
        data?.result?.report ||
        data?.payload?.report ||
        null;
      const reportId =
        reportObj?.reportCode ||
        reportObj?.id ||
        data?.reportCode ||
        data?.id ||
        "N/A";
      const reportSummary = reportCopy
        ? `${reportCopy.reportSummaryCategory}: ${reportCopy.title}\n${reportCopy.reportSummaryLocation}: ${a}\n\n${reportCopy.reportSummaryId}:\n${reportId}`
        : `Category: ${category}\nLocation: ${a}\n\nReport ID:\n${reportId}`;

      Alert.alert(
        reportCopy
          ? reportCopy.reportSubmittedTitle
          : translate("Report Submitted"),
        reportSummary,
        [
          {
            text: reportCopy ? reportCopy.done : translate("Done"),
            onPress: () => {
              setDescription("");
              setArea("");
              setGeoLocation(null);
              setMedia({
                photo: null,
                audio: null,
                video: null,
              });
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        translate("Error"),
        error?.message || (reportCopy ? reportCopy.unknownError : "Something went wrong")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ReportHero
          eyebrow={heroEyebrow}
          title={screenTitle}
          subtitle={heroSubtitle}
          backLabel={translate("Back")}
          onBack={() => navigation.goBack()}
          styles={styles}
          theme={theme}
        />

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{descriptionTitle}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={descriptionPlaceholder}
            placeholderTextColor={theme.muted}
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <Text style={styles.fieldLabel}>{locationLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder={locationPlaceholder}
            placeholderTextColor={theme.muted}
            value={area}
            onChangeText={setArea}
          />

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (locating || submitting) && styles.buttonDisabled,
            ]}
            onPress={onUseCurrentLocation}
            activeOpacity={0.9}
            disabled={locating || submitting}
          >
            {locating ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {currentLocationLabel}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{pinnedPointTitle}</Text>
            <Text style={styles.infoText}>
              {formatPinnedLocation(geoLocation, locationCopy)}
            </Text>
          </View>

          <View style={styles.mediaRow}>
            <MediaChip
              label={photoLabel}
              onPress={async () => {
                const file = await pickReportPhoto({
                  title: translate("Add Image"),
                  message: translate("Choose how to add an image for this report."),
                  uploadLabel: translate("Upload"),
                  captureLabel: translate("Capture"),
                  cancelLabel: translate("Cancel"),
                }).catch((error) =>
                  Alert.alert(
                    pickerErrorTitle,
                    error?.message ||
                      (reportCopy
                        ? reportCopy.pickImageError
                        : "Could not pick image")
                  )
                );
                if (file) {
                  setMedia((prev) => ({
                    ...prev,
                    photo: file,
                  }));
                }
              }}
              styles={styles}
            />
            <MediaChip
              label={audioLabel}
              onPress={async () => {
                const file = await pickReportAudio().catch((error) =>
                  Alert.alert(
                    pickerErrorTitle,
                    error?.message ||
                      (reportCopy
                        ? reportCopy.pickAudioError
                        : "Could not pick audio")
                  )
                );
                if (file) {
                  setMedia((prev) => ({
                    ...prev,
                    audio: file,
                  }));
                }
              }}
              disabled={!audioPickerAvailable}
              styles={styles}
            />
            <MediaChip
              label={videoLabel}
              onPress={async () => {
                const file = await pickReportVideo({
                  title: translate("Add Video"),
                  message: translate("Choose how to add a video for this report."),
                  uploadLabel: translate("Upload"),
                  captureLabel: translate("Capture"),
                  cancelLabel: translate("Cancel"),
                }).catch((error) =>
                  Alert.alert(
                    pickerErrorTitle,
                    error?.message ||
                      (reportCopy
                        ? reportCopy.pickVideoError
                        : "Could not pick video")
                  )
                );
                if (file) {
                  setMedia((prev) => ({
                    ...prev,
                    video: file,
                  }));
                }
              }}
              styles={styles}
            />
          </View>

          {!audioPickerAvailable ? (
            <MediaMeta
              label={reportCopy ? reportCopy.audioUpload : translate("Audio upload")}
              value={
                reportCopy
                  ? reportCopy.audioUnavailableMeta
                  : "Rebuild the app once to enable audio attachments."
              }
              styles={styles}
            />
          ) : null}
          <MediaMeta
            label={reportCopy ? reportCopy.selectedImage : translate("Selected image")}
            value={media.photo?.name}
            styles={styles}
          />
          <MediaMeta
            label={reportCopy ? reportCopy.selectedAudio : translate("Selected audio")}
            value={media.audio?.name}
            styles={styles}
          />
          <MediaMeta
            label={reportCopy ? reportCopy.selectedVideo : translate("Selected video")}
            value={media.video?.name}
            styles={styles}
          />

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={onSubmit}
            activeOpacity={0.9}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{submitLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReportHero({ eyebrow, title, subtitle, backLabel, onBack, styles, theme }) {
  return (
    <View style={styles.hero}>
      <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.85}>
        <View style={styles.backIconWrap}>
          <Icon name="arrow-left" size={18} color={theme.text} />
        </View>
        <Text style={styles.backText}>{backLabel}</Text>
      </TouchableOpacity>
      <View style={styles.heroGlow} />
      <Text style={styles.heroEyebrow}>{eyebrow}</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
    </View>
  );
}

function MediaChip({ label, onPress, styles, disabled = false }) {
  return (
    <TouchableOpacity
      style={[styles.mediaChip, disabled && styles.mediaChipDisabled]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={disabled}
    >
      <Text style={[styles.mediaChipText, disabled && styles.mediaChipTextDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MediaMeta({ label, value, styles }) {
  if (!value) return null;

  return (
    <View style={styles.mediaMetaCard}>
      <Text style={styles.mediaMetaText}>
        {label}: {value}
      </Text>
    </View>
  );
}

function createStyles(theme, isDark) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: 12,
      paddingBottom: 140,
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
        height: 10,
      },
      elevation: 4,
    },
    heroGlow: {
      position: "absolute",
      top: -86,
      right: -60,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: theme.accentSoft,
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 10,
      marginBottom: 18,
    },
    backIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    backText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700",
    },
    heroEyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    heroTitle: {
      marginTop: 8,
      color: theme.text,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "800",
      letterSpacing: -0.8,
      maxWidth: 540,
    },
    heroSubtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 500,
    },
    panel: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 10,
    },
    fieldLabel: {
      marginBottom: 6,
      color: theme.muted,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.7,
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
      fontSize: 13,
    },
    textarea: {
      minHeight: 110,
      textAlignVertical: "top",
      marginBottom: 12,
    },
    secondaryButton: {
      minHeight: 46,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800",
    },
    infoCard: {
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 12,
    },
    infoTitle: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800",
    },
    infoText: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    mediaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 14,
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
      paddingHorizontal: 8,
    },
    mediaChipDisabled: {
      opacity: 0.6,
    },
    mediaChipText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: "800",
    },
    mediaChipTextDisabled: {
      color: theme.muted,
    },
    mediaMetaCard: {
      backgroundColor: theme.surfaceSoft,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
    },
    mediaMetaText: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: 18,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },
    buttonDisabled: {
      opacity: 0.75,
    },
  };
}

// src/screens/CrimeReportScreen.jsx
import React, { useMemo, useState } from "react";
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
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createReportRequest, pickReportPhoto, pickReportVideo } from "../utils/reportApi";
import FloatingHelpChat from "../components/FloatingHelpChat";
import { useAppTheme } from "../context/ThemeContext";
import { createThemedStyles } from "../utils/themeStyles";
import {
  formatPinnedLocation,
  getCurrentPreciseLocation,
  showLocationUnavailableAlert,
} from "../utils/location";

const ORANGE = "#FF7A1A";

export default function CrimeReportScreen({ navigation, route }) {
  const { theme, isDark } = useAppTheme();
  // ✅ hooks ALWAYS at top, no conditional returns above them
  const category = route?.params?.category || "Crime";

  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [media, setMedia] = useState({ photo: null, video: null });
  const [geoLocation, setGeoLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );

  // ✅ safe split (no hooks)
  const words = String(category).split(" ");
  const firstWord = words[0] || "Crime";
  const rest = words.slice(1).join(" ");

  const handleBack = () => navigation.goBack();
  const getToken = async () => AsyncStorage.getItem("token");

  const onPickPhoto = async () => {
    try {
      const file = await pickReportPhoto();
      if (!file) return;
      setMedia((prev) => ({ ...prev, photo: file }));
    } catch (e) {
      Alert.alert("Picker Error", e?.message || "Could not pick image");
    }
  };

  const onPickVideo = async () => {
    try {
      const file = await pickReportVideo();
      if (!file) return;
      setMedia((prev) => ({ ...prev, video: file }));
    } catch (e) {
      Alert.alert("Picker Error", e?.message || "Could not pick video");
    }
  };

  const onUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const current = await getCurrentPreciseLocation();
      setGeoLocation(current);
      setArea((prev) =>
        String(prev || "").trim() ? prev : `${current.latitude.toFixed(6)}, ${current.longitude.toFixed(6)}`
      );
    } catch (e) {
      showLocationUnavailableAlert(e);
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async () => {
    try {
      const d = description.trim();
      const a = area.trim();

      if (!d) return Alert.alert("Incomplete", "Please enter a description.");
      if (!a) return Alert.alert("Missing", "Area / Location is required.");

      setSubmitting(true);

      const token = await getToken();
      if (!token) {
        return Alert.alert("Login required", "Token not found. Please login again.");
      }

      const payload = {
        type: category,     // ✅ Domestic Violence / Harassment / Cyber Crime / Theft etc.
        area: a,            // ✅ required
        description: d,
        priority: "Medium",
        geoLocation,
      };

      const data = await createReportRequest(token, payload, media);

      // ✅ DEBUG (look at Metro console)
      console.log("✅ CREATE REPORT RESPONSE:", JSON.stringify(data, null, 2));

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

      Alert.alert(
        "Report Submitted ✅",
        `Category: ${category}\nLocation: ${a}\n\nYour Report ID:\n${reportId}\n\nKeep this ID safe to check status later.`,
        [
          {
            text: "OK",
            onPress: () => {
              setDescription("");
              setArea("");
              setGeoLocation(null);
              setMedia({ photo: null, video: null });
              navigation.goBack();
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert("Error", e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={handleBack}>
          <Icon name="arrow-left" size={20} color={theme.text} />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}> {firstWord}</Text>
            {rest ? <Text style={styles.headerDot}> {rest}.</Text> : null}
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <TextInput
          style={styles.descriptionInput}
          placeholder="Enter Description..."
          placeholderTextColor={theme.muted}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Area / Location */}
        <View style={styles.locationHeaderRow}>
          <Icon name="map-pin" size={16} color={ORANGE} />
          <Text style={styles.locationLabel}> Area / Location (required)</Text>
        </View>

        <TextInput
          style={styles.locationInput}
          placeholder="e.g. Kathmandu, Baneshwor, near XYZ..."
          placeholderTextColor={theme.muted}
          value={area}
          onChangeText={setArea}
        />

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onUseCurrentLocation}
          disabled={locating || submitting}
          style={[styles.locationPinBtn, (locating || submitting) && { opacity: 0.7 }]}
        >
          {locating ? (
            <View style={styles.locationPinRow}>
              <ActivityIndicator size="small" color={ORANGE} />
              <Text style={styles.locationPinText}>Pinning current location...</Text>
            </View>
          ) : (
            <Text style={styles.locationPinText}>Use Current Location</Text>
          )}
        </TouchableOpacity>

        <View style={styles.pinInfoBox}>
          <Text style={styles.pinInfoTitle}>Pinned point</Text>
          <Text style={styles.pinInfoValue}>{formatPinnedLocation(geoLocation)}</Text>
        </View>

        {/* MEDIA ROW */}
        <View style={styles.mediaRow}>
          <TouchableOpacity
            style={styles.mediaCard}
            onPress={onPickPhoto}
          >
            <Icon name="image" size={20} color={theme.text} />
            <Text style={styles.mediaLabel}>{media.photo ? "Change Image" : "Image"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaCard}
            onPress={() =>
              Alert.alert(
                "Audio picker not ready",
                "Audio upload is supported on the backend, but this app needs a document picker library to choose audio files."
              )
            }
          >
            <Icon name="mic" size={20} color={theme.text} />
            <Text style={styles.mediaLabel}>Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaCard}
            onPress={onPickVideo}
          >
            <Icon name="video" size={20} color={theme.text} />
            <Text style={styles.mediaLabel}>{media.video ? "Change Video" : "Video"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mediaInfoBox}>
          <Text style={styles.mediaInfoTitle}>Optional evidence</Text>
          <Text style={styles.mediaInfoText}>
            Add a photo or video if it helps explain the situation faster. Audio is optional too, but needs a picker integration in this build.
          </Text>
          {!!media.photo?.name && <Text style={styles.mediaPickedText}>Photo: {media.photo.name}</Text>}
          {!!media.video?.name && <Text style={styles.mediaPickedText}>Video: {media.video.name}</Text>}
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.submitButton, submitting && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ActivityIndicator color="#111" />
              <Text style={[styles.submitText, { marginLeft: 10 }]}>Submitting…</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ORANGE SIDE PILL */}
      <FloatingHelpChat bottom={110} fabBottom={145} />

      {/* BOTTOM BAR */}

    </SafeAreaView>
  );
}

const baseStyles = {
  container: { flex: 1, backgroundColor: "#F4F4F4" },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", marginLeft: 8 },
  headerHighlight: { color: ORANGE },
  headerDot: { color: "#111" },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 140 },

  descriptionInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#222",
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  locationHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  locationLabel: { fontSize: 14, fontWeight: "600", color: "#111" },

  locationInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: "#222",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  locationPinBtn: {
    marginTop: -8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 16,
    backgroundColor: "#FFF7F0",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  locationPinRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  locationPinText: { color: ORANGE, fontSize: 13, fontWeight: "800" },
  pinInfoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pinInfoTitle: { fontSize: 13, fontWeight: "800", color: "#111" },
  pinInfoValue: { marginTop: 6, fontSize: 12, color: "#666", lineHeight: 17 },

  mediaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  mediaCard: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  mediaLabel: { fontSize: 12, color: "#555", marginTop: 6 },
  mediaInfoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mediaInfoTitle: { fontSize: 13, fontWeight: "800", color: "#111" },
  mediaInfoText: { marginTop: 6, fontSize: 12, color: "#666", lineHeight: 17 },
  mediaPickedText: { marginTop: 6, fontSize: 12, fontWeight: "700", color: ORANGE },

  submitButton: {
    alignSelf: "center",
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 60,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  submitText: { fontSize: 16, fontWeight: "700", color: "#111" },

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
  },
  tabItem: { paddingHorizontal: 12, paddingVertical: 4 },
};

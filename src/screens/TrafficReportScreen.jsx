// src/screens/TrafficReportScreen.jsx
// ✅ Traffic report submit screen
// ✅ Now shows Report Code after submit + button to jump to TrafficReportStatus (prefilled)

import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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

/* ----------------------------- Screen ----------------------------- */
export default function TrafficReportScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [media, setMedia] = useState({ photo: null, video: null });
  const [geoLocation, setGeoLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );

  const getToken = async () => AsyncStorage.getItem("token");

  const handleBack = () => navigation?.goBack?.();
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
  // ✅ Extract report code from different possible backend response shapes
  const pickReportCode = (resp) => {
    return (
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
      null
    );
  };

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
      setLocation((prev) =>
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
      const l = location.trim();

      if (!d) return Alert.alert("Missing", "Please enter description.");
      if (!l) return Alert.alert("Missing", "Please add location / area.");

      setSubmitting(true);

      const token = await getToken();
      if (!token) {
        setSubmitting(false);
        return Alert.alert("Login required", "Token not found. Please login again.");
      }

      // ✅ Traffic report payload
      const payload = {
        type: "Traffic",
        area: l,
        description: d,
        priority: "Medium",
        geoLocation,
      };

      // ✅ Capture backend response to get report code
      const resp = await createReportRequest(token, payload, media);
      const reportCode = pickReportCode(resp) || "N/A";

      Alert.alert(
        "Submitted ✅",
        `Traffic report sent successfully.\n\nReport Code: ${reportCode}\n\n(Use this code to track status)`,
        [
          {
            text: "Check Status",
            onPress: () => {
              resetForm();
              setMedia({ photo: null, video: null });
              // ✅ Go to Traffic report status screen + prefill
              navigation.navigate("TrafficReportStatus", { reportCode });
            },
          },
          {
            text: "OK",
            style: "cancel",
            onPress: () => {
              resetForm();
              setMedia({ photo: null, video: null });
              handleBack();
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
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Traffic</Text>
            <Text style={styles.titleNormal}>Report.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Enter Description..."
          placeholderTextColor={theme.muted}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.locationLabel}>Add Location</Text>
        <TextInput
          style={styles.locationBox}
          placeholder="Type address / landmark..."
          placeholderTextColor={theme.muted}
          multiline
          value={location}
          onChangeText={setLocation}
        />

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onUseCurrentLocation}
          disabled={locating || submitting}
          style={[styles.locationPinBtn, (locating || submitting) && { opacity: 0.7 }]}
        >
          {locating ? (
            <View style={styles.inlineRow}>
              <ActivityIndicator size="small" color={ORANGE} />
              <Text style={styles.locationPinBtnTxt}>Pinning current location...</Text>
            </View>
          ) : (
            <Text style={styles.locationPinBtnTxt}>Use Current Location</Text>
          )}
        </TouchableOpacity>

        <View style={styles.pinInfoBox}>
          <Text style={styles.pinInfoTitle}>Pinned point</Text>
          <Text style={styles.pinInfoText}>{formatPinnedLocation(geoLocation)}</Text>
        </View>

        <View style={styles.mediaRow}>
          <MediaButton
            label={media.photo ? "Change Image" : "Image"}
            onPress={onPickPhoto}
            styles={styles}
          />
          <MediaButton
            label="Audio"
            styles={styles}
            onPress={() =>
              Alert.alert(
                "Audio picker not ready",
                "Audio upload is supported on the backend, but this app needs a document picker library to choose audio files."
              )
            }
          />
          <MediaButton
            label={media.video ? "Change Video" : "Video"}
            onPress={onPickVideo}
            styles={styles}
          />
        </View>

        <View style={styles.mediaInfoBox}>
          <Text style={styles.mediaInfoTitle}>Optional evidence</Text>
          <Text style={styles.mediaInfoText}>
            You can submit the report without media, but photo or video evidence helps with review.
          </Text>
          {!!media.photo?.name && <Text style={styles.mediaPickedText}>Photo: {media.photo.name}</Text>}
          {!!media.video?.name && <Text style={styles.mediaPickedText}>Video: {media.video.name}</Text>}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onSubmit}
          disabled={submitting}
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
        >
          {submitting ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submitTxt}>Submitting…</Text>
            </View>
          ) : (
            <Text style={styles.submitTxt}>Submit Report</Text>
          )}
        </TouchableOpacity>

        {/* Optional: small hint below button */}
        <Text style={styles.hint}>
          After submission, you’ll receive a Report Code to track your traffic report status.
        </Text>
      </View>

      {/* ORANGE SIDE PILL */}
      <FloatingHelpChat bottom={110} fabBottom={145} />

      {/* BOTTOM TABS */}

    </SafeAreaView>
  );
}

/* ----------------------------- Components ----------------------------- */
function MediaButton({ label, onPress, styles }) {
  return (
    <TouchableOpacity style={styles.mediaButton} onPress={onPress} activeOpacity={0.9}>
      <Text style={styles.mediaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ----------------------------- Styles ----------------------------- */
const baseStyles = {
  container: { flex: 1, backgroundColor: "#F4F4F4" },

  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  titleHighlight: { color: ORANGE },
  titleNormal: { color: "#111" },

  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },

  descriptionInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginBottom: 26,
    minHeight: 120,
    textAlignVertical: "top",
  },

  locationLabel: { fontSize: 15, fontWeight: "600", color: "#111", marginBottom: 10 },

  locationBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
    minHeight: 140,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginBottom: 28,
  },

  mediaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  locationPinBtn: {
    marginTop: -12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 16,
    backgroundColor: "#FFF7F0",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  locationPinBtnTxt: { color: ORANGE, fontSize: 13, fontWeight: "800" },
  pinInfoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pinInfoTitle: { fontSize: 13, fontWeight: "800", color: "#111" },
  pinInfoText: { marginTop: 6, fontSize: 12, color: "#666", lineHeight: 17 },

  mediaButton: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  mediaLabel: { fontSize: 13, fontWeight: "600", color: "#111" },
  mediaInfoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mediaInfoTitle: { fontSize: 13, fontWeight: "800", color: "#111" },
  mediaInfoText: { marginTop: 6, fontSize: 12, color: "#666", lineHeight: 17 },
  mediaPickedText: { marginTop: 6, fontSize: 12, fontWeight: "700", color: ORANGE },

  submitBtn: {
    marginTop: 6,
    backgroundColor: ORANGE,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },

  hint: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
    paddingHorizontal: 10,
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

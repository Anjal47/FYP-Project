import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createReportRequest, pickReportPhoto, pickReportVideo } from "../utils/reportApi";
import {
  formatPinnedLocation,
  getCurrentPreciseLocation,
  showLocationUnavailableAlert,
} from "../utils/location";

const ORANGE = "#FF7A1A";

/**
 * Create a municipality-related report:
 * - Waste Management
 * - Road Complaint
 */
export default function MunicipalityReportCreateScreen({ navigation, route }) {
  const initialCategory = route?.params?.initialCategory || route?.params?.category;

  const [category, setCategory] = useState(initialCategory || "Waste Management");

  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [media, setMedia] = useState({ photo: null, video: null });
  const [geoLocation, setGeoLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const typeValue = useMemo(() => {
    if (category === "Road Complaint") return "road complaint";
    return "waste management";
  }, [category]);

  const canSubmit = useMemo(() => {
    return String(area || "").trim().length >= 2;
  }, [area]);

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

  const chip = (label, active, onPress, iconName) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[s.chip, active ? s.chipActive : s.chipIdle]}
    >
      <Ionicons
        name={iconName}
        size={16}
        color={active ? "#fff" : ORANGE}
        style={{ marginRight: 8 }}
      />
      <Text style={[s.chipText, active ? s.chipTextActive : s.chipTextIdle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const submit = async () => {
    if (!canSubmit) {
      Alert.alert("Missing info", "Please enter a valid area/location.");
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found. Please login again.");

      const payload = {
        type: typeValue,
        area: String(area).trim(),
        description: String(description || "").trim(),
        priority,
        geoLocation,
      };

      const out = await createReportRequest(token, payload, media);

      Alert.alert(
        "Submitted ✅",
        `Your report has been created.\n\nReport Code: ${out?.report?.reportCode || "N/A"}`,
        [
          {
            text: "OK",
            onPress: () => {
              setMedia({ photo: null, video: null });
              setGeoLocation(null);
              navigation.goBack?.();
            },
          },
          {
            text: "View My Reports",
            onPress: () =>
              navigation.navigate?.(typeValue === "waste management" ? "WasteReportStatus" : "ReportStatus"),
          },
        ]
      );
    } catch (e) {
      Alert.alert("Submit failed", e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack?.()}
            activeOpacity={0.85}
            style={s.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={s.title}>Municipality Report</Text>
            <Text style={s.subtitle}>Waste Management / Road Complaint</Text>
          </View>

          <View style={s.badge}>
            <Ionicons name="shield-checkmark" size={16} color={ORANGE} />
            <Text style={s.badgeText}>Official</Text>
          </View>
        </View>

        {/* Category */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Category</Text>
          <Text style={s.cardHint}>
            Select what you are reporting so the municipality officer receives it correctly.
          </Text>

          <View style={s.rowWrap}>
            {chip("Waste Management", category === "Waste Management", () => setCategory("Waste Management"), "trash")}
            {chip("Road Complaint", category === "Road Complaint", () => setCategory("Road Complaint"), "alert-circle")}
          </View>

          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Backend type:</Text>
            <Text style={s.metaValue}>{typeValue}</Text>
          </View>
        </View>

        {/* Area */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Area / Location</Text>
          <Text style={s.cardHint}>Example: “New Road, Ward 10” or “Near City Hospital”</Text>

          <View style={s.inputWrap}>
            <Ionicons name="location-outline" size={18} color="#9A9A9A" />
            <TextInput
              value={area}
              onChangeText={setArea}
              placeholder="Enter area..."
              placeholderTextColor="#9A9A9A"
              style={s.input}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onUseCurrentLocation}
            disabled={locating || submitting}
            style={[s.locationPinBtn, (locating || submitting) && { opacity: 0.7 }]}
          >
            {locating ? (
              <View style={s.locationPinRow}>
                <ActivityIndicator size="small" color={ORANGE} />
                <Text style={s.locationPinText}>Pinning current location...</Text>
              </View>
            ) : (
              <Text style={s.locationPinText}>Use Current Location</Text>
            )}
          </TouchableOpacity>

          <View style={s.pinInfoBox}>
            <Text style={s.pinInfoTitle}>Pinned point</Text>
            <Text style={s.pinInfoValue}>{formatPinnedLocation(geoLocation)}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Description (optional)</Text>
          <Text style={s.cardHint}>
            Give details like landmark, what happened, and any safety risk.
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Write a short description..."
            placeholderTextColor="#9A9A9A"
            multiline
            style={s.textarea}
          />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Media Evidence (optional)</Text>
          <Text style={s.cardHint}>
            Attach a photo or video if it helps explain the problem. Audio support is prepared on the backend but still needs a picker in the app.
          </Text>

          <View style={s.rowWrap}>
            {chip(media.photo ? "Change Photo" : "Photo", false, onPickPhoto, "image-outline")}
            {chip(
              "Audio",
              false,
              () =>
                Alert.alert(
                  "Audio picker not ready",
                  "Audio upload is supported on the backend, but this app needs a document picker library to choose audio files."
                ),
              "mic-outline"
            )}
            {chip(media.video ? "Change Video" : "Video", false, onPickVideo, "videocam-outline")}
          </View>

          {!!media.photo?.name && (
            <View style={s.mediaMetaRow}>
              <Ionicons name="checkmark-circle" size={16} color={ORANGE} />
              <Text style={s.mediaMetaText}>Photo: {media.photo.name}</Text>
            </View>
          )}
          {!!media.video?.name && (
            <View style={s.mediaMetaRow}>
              <Ionicons name="checkmark-circle" size={16} color={ORANGE} />
              <Text style={s.mediaMetaText}>Video: {media.video.name}</Text>
            </View>
          )}
        </View>

        {/* Priority */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Priority</Text>
          <Text style={s.cardHint}>High = urgent or safety risk</Text>

          <View style={s.rowWrap}>
            {chip("Low", priority === "Low", () => setPriority("Low"), "leaf-outline")}
            {chip("Medium", priority === "Medium", () => setPriority("Medium"), "radio-button-on-outline")}
            {chip("High", priority === "High", () => setPriority("High"), "flame-outline")}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={submit}
          disabled={submitting || !canSubmit}
          style={[s.submitBtn, (submitting || !canSubmit) && { opacity: 0.65 }]}
        >
          {submitting ? (
            <View style={s.submitRow}>
              <ActivityIndicator color="#fff" />
              <Text style={s.submitText}>Submitting...</Text>
            </View>
          ) : (
            <View style={s.submitRow}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={s.submitText}>Send to Municipality</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={s.footerNote}>
          Tip: You can track status later from “My Reports” using your Report Code.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F4F4" },
  page: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  title: { color: "#111", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "#777", fontSize: 12, marginTop: 2 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#FFE2C6",
  },
  badgeText: { marginLeft: 6, fontSize: 12, fontWeight: "800", color: ORANGE },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardTitle: { color: "#111", fontSize: 14, fontWeight: "800" },
  cardHint: { color: "#777", fontSize: 12, marginTop: 6, lineHeight: 16 },

  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  chipIdle: { backgroundColor: "#FFF4E8", borderColor: "#FFE2C6" },
  chipText: { fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: "#fff" },
  chipTextIdle: { color: "#111" },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  metaLabel: { color: "#777", fontSize: 12, marginRight: 8, fontWeight: "700" },
  metaValue: { color: "#111", fontSize: 12, fontWeight: "900" },
  mediaMetaRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  mediaMetaText: { color: "#777", fontSize: 12, fontWeight: "800", flex: 1 },

  inputWrap: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: { flex: 1, color: "#111", fontSize: 14, fontWeight: "700" },
  locationPinBtn: {
    marginTop: 12,
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
    backgroundColor: "#FFF9F3",
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FFE2C6",
  },
  pinInfoTitle: { color: "#111", fontSize: 13, fontWeight: "800" },
  pinInfoValue: { marginTop: 6, color: "#666", fontSize: 12, lineHeight: 17 },

  textarea: {
    marginTop: 10,
    minHeight: 110,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#111",
    textAlignVertical: "top",
    fontSize: 13,
    fontWeight: "700",
  },

  submitBtn: {
    marginTop: 16,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ORANGE,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "900" },

  footerNote: {
    marginTop: 12,
    color: "#777",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});

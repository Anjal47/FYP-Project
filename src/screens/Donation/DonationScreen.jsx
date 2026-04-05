import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Image,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import FloatingHelpChat from "../../components/FloatingHelpChat";
import { useAppTheme } from "../../context/ThemeContext";
import { createThemedStyles } from "../../utils/themeStyles";

const API_BASE_URL = "http://10.0.2.2:5000/api";
const ORANGE = "#FF7A1A";

const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case "Urgent":
      return "#FF3B30";
    case "Medium":
      return ORANGE;
    default:
      return "#777";
  }
};

const getUrgencyBg = (urgency) => {
  switch (urgency) {
    case "Urgent":
      return "#FFE5E2";
    case "Medium":
      return "#FFF3E8";
    default:
      return "#F2F2F2";
  }
};

const normalizePickedFile = (asset, fallbackName) => {
  if (!asset?.uri) return null;

  return {
    uri: asset.uri,
    type: asset.type || "application/octet-stream",
    name: asset.fileName || fallbackName,
  };
};

export default function DonationScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const [currentView, setCurrentView] = useState("home");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [donationData, setDonationData] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    contact: "",
    location: "",
    helpType: "Medical",
    description: "",
    amountNeeded: "",
    urgency: "Medium",
  });

  const [files, setFiles] = useState({
    qrImage: null,
    proofImage: null,
    proofVideo: null,
  });
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );

  const resetForm = () => {
    setFormData({
      fullName: "",
      contact: "",
      location: "",
      helpType: "Medical",
      description: "",
      amountNeeded: "",
      urgency: "Medium",
    });

    setFiles({
      qrImage: null,
      proofImage: null,
      proofVideo: null,
    });
  };

  const getToken = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      throw new Error("Missing token");
    }
    return token;
  };

  const goHome = () => navigation.navigate("Home");

  const fetchApprovedDonations = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/donations/approved`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to load donations");
      }

      setDonationData(Array.isArray(data?.donations) ? data.donations : []);
    } catch (error) {
      Alert.alert("Error", error.message || "Could not load donations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovedDonations();
  }, [fetchApprovedDonations]);

  const pickImage = async (field) => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert("Picker Error", result.errorMessage || "Could not pick image");
        return;
      }

      const asset = result.assets?.[0];
      const file = normalizePickedFile(asset, `${field}.jpg`);

      if (!file) {
        Alert.alert("Error", "Invalid image selected");
        return;
      }

      setFiles((prev) => ({
        ...prev,
        [field]: file,
      }));
    } catch (error) {
      Alert.alert("Error", "Could not open image picker");
    }
  };

  const pickVideo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "video",
        selectionLimit: 1,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert("Picker Error", result.errorMessage || "Could not pick video");
        return;
      }

      const asset = result.assets?.[0];
      const file = normalizePickedFile(asset, "proof-video.mp4");

      if (!file) {
        Alert.alert("Error", "Invalid video selected");
        return;
      }

      setFiles((prev) => ({
        ...prev,
        proofVideo: file,
      }));
    } catch (error) {
      Alert.alert("Error", "Could not open video picker");
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "Full Name is required";
    if (!formData.contact.trim()) return "Contact Info is required";
    if (!formData.location.trim()) return "Location is required";
    if (!formData.helpType.trim()) return "Type of Help Needed is required";
    if (!formData.description.trim()) return "Description is required";

    const amount = Number(formData.amountNeeded);
    if (!Number.isFinite(amount) || amount <= 0) {
      return "Amount Needed must be a valid number greater than 0";
    }

    if (!["Low", "Medium", "Urgent"].includes(formData.urgency.trim())) {
      return "Urgency must be Low, Medium, or Urgent";
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      Alert.alert("Validation Error", validationError);
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();

      const body = new FormData();
      body.append("fullName", formData.fullName.trim());
      body.append("contact", formData.contact.trim());
      body.append("location", formData.location.trim());
      body.append("helpType", formData.helpType.trim());
      body.append("description", formData.description.trim());
      body.append("amountNeeded", String(formData.amountNeeded).trim());
      body.append("urgency", formData.urgency.trim());

      if (files.qrImage) body.append("qrImage", files.qrImage);
      if (files.proofImage) body.append("proofImage", files.proofImage);
      if (files.proofVideo) body.append("proofVideo", files.proofVideo);

      const response = await fetch(`${API_BASE_URL}/donations`, {
        method: "POST",
        body,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to submit donation request");
      }

      Alert.alert("Success", "Donation request submitted for admin approval");
      resetForm();
      setCurrentView("home");
      fetchApprovedDonations();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const renderSelectedFileText = (label, file) => (
    <Text style={styles.selectedFileText} numberOfLines={1}>
      {file ? `${label}: ${file.name}` : `${label}: none selected`}
    </Text>
  );

  return (
    <SafeAreaView style={styles.page}>
      {currentView === "form" ? (
        <>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={goHome} activeOpacity={0.9}>
              <Icon name="arrow-left" size={20} color={theme.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              <Text style={styles.headerTitleHighlight}> Donation</Text>
              <Text style={styles.headerTitleNormal}> Charity.</Text>
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>Share your need with the community.</Text>

            <View style={styles.formCard}>
              <TextInput
                placeholder="Full Name"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                style={styles.input}
                placeholderTextColor={theme.muted}
              />

              <TextInput
                placeholder="Contact Info"
                value={formData.contact}
                onChangeText={(text) => setFormData({ ...formData, contact: text })}
                style={styles.input}
                placeholderTextColor={theme.muted}
              />

              <TextInput
                placeholder="Location"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                style={styles.input}
                placeholderTextColor={theme.muted}
              />

              <TextInput
                placeholder="Type of Help Needed"
                value={formData.helpType}
                onChangeText={(text) => setFormData({ ...formData, helpType: text })}
                style={styles.input}
                placeholderTextColor={theme.muted}
              />

              <TextInput
                placeholder="Description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                style={[styles.input, styles.textArea]}
                placeholderTextColor={theme.muted}
                multiline
              />

              <TextInput
                placeholder="Amount Needed"
                value={formData.amountNeeded}
                onChangeText={(text) => setFormData({ ...formData, amountNeeded: text })}
                style={styles.input}
                placeholderTextColor={theme.muted}
                keyboardType="numeric"
              />

              <TextInput
                placeholder="Urgency (Low / Medium / Urgent)"
                value={formData.urgency}
                onChangeText={(text) => setFormData({ ...formData, urgency: text })}
                style={styles.input}
                placeholderTextColor={theme.muted}
              />

              <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage("qrImage")} activeOpacity={0.9}>
                <Text style={styles.uploadText}>{files.qrImage ? "Change QR Image" : "Pick QR Image"}</Text>
              </TouchableOpacity>
              {renderSelectedFileText("QR", files.qrImage)}

              <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage("proofImage")} activeOpacity={0.9}>
                <Text style={styles.uploadText}>
                  {files.proofImage ? "Change Proof Image" : "Pick Proof Image"}
                </Text>
              </TouchableOpacity>
              {renderSelectedFileText("Proof Image", files.proofImage)}

              <TouchableOpacity style={styles.uploadBox} onPress={pickVideo} activeOpacity={0.9}>
                <Text style={styles.uploadText}>
                  {files.proofVideo ? "Change Proof Video" : "Pick Proof Video"}
                </Text>
              </TouchableOpacity>
              {renderSelectedFileText("Proof Video", files.proofVideo)}

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.92}
              >
                <Text style={styles.submitButtonText}>{submitting ? "Submitting..." : "Submit Request"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <TouchableOpacity style={styles.heroBackButton} onPress={goHome} activeOpacity={0.9}>
                <Icon name="arrow-left" size={20} color="#111" />
              </TouchableOpacity>
            </View>

            <Text style={styles.pageTitle}>
              <Text style={styles.pageTitleHighlight}> Donate</Text>
              <Text style={styles.pageTitleNormal}> / Charity.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Support verified requests or create your own appeal for admin approval.
            </Text>

            <TouchableOpacity
              style={styles.askCard}
              onPress={() => setCurrentView("form")}
              activeOpacity={0.92}
            >
              <View style={styles.askCopy}>
                <Text style={styles.askTitle}>Ask for Charity</Text>
                <Text style={styles.askSubtitle}>
                  Share your need with contact details, proof files, and a quick summary.
                </Text>
              </View>

              <View style={styles.askArrowWrap}>
                <Icon name="arrow-right" size={18} color={ORANGE} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Approved Requests</Text>
            <Text style={styles.sectionMeta}>{donationData.length} live</Text>
          </View>

          <View style={styles.listWrap}>
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={styles.loadingText}>Loading approved donations...</Text>
              </View>
            ) : donationData.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No approved donations yet</Text>
                <Text style={styles.emptySubtitle}>Approved charity requests will show up here once admins verify them.</Text>
              </View>
            ) : (
              donationData.map((item) => (
                <View key={item._id || item.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.helpType || "Donation Request"}</Text>
                  <Text style={styles.cardLocation}>{item.location}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>

                  <View style={styles.cardAmounts}>
                    <Text style={styles.amountText}>Need: Rs. {item.amountNeeded}</Text>
                    <Text style={styles.amountText}>{item.fullName}</Text>
                  </View>

                  {!!item.proofImage && (
                    <Image source={{ uri: item.proofImage }} style={styles.previewImage} resizeMode="cover" />
                  )}

                  <View style={styles.cardBottom}>
                    <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyBg(item.urgency) }]}>
                      <Text style={[styles.urgencyText, { color: getUrgencyColor(item.urgency) }]}>{item.urgency}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.donateButton}
                      onPress={() => navigation.navigate("DonateNow", { donation: item })}
                      activeOpacity={0.92}
                    >
                      <Text style={styles.donateButtonText}>Donate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
      <FloatingHelpChat bottom={110} fabBottom={145} />
    </SafeAreaView>
  );
}

const baseStyles = {
  page: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
    paddingTop: 18,
  },
  heroCard: {
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginTop: 16,
  },
  pageTitleHighlight: {
    color: ORANGE,
  },
  pageTitleNormal: {
    color: "#111",
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    color: "#555",
    fontWeight: "600",
    marginBottom: 18,
  },
  askCard: {
    backgroundColor: ORANGE,
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  askCopy: {
    flex: 1,
    paddingRight: 12,
  },
  askTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  askSubtitle: {
    color: "#fff",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  askArrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF3E8",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  sectionMeta: {
    fontSize: 12,
    color: "#777",
    fontWeight: "700",
  },
  listWrap: {
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    elevation: 3,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111",
  },
  cardLocation: {
    marginTop: 6,
    marginBottom: 10,
    color: "#777",
    fontSize: 14,
  },
  cardDesc: {
    marginBottom: 14,
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
  },
  cardAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
    flexWrap: "wrap",
  },
  amountText: {
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  urgencyText: {
    fontSize: 13,
    fontWeight: "700",
  },
  donateButton: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  donateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerTitleHighlight: {
    color: ORANGE,
  },
  headerTitleNormal: {
    color: "#111",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    elevation: 3,
    gap: 8,
  },
  input: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2F2F2",
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    color: "#111",
    marginBottom: 14,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: ORANGE,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    backgroundColor: "#FFF3E8",
    marginBottom: 6,
  },
  uploadText: {
    color: ORANGE,
    fontWeight: "600",
  },
  selectedFileText: {
    color: "#555",
    fontSize: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  submitButton: {
    width: "100%",
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  emptySubtitle: {
    marginTop: 8,
    color: "#666",
    lineHeight: 20,
  },
  previewImage: {
    width: "100%",
    height: 170,
    borderRadius: 12,
    marginBottom: 14,
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
};

import React, { useCallback, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../../context/ThemeContext";
import { useTranslate } from "../../utils/localization";

const API_BASE_URL = "http://10.0.2.2:5000/api";

const normalizePickedFile = (asset, fallbackName) => {
  if (!asset?.uri) return null;
  return {
    uri: asset.uri,
    type: asset.type || "application/octet-stream",
    name: asset.fileName || fallbackName
  };
};

function getDonationLifecycle(item) {
  if (item?.isClosed) return "Closed";
  if (item?.status === "rejected") return "Rejected";
  if (item?.isFunded) return "Funded";
  if (item?.status === "approved") return "Approved";
  return "Pending";
}

export default function DonationScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const [currentView, setCurrentView] = useState("home");
  const [activeTab, setActiveTab] = useState("approved");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState("");
  const [myRequestsEnabled, setMyRequestsEnabled] = useState(true);
  const [approvedDonations, setApprovedDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    contact: "",
    location: "",
    helpType: "Medical",
    description: "",
    amountNeeded: "",
    urgency: "Medium"
  });
  const [files, setFiles] = useState({
    qrImage: null,
    proofImage: null,
    proofVideo: null
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      contact: "",
      location: "",
      helpType: "Medical",
      description: "",
      amountNeeded: "",
      urgency: "Medium"
    });
    setFiles({
      qrImage: null,
      proofImage: null,
      proofVideo: null
    });
  };

  const getToken = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Missing token");
    return token;
  };

  const authGet = useCallback(async path => {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      const error = new Error(data?.message || "Request failed");
      error.status = response.status;
      throw error;
    }
    return data;
  }, []);

  const authGetOptional = useCallback(async path => {
    try {
      const data = await authGet(path);
      return {
        ok: true,
        data
      };
    } catch (error) {
      return {
        ok: false,
        error
      };
    }
  }, [authGet]);

  const loadAll = useCallback(async ({
    spinner = false
  } = {}) => {
    try {
      if (spinner) setLoading(true);
      const [approvedResult, mineResult] = await Promise.all([authGetOptional("/donations/approved"), authGetOptional("/donations/mine")]);
      if (!approvedResult.ok) throw approvedResult.error;
      const approvedRes = approvedResult.data;
      setApprovedDonations(Array.isArray(approvedRes?.donations) ? approvedRes.donations : []);

      if (mineResult.ok) {
        setMyRequestsEnabled(true);
        setMyRequests(Array.isArray(mineResult.data?.donations) ? mineResult.data.donations : []);
      } else {
        if (mineResult.error?.status === 404) {
          setMyRequestsEnabled(false);
          setMyRequests([]);
          setActiveTab(prev => prev === "mine" ? "approved" : prev);
        } else {
          setMyRequestsEnabled(true);
          setMyRequests([]);
          Alert.alert(translate("Error"), mineResult.error?.message || "Could not load your donation requests");
        }
      }
    } catch (error) {
      Alert.alert(translate("Error"), error.message || "Could not load donations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authGetOptional, translate]);

  useFocusEffect(useCallback(() => {
    loadAll({
      spinner: true
    });
  }, [loadAll]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll({
      spinner: false
    });
  };

  const pickImage = async field => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1,
        quality: 0.8
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert(translate("Picker Error"), result.errorMessage || "Could not pick image");
        return;
      }
      const asset = result.assets?.[0];
      const file = normalizePickedFile(asset, `${field}.jpg`);
      if (!file) {
        Alert.alert(translate("Error"), translate("Invalid image selected"));
        return;
      }
      setFiles(prev => ({
        ...prev,
        [field]: file
      }));
    } catch {
      Alert.alert(translate("Error"), translate("Could not open image picker"));
    }
  };

  const pickVideo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "video",
        selectionLimit: 1
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert(translate("Picker Error"), result.errorMessage || "Could not pick video");
        return;
      }
      const asset = result.assets?.[0];
      const file = normalizePickedFile(asset, "proof-video.mp4");
      if (!file) {
        Alert.alert(translate("Error"), translate("Invalid video selected"));
        return;
      }
      setFiles(prev => ({
        ...prev,
        proofVideo: file
      }));
    } catch {
      Alert.alert(translate("Error"), translate("Could not open video picker"));
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "Full Name is required";
    if (!formData.contact.trim()) return "Contact info is required";
    if (!formData.location.trim()) return "Location is required";
    if (!formData.helpType.trim()) return "Type of help is required";
    if (!formData.description.trim()) return "Description is required";
    const amount = Number(formData.amountNeeded);
    if (!Number.isFinite(amount) || amount <= 0) return "Amount Needed must be greater than 0";
    if (!["Low", "Medium", "Urgent"].includes(formData.urgency.trim())) return "Urgency must be Low, Medium, or Urgent";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert(translate("Validation Error"), validationError);
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
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || "Failed to submit donation request");

      Alert.alert(translate("Success"), translate("Donation request submitted for admin approval"));
      resetForm();
      setActiveTab(myRequestsEnabled ? "mine" : "approved");
      setCurrentView("home");
      await loadAll({
        spinner: false
      });
    } catch (error) {
      Alert.alert(translate("Error"), error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseRequest = item => {
    Alert.alert(translate("Close Request"), translate("This will remove the request from the public donation feed. Continue?"), [{
      text: translate("Cancel"),
      style: "cancel"
    }, {
      text: translate("Close"),
      style: "destructive",
      onPress: async () => {
        try {
          setClosingId(item._id || item.id || "");
          const token = await getToken();
          const response = await fetch(`${API_BASE_URL}/donations/${item._id || item.id}/close`, {
            method: "PATCH",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`
            }
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data?.ok) throw new Error(data?.message || "Failed to close donation request");
          await loadAll({
            spinner: false
          });
          Alert.alert(translate("Updated"), translate("Donation request closed."));
        } catch (error) {
          Alert.alert(translate("Error"), error.message || "Failed to close request");
        } finally {
          setClosingId("");
        }
      }
    }]);
  };

  const renderFileText = (label, file) => <Text style={styles.fileText} numberOfLines={1}>
      {file ? `${label}: ${file.name}` : `${label}: none selected`}
    </Text>;

  const renderProgressBlock = item => <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {
        width: `${Math.min(Number(item.progressPercent || 0), 100)}%`,
        backgroundColor: item.isFunded ? theme.success || theme.accentStrong : theme.accentStrong
      }]} />
      </View>
      <Text style={styles.progressText}>{translate("Need Rs.")}{item.amountNeeded} | {translate("Raised Rs.")}{item.raisedAmount} | {translate("Remaining Rs.")}{item.remainingAmount}</Text>
      <Text style={styles.progressMeta}>{translate("Donors")}: {item.donorCount} | {Number(item.progressPercent || 0)}%</Text>
    </View>;

  const renderApprovedCard = item => {
    const lifecycle = getDonationLifecycle(item);
    const donateDisabled = item.isFunded || item.isClosed;
    return <View key={item._id || item.id} style={styles.requestCard}>
        <View style={styles.requestTop}>
          <View style={styles.requestCopy}>
            <Text style={styles.requestTitle}>{item.helpType || "Donation Request"}</Text>
            <Text style={styles.requestMeta}>{item.location} | {item.fullName}</Text>
          </View>
          <StatusBadge label={translate(lifecycle)} tone={lifecycle === "Funded" ? "success" : "default"} styles={styles} theme={theme} />
        </View>

        <Text style={styles.requestDescription}>{item.description}</Text>
        {renderProgressBlock(item)}
        {!!item.proofImage && <Image source={{
        uri: item.proofImage
      }} style={styles.previewImage} resizeMode="cover" />}

        <View style={styles.requestFooter}>
          <Text style={styles.footerHint}>{item.contact || translate("Contact not provided")}</Text>
          <TouchableOpacity style={[styles.primaryMiniButton, donateDisabled && styles.buttonDisabled]} onPress={() => !donateDisabled && navigation.navigate("DonateNow", {
          donation: item
        })} activeOpacity={0.9} disabled={donateDisabled}>
            <Text style={styles.primaryMiniButtonText}>{donateDisabled ? translate("Goal Reached") : translate("Donate")}</Text>
          </TouchableOpacity>
        </View>
      </View>;
  };

  const renderMyRequestCard = item => {
    const lifecycle = getDonationLifecycle(item);
    const canClose = item.status === "approved" && !item.isClosed;
    const isClosing = closingId === (item._id || item.id);
    return <View key={item._id || item.id} style={styles.requestCard}>
        <View style={styles.requestTop}>
          <View style={styles.requestCopy}>
            <Text style={styles.requestTitle}>{item.helpType || translate("Donation Request")}</Text>
            <Text style={styles.requestMeta}>{item.location} | {item.fullName}</Text>
          </View>
          <StatusBadge label={translate(lifecycle)} tone={lifecycle === "Rejected" ? "danger" : lifecycle === "Funded" ? "success" : lifecycle === "Closed" ? "muted" : "default"} styles={styles} theme={theme} />
        </View>

        <Text style={styles.requestDescription}>{item.description}</Text>
        {renderProgressBlock(item)}

        {!!item.adminNotes && <View style={styles.noteCard}>
            <Text style={styles.noteLabel}>{translate("Verification note")}</Text>
            <Text style={styles.noteText}>{item.adminNotes}</Text>
          </View>}

        <View style={styles.metaGrid}>
          <InfoMini label={translate("Urgency")} value={item.urgency || "Medium"} styles={styles} />
          <InfoMini label={translate("Status")} value={translate(lifecycle)} styles={styles} />
        </View>

        {canClose ? <TouchableOpacity style={[styles.secondaryButton, isClosing && styles.buttonDisabled]} onPress={() => handleCloseRequest(item)} activeOpacity={0.9} disabled={isClosing}>
            <Text style={styles.secondaryButtonText}>{isClosing ? translate("Closing...") : translate("Close Request")}</Text>
          </TouchableOpacity> : null}
      </View>;
  };

  const listContent = currentView === "form" ? <View style={styles.panel}>
      <Text style={styles.sectionTitle}>{translate("Share your need")}</Text>
      <Field label={translate("Full Name")} value={formData.fullName} onChangeText={text => setFormData({
    ...formData,
    fullName: text
  })} styles={styles} theme={theme} />
      <Field label={translate("Contact Info")} value={formData.contact} onChangeText={text => setFormData({
    ...formData,
    contact: text
  })} styles={styles} theme={theme} />
      <Field label={translate("Location")} value={formData.location} onChangeText={text => setFormData({
    ...formData,
    location: text
  })} styles={styles} theme={theme} />
      <Field label={translate("Type of Help Needed")} value={formData.helpType} onChangeText={text => setFormData({
    ...formData,
    helpType: text
  })} styles={styles} theme={theme} />
      <Field label={translate("Description")} value={formData.description} onChangeText={text => setFormData({
    ...formData,
    description: text
  })} multiline styles={styles} theme={theme} />
      <Field label={translate("Amount Needed")} value={formData.amountNeeded} onChangeText={text => setFormData({
    ...formData,
    amountNeeded: text
  })} keyboardType="numeric" styles={styles} theme={theme} />
      <Field label={translate("Urgency")} value={formData.urgency} onChangeText={text => setFormData({
    ...formData,
    urgency: text
  })} styles={styles} theme={theme} />

      <Text style={styles.fieldLabel}>{translate("Uploads")}</Text>
      <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage("qrImage")} activeOpacity={0.9}>
        <Text style={styles.uploadCardText}>{files.qrImage ? translate("Change QR Image") : translate("Pick QR Image")}</Text>
      </TouchableOpacity>
      {renderFileText("QR", files.qrImage)}

      <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage("proofImage")} activeOpacity={0.9}>
        <Text style={styles.uploadCardText}>{files.proofImage ? translate("Change Proof Image") : translate("Pick Proof Image")}</Text>
      </TouchableOpacity>
      {renderFileText("Proof Image", files.proofImage)}

      <TouchableOpacity style={styles.uploadCard} onPress={pickVideo} activeOpacity={0.9}>
        <Text style={styles.uploadCardText}>{files.proofVideo ? translate("Change Proof Video") : translate("Pick Proof Video")}</Text>
      </TouchableOpacity>
      {renderFileText("Proof Video", files.proofVideo)}

      <TouchableOpacity style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={handleSubmit} activeOpacity={0.9} disabled={submitting}>
        {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{translate("Submit Request")}</Text>}
      </TouchableOpacity>
    </View> : <>
      <TouchableOpacity style={styles.actionCard} onPress={() => setCurrentView("form")} activeOpacity={0.92}>
        <View style={styles.actionCopy}>
          <Text style={styles.actionTitle}>{translate("Ask for support")}</Text>
          <Text style={styles.actionSubtitle}>{translate("Tell people what you need and how they can help.")}</Text>
        </View>
        <View style={styles.actionArrow}>
          <Icon name="arrow-up-right" size={16} color={theme.accentStrong} />
        </View>
      </TouchableOpacity>

        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabChip, activeTab === "approved" && styles.tabChipActive]} onPress={() => setActiveTab("approved")} activeOpacity={0.9}>
            <Text style={[styles.tabChipText, activeTab === "approved" && styles.tabChipTextActive]}>{translate("Approved Requests")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabChip, activeTab === "mine" && styles.tabChipActive, !myRequestsEnabled && styles.buttonDisabled]} onPress={() => myRequestsEnabled && setActiveTab("mine")} activeOpacity={0.9} disabled={!myRequestsEnabled}>
            <Text style={[styles.tabChipText, activeTab === "mine" && styles.tabChipTextActive]}>{translate("My Requests")}</Text>
          </TouchableOpacity>
        </View>
        {!myRequestsEnabled ? <Text style={styles.helperNotice}>{translate("Your requests are not available right now. Please try again soon.")}</Text> : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{translate(activeTab === "approved" ? "Approved requests" : "My requests")}</Text>
        <Text style={styles.sectionMeta}>{loading ? translate("Loading...") : `${activeTab === "approved" ? approvedDonations.length : myRequests.length} ${translate("result(s)")}`}</Text>
      </View>

      {loading ? <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={theme.accentStrong} />
          <Text style={styles.loadingText}>{translate("Loading help requests...")}</Text>
        </View> : activeTab === "approved" ? approvedDonations.length === 0 ? <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{translate("No verified requests yet")}</Text>
          <Text style={styles.emptySubtitle}>{translate("Verified requests will appear here when they are ready to receive support.")}</Text>
        </View> : approvedDonations.map(renderApprovedCard) : myRequests.length === 0 ? <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{translate("No requests submitted yet")}</Text>
          <Text style={styles.emptySubtitle}>{translate("If you need help, you can send a request here anytime.")}</Text>
        </View> : myRequests.map(renderMyRequestCard)}
    </>;

  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accentStrong} />}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backRow} onPress={() => currentView === "form" ? setCurrentView("home") : navigation.navigate("Home")} activeOpacity={0.85}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{currentView === "form" ? translate("Back to requests") : translate("Back")}</Text>
          </TouchableOpacity>

          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>{translate("Donation & Charity")}</Text>
          <Text style={styles.heroTitle}>{translate("If you need help, you can ask here. If you are able to give, you can help someone in need too.")}</Text>
          <Text style={styles.heroSubtitle}>{translate("Share your request with care, or support an approved appeal and make life a little easier for someone today.")}</Text>
        </View>

        {listContent}
      </ScrollView>
    </SafeAreaView>;
}

function Field({
  label,
  styles,
  theme,
  multiline,
  ...props
}) {
  return <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} multiline={!!multiline} placeholderTextColor={theme.muted} style={[styles.input, multiline && styles.inputMultiline]} />
    </View>;
}

function StatusBadge({
  label,
  tone,
  styles,
  theme
}) {
  const badgeStyles = tone === "danger" ? {
    backgroundColor: "#FEE2E2",
    color: "#B91C1C"
  } : tone === "success" ? {
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
    backgroundColor: badgeStyles.backgroundColor
  }]}>
      <Text style={[styles.statusBadgeText, {
      color: badgeStyles.color
    }]}>{label}</Text>
    </View>;
}

function InfoMini({
  label,
  value,
  styles
}) {
  return <View style={styles.infoMini}>
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
      maxWidth: 560
    },
    heroSubtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 520
    },
    actionCard: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14
    },
    actionCopy: {
      flex: 1
    },
    actionTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    actionSubtitle: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    actionArrow: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    tabRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 14
    },
    tabChip: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: 12,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center"
    },
    tabChipActive: {
      backgroundColor: theme.accentSoft,
      borderColor: theme.accentStrong
    },
    tabChipText: {
      color: theme.muted,
      fontSize: 12,
      fontWeight: "800"
    },
    tabChipTextActive: {
      color: theme.accentStrong
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 10
    },
    sectionMeta: {
      color: theme.muted,
      fontSize: 12,
      fontWeight: "700"
    },
    helperNotice: {
      marginTop: -2,
      marginBottom: 12,
      color: theme.muted,
      fontSize: 11,
      lineHeight: 17
    },
    loadingCard: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      alignItems: "center"
    },
    loadingText: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 12,
      fontWeight: "700"
    },
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    emptySubtitle: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    requestCard: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      marginBottom: 12
    },
    requestTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12
    },
    requestCopy: {
      flex: 1
    },
    requestTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    requestMeta: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 12,
      fontWeight: "700"
    },
    requestDescription: {
      marginTop: 10,
      color: theme.text,
      fontSize: 12,
      lineHeight: 19
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
    progressWrap: {
      marginTop: 14
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
    previewImage: {
      width: "100%",
      height: 170,
      borderRadius: 18,
      marginTop: 12,
      marginBottom: 12
    },
    requestFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 14
    },
    footerHint: {
      flex: 1,
      color: theme.muted,
      fontSize: 12,
      fontWeight: "700"
    },
    primaryMiniButton: {
      backgroundColor: theme.accentStrong,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10
    },
    primaryMiniButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800"
    },
    noteCard: {
      marginTop: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      padding: 14
    },
    noteLabel: {
      color: theme.muted,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.7
    },
    noteText: {
      marginTop: 6,
      color: theme.text,
      fontSize: 12,
      lineHeight: 19
    },
    metaGrid: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12
    },
    infoMini: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      padding: 12
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
    secondaryButton: {
      marginTop: 14,
      minHeight: 44,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800"
    },
    panel: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18
    },
    fieldWrap: {
      marginBottom: 12
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
    inputMultiline: {
      minHeight: 110,
      textAlignVertical: "top"
    },
    uploadCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.accentStrong,
      backgroundColor: theme.accentSoft,
      padding: 16,
      alignItems: "center",
      marginBottom: 6
    },
    uploadCardText: {
      color: theme.accentStrong,
      fontSize: 12,
      fontWeight: "800"
    },
    fileText: {
      color: theme.muted,
      fontSize: 11,
      marginBottom: 10
    },
    primaryButton: {
      marginTop: 8,
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

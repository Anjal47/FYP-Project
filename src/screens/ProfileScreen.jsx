import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, RefreshControl, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { getMyCounselingReviews, formatReviewSummary } from "../utils/counselingReviews";
import { useTranslate } from "../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
async function apiGetMe(token) {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load profile");
  return data;
}
async function apiPatchMe(token, payload) {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to update profile");
  return data;
}
async function apiChangeEmail(token, payload) {
  const res = await fetch(`${BASE_URL}/api/auth/me/email`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to change email");
  return data;
}
async function apiChangePassword(token, payload) {
  const res = await fetch(`${BASE_URL}/api/auth/me/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to change password");
  return data;
}
export default function ProfileScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const {
    width
  } = useWindowDimensions();
  const isWide = width >= 900;
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark, isWide)), [theme, isDark, isWide]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [me, setMe] = useState(null);
  const [reviewsSummary, setReviewsSummary] = useState({
    averageRating: 0,
    reviewCount: 0
  });
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    bio: "",
    qualification: "",
    workingArea: ""
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    password: ""
  });
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const isStaff = ["counsellor", "therapist", "police"].includes(me?.role);
  const fillFormFromMe = user => {
    setForm({
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      qualification: user?.qualification || "",
      workingArea: user?.workingArea || ""
    });
    setEmailForm(prev => ({
      ...prev,
      newEmail: user?.email || ""
    }));
  };
  const load = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{
            name: "Login"
          }]
        });
        return;
      }
      const data = await apiGetMe(token);
      setMe(data?.user || null);
      fillFormFromMe(data?.user);
      const reviewsData = await getMyCounselingReviews(token).catch(() => null);
      setReviewsSummary(reviewsData?.summary || {
        averageRating: 0,
        reviewCount: 0
      });
      setReceivedReviews(Array.isArray(reviewsData?.reviews) ? reviewsData.reviews : []);
    } catch (error) {
      Alert.alert(translate("Profile error"), error?.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  const onChange = (key, value) => setForm(prev => ({
    ...prev,
    [key]: value
  }));
  const onChangeEmail = (key, value) => setEmailForm(prev => ({
    ...prev,
    [key]: value
  }));
  const onChangePass = (key, value) => setPassForm(prev => ({
    ...prev,
    [key]: value
  }));
  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{
            name: "Login"
          }]
        });
        return;
      }
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim()
      };
      if (isStaff) {
        payload.bio = form.bio.trim();
        payload.qualification = form.qualification.trim();
        payload.workingArea = form.workingArea.trim();
      }
      const data = await apiPatchMe(token, payload);
      const updated = data?.user;
      setMe(updated);
      fillFormFromMe(updated);
      await AsyncStorage.setItem("user", JSON.stringify({
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role
      }));
      Alert.alert(translate("Saved"), translate("Profile updated successfully."));
    } catch (error) {
      Alert.alert(translate("Save failed"), error?.message || "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  };
  const saveEmail = async () => {
    try {
      const newEmail = emailForm.newEmail.trim().toLowerCase();
      const password = emailForm.password.trim();
      if (!newEmail || !password) {
        Alert.alert(translate("Missing"), translate("New email and password are required."));
        return;
      }
      setSavingEmail(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{
            name: "Login"
          }]
        });
        return;
      }
      const data = await apiChangeEmail(token, {
        newEmail,
        password
      });
      const newUser = data?.user;
      if (newUser?.email) {
        setMe(old => ({
          ...(old || {}),
          email: newUser.email
        }));
        await AsyncStorage.setItem("user", JSON.stringify({
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role
        }));
      }
      setEmailForm(prev => ({
        ...prev,
        password: ""
      }));
      Alert.alert(translate("Updated"), translate("Email updated successfully."));
    } catch (error) {
      Alert.alert(translate("Email change failed"), error?.message || "Unable to change email");
    } finally {
      setSavingEmail(false);
    }
  };
  const savePassword = async () => {
    try {
      const currentPassword = passForm.currentPassword.trim();
      const newPassword = passForm.newPassword.trim();
      const confirmNewPassword = passForm.confirmNewPassword.trim();
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        Alert.alert(translate("Missing"), translate("Please fill all password fields."));
        return;
      }
      if (newPassword.length < 6) {
        Alert.alert(translate("Weak password"), translate("New password must be at least 6 characters."));
        return;
      }
      if (newPassword !== confirmNewPassword) {
        Alert.alert(translate("Mismatch"), translate("New password and confirmation do not match."));
        return;
      }
      setSavingPass(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{
            name: "Login"
          }]
        });
        return;
      }
      await apiChangePassword(token, {
        currentPassword,
        newPassword
      });
      setPassForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
      Alert.alert(translate("Updated"), translate("Password updated successfully."));
    } catch (error) {
      Alert.alert(translate("Password change failed"), error?.message || "Unable to change password");
    } finally {
      setSavingPass(false);
    }
  };
  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    navigation.reset({
      index: 0,
      routes: [{
        name: "Welcome"
      }]
    });
  };
  if (loading) {
    return <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.accentStrong} />
        <Text style={styles.loadingText}>{translate("Loading profile...")}</Text>
      </SafeAreaView>;
  }
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable style={({
          pressed
        }) => [styles.backRow, pressed && styles.softPressed]} onPress={() => navigation.goBack?.()}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{translate("Back")}</Text>
          </Pressable>

          <View style={styles.heroGlow} />
          <Text style={styles.eyebrow}>{translate("Profile")}</Text>
          <Text style={styles.title}>{translate("Keep your account calm, current, and easy to trust.")}</Text>
          <Text style={styles.subtitle}>{translate("Update core details, review your reputation, and manage access without digging through clutter.")}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaCard}>
              <Text style={styles.heroMetaLabel}>{translate("Account")}</Text>
              <Text style={styles.heroMetaValue}>{me?.role || "user"}</Text>
            </View>
            <View style={styles.heroMetaCard}>
              <Text style={styles.heroMetaLabel}>{translate("Rating")}</Text>
              <Text style={styles.heroMetaValue}>{formatReviewSummary(reviewsSummary)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.mainColumn}>
            <SectionCard title={translate("Ratings & Reviews")} subtitle={receivedReviews.length ? "Recent feedback from counseling sessions." : "Reviews will appear here after completed counseling sessions."} styles={styles}>
              {receivedReviews.length ? receivedReviews.slice(0, 4).map(review => <View key={String(review.id)} style={styles.reviewCard}>
                    <Text style={styles.reviewStars}>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </Text>
                    <Text style={styles.reviewMeta}>
                      {review?.reviewer?.fullName || "Anonymous"}
                      {review?.reviewer?.role ? ` • ${review.reviewer.role}` : ""}
                    </Text>
                    <Text style={styles.reviewBody}>
                      {review.comment || "No written comment was added for this rating."}
                    </Text>
                  </View>) : <View style={styles.emptyState}>
                  <Icon name="message-square" size={18} color={theme.accentStrong} />
                  <Text style={styles.emptyStateText}>{translate("No reviews received yet.")}</Text>
                </View>}
            </SectionCard>

            <SectionCard title={translate("Personal Details")} subtitle={isStaff ? translate("Staff profile fields are available below.") : translate("Users can edit their basic details here.")} styles={styles}>
              <Field label={translate("Full Name")} value={form.fullName} onChangeText={v => onChange("fullName", v)} styles={styles} theme={theme} />
              <Field label={translate("Phone")} value={form.phone} onChangeText={v => onChange("phone", v)} autoCapitalize="none" styles={styles} theme={theme} />

              {isStaff ? <>
                  <Field label={translate("Working Area")} value={form.workingArea} onChangeText={v => onChange("workingArea", v)} autoCapitalize="words" styles={styles} theme={theme} />
                  <Field label={translate("Qualification")} value={form.qualification} onChangeText={v => onChange("qualification", v)} autoCapitalize="words" styles={styles} theme={theme} />
                  <Field label={translate("Bio")} value={form.bio} onChangeText={v => onChange("bio", v)} autoCapitalize="sentences" multiline styles={styles} theme={theme} />
                </> : null}

              <PrimaryButton label={savingProfile ? "Saving..." : "Save Profile"} onPress={saveProfile} loading={savingProfile} styles={styles} />
            </SectionCard>
          </View>

          <View style={styles.sideColumn}>
            <SectionCard title={translate("Email")} subtitle={translate("Use your password to confirm email changes.")} styles={styles}>
              <Field label={translate("New Email")} value={emailForm.newEmail} onChangeText={v => onChangeEmail("newEmail", v)} keyboardType="email-address" styles={styles} theme={theme} />
              <Field label={translate("Current Password")} value={emailForm.password} onChangeText={v => onChangeEmail("password", v)} secureTextEntry styles={styles} theme={theme} />
              <PrimaryButton label={savingEmail ? "Updating..." : "Update Email"} onPress={saveEmail} loading={savingEmail} styles={styles} />
            </SectionCard>

            <SectionCard title={translate("Password")} subtitle={translate("Choose a secure password with at least 6 characters.")} styles={styles}>
              <Field label={translate("Current Password")} value={passForm.currentPassword} onChangeText={v => onChangePass("currentPassword", v)} secureTextEntry styles={styles} theme={theme} />
              <Field label={translate("New Password")} value={passForm.newPassword} onChangeText={v => onChangePass("newPassword", v)} secureTextEntry styles={styles} theme={theme} />
              <Field label={translate("Confirm New Password")} value={passForm.confirmNewPassword} onChangeText={v => onChangePass("confirmNewPassword", v)} secureTextEntry styles={styles} theme={theme} />
              <PrimaryButton label={savingPass ? "Updating..." : "Update Password"} onPress={savePassword} loading={savingPass} styles={styles} />
            </SectionCard>

            <View style={styles.sessionCard}>
              <Text style={styles.sessionEyebrow}>{translate("Session")}</Text>
              <Text style={styles.sessionTitle}>{translate("Need to leave this device?")}</Text>
              <Text style={styles.sessionText}>{translate("Logging out returns the app to the welcome screen and protects your account access.")}</Text>
              <Pressable style={({
              pressed
            }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]} onPress={logout}>
                <Text style={styles.logoutText}>{translate("Log Out")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>;
}
function SectionCard({
  title,
  subtitle,
  children,
  styles
}) {
  return <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>;
}
function PrimaryButton({
  label,
  onPress,
  loading,
  styles
}) {
  return <Pressable style={({
    pressed
  }) => [styles.primaryButton, loading && styles.primaryButtonDisabled, pressed && !loading && styles.primaryButtonPressed]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{label}</Text>}
    </Pressable>;
}
function Field({
  label,
  multiline,
  styles,
  theme,
  ...props
}) {
  return <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} autoCapitalize={props.autoCapitalize || (multiline ? "sentences" : "words")} placeholderTextColor={theme.muted} multiline={!!multiline} style={[styles.fieldInput, multiline && styles.fieldInputMultiline]} />
    </View>;
}
function createStyles(theme, isDark, isWide) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    loadingScreen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background
    },
    loadingText: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      fontWeight: "700"
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
      elevation: 5
    },
    heroGlow: {
      position: "absolute",
      top: -90,
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
    softPressed: {
      opacity: 0.85
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
      maxWidth: 560
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 560
    },
    heroMetaRow: {
      flexDirection: isWide ? "row" : "column",
      gap: 12,
      marginTop: 18
    },
    heroMetaCard: {
      flex: isWide ? 1 : 0,
      backgroundColor: theme.surfaceElevated,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16
    },
    heroMetaLabel: {
      color: theme.muted,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    heroMetaValue: {
      marginTop: 6,
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    columns: {
      flexDirection: isWide ? "row" : "column",
      gap: 16
    },
    mainColumn: {
      flex: isWide ? 1.25 : 1,
      gap: 16
    },
    sideColumn: {
      flex: 1,
      gap: 16
    },
    sectionCard: {
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
    reviewCard: {
      backgroundColor: theme.surfaceSoft,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginTop: 10
    },
    reviewStars: {
      color: theme.accentStrong,
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 1
    },
    reviewMeta: {
      marginTop: 6,
      color: theme.text,
      fontSize: 12,
      fontWeight: "700"
    },
    reviewBody: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    emptyState: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14
    },
    emptyStateText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700"
    },
    fieldWrap: {
      marginBottom: 12
    },
    fieldLabel: {
      marginBottom: 6,
      color: theme.muted,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.7
    },
    fieldInput: {
      minHeight: 48,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      color: theme.text,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 13
    },
    fieldInputMultiline: {
      minHeight: 110,
      textAlignVertical: "top"
    },
    primaryButton: {
      marginTop: 4,
      minHeight: 48,
      borderRadius: 18,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center"
    },
    primaryButtonDisabled: {
      opacity: 0.75
    },
    primaryButtonPressed: {
      transform: [{
        scale: 0.985
      }]
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800"
    },
    sessionCard: {
      backgroundColor: theme.text,
      borderRadius: 28,
      padding: 22
    },
    sessionEyebrow: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1
    },
    sessionTitle: {
      marginTop: 8,
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "800"
    },
    sessionText: {
      marginTop: 8,
      color: "rgba(255,255,255,0.76)",
      fontSize: 12,
      lineHeight: 18
    },
    logoutButton: {
      marginTop: 18,
      minHeight: 46,
      borderRadius: 16,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center"
    },
    logoutButtonPressed: {
      opacity: 0.92,
      transform: [{
        scale: 0.985
      }]
    },
    logoutText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800"
    }
  };
}

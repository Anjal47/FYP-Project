import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { getRoleRoute } from "../navigation/authStack.logic";
import { getLanguageLabel, useLocalizedCopy } from "../utils/localization";

const COPY_BY_LANGUAGE = {
  English: {
    back: "Back",
    eyebrow: "Settings",
    title: "Control preferences without hunting through clutter.",
    subtitle:
      "Core settings are grouped by account, app behavior, and privacy so changes feel predictable.",
    appPreferences: "App Preferences",
    profileTitle: "Profile",
    profileSubtitle: "Update your personal details and account info",
    notificationsTitle: "Notifications",
    notificationsOn: "Saved on this device. In-app alert preference is on.",
    notificationsOff: "Saved on this device. In-app alert preference is off.",
    languageTitle: "Language",
    languageSubtitle: "Saved on this device. Settings text updates immediately.",
    themeTitle: "Theme",
    themeDark: "Dark mode enabled",
    themeLight: "Light mode enabled",
    safetyTitle: "Safety & Privacy",
    emergencyContactTitle: "Emergency Contact",
    emergencyContactSubtitle: "Add or update your personal SOS number",
    locationTitle: "Location",
    locationSubtitle: "Use device location for faster nearby help",
    locationAlertTitle: "Location",
    locationAlertMessage:
      "Location settings can be expanded next to include permission checks and saved location preferences.",
    policyTitle: "Policy",
    policySubtitle: "Review AngelTouch safety and privacy guidance",
    policyAlertTitle: "Policy",
    policyAlertMessage:
      "Your information is kept confidential.\n\nEmergency contacts are used only during alerts.\n\nReports are encrypted and stored securely.\n\nYou can request your data to be deleted at any time.",
    chooseLanguageTitle: "Choose Language",
    chooseLanguageMessage:
      "This preference is saved on this device. Supported screens update right away.",
    cancel: "Cancel",
    accountEyebrow: "Account",
    accountTitle: "Profile and session access",
    accountText:
      "Keep your information updated so emergency flows, support, and appointments work smoothly.",
    accountPill: "Profile is now available in App Preferences.",
    sessionEyebrow: "Session",
    sessionTitle: "Ready to sign out?",
    sessionText:
      "Logging out returns this device to the welcome screen and protects your access.",
    logoutTitle: "Log out",
    logoutMessage: "You will be logged out from this device.",
    logoutAction: "Log Out",
  },
  Nepali: {
    back: "फिर्ता",
    eyebrow: "सेटिङ",
    title: "अनावश्यक झन्झट बिना आफ्ना प्राथमिकताहरू नियन्त्रण गर्नुहोस्।",
    subtitle:
      "खाता, एपको व्यवहार र गोपनीयता सम्बन्धी मुख्य सेटिङहरू एउटै ठाउँमा राखिएका छन्, जसले परिवर्तनहरू सहज र अनुमानयोग्य बनाउँछ।",
    appPreferences: "एप प्राथमिकताहरू",
    profileTitle: "प्रोफाइल",
    profileSubtitle: "व्यक्तिगत विवरण र खाताको जानकारी अद्यावधिक गर्नुहोस्",
    notificationsTitle: "सूचनाहरू",
    notificationsOn: "यो डिभाइसमा सुरक्षित गरिएको छ। एपभित्रका सूचनाहरू चालू छन्।",
    notificationsOff: "यो डिभाइसमा सुरक्षित गरिएको छ। एपभित्रका सूचनाहरू बन्द छन्।",
    languageTitle: "भाषा",
    languageSubtitle: "यो डिभाइसमा सुरक्षित हुन्छ। सेटिङका पाठहरू तुरुन्तै अपडेट हुन्छन्।",
    themeTitle: "थिम",
    themeDark: "डार्क मोड सक्रिय छ",
    themeLight: "लाइट मोड सक्रिय छ",
    safetyTitle: "सुरक्षा र गोपनीयता",
    emergencyContactTitle: "आपतकालीन सम्पर्क",
    emergencyContactSubtitle: "आफ्नो व्यक्तिगत SOS नम्बर थप्नुहोस् वा अद्यावधिक गर्नुहोस्",
    locationTitle: "स्थान",
    locationSubtitle: "नजिकको सहायता छिटो पाउन डिभाइसको स्थान प्रयोग गर्नुहोस्",
    locationAlertTitle: "स्थान",
    locationAlertMessage:
      "आगामी संस्करणमा स्थानसम्बन्धी अनुमति जाँच र सुरक्षित प्राथमिकताहरू यहीँ विस्तार गर्न सकिन्छ।",
    policyTitle: "नीति",
    policySubtitle: "AngelTouch को सुरक्षा र गोपनीयता सम्बन्धी मार्गदर्शन हेर्नुहोस्",
    policyAlertTitle: "नीति",
    policyAlertMessage:
      "तपाईंको जानकारी गोप्य राखिन्छ।\n\nआपतकालीन सम्पर्कहरू केवल अलर्टका बेला मात्र प्रयोग गरिन्छन्।\n\nरिपोर्टहरू इन्क्रिप्ट गरी सुरक्षित रूपमा भण्डारण गरिन्छन्।\n\nतपाईंले जुनसुकै बेला आफ्नो डाटा मेटाउन अनुरोध गर्न सक्नुहुन्छ।",
    chooseLanguageTitle: "भाषा छान्नुहोस्",
    chooseLanguageMessage:
      "यो प्राथमिकता यही डिभाइसमा सुरक्षित हुन्छ। समर्थित स्क्रिनहरू तुरुन्तै अपडेट हुन्छन्।",
    cancel: "रद्द गर्नुहोस्",
    accountEyebrow: "खाता",
    accountTitle: "प्रोफाइल र सत्र पहुँच",
    accountText:
      "तपाईंको जानकारी अद्यावधिक राख्दा सहायता, आपतकालीन प्रक्रिया र अपोइन्टमेन्टहरू सहज रूपमा चल्छन्।",
    accountPill: "प्रोफाइल अब एप प्राथमिकताभित्र उपलब्ध छ।",
    sessionEyebrow: "सत्र",
    sessionTitle: "साइन आउट गर्न चाहनुहुन्छ?",
    sessionText:
      "लग आउट गर्दा यो डिभाइस वेलकम स्क्रिनमा फर्किन्छ र तपाईंको पहुँच सुरक्षित रहन्छ।",
    logoutTitle: "लग आउट",
    logoutMessage: "यो डिभाइसबाट तपाईंलाई लग आउट गरिनेछ।",
    logoutAction: "लग आउट गर्नुहोस्",
  },
};

export default function SettingsScreen({ navigation }) {
  const {
    isDark,
    setThemeMode,
    theme,
    language,
    setLanguage,
    supportedLanguages,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const copy = useLocalizedCopy(COPY_BY_LANGUAGE);
  const currentLanguageLabel = getLanguageLabel(language, language);

  const styles = useMemo(
    () => StyleSheet.create(createStyles(theme, isDark, isWide)),
    [theme, isDark, isWide]
  );

  const handleLanguagePress = () => {
    Alert.alert(
      copy.chooseLanguageTitle,
      copy.chooseLanguageMessage,
      [
        ...supportedLanguages.map((option) => ({
          text: getLanguageLabel(option, language),
          onPress: async () => {
            await setLanguage(option);
          },
        })),
        { text: copy.cancel, style: "cancel" },
      ]
    );
  };

  const handlePolicy = () => {
    Alert.alert(copy.policyAlertTitle, copy.policyAlertMessage);
  };

  const handleBack = async () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    try {
      const userStr = await AsyncStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const fallbackRoute = user?.role ? getRoleRoute(user.role) : "Welcome";
      navigation.reset({ index: 0, routes: [{ name: fallbackRoute }] });
    } catch {
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
    }
  };

  const handleLogout = () => {
    Alert.alert(copy.logoutTitle, copy.logoutMessage, [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.logoutAction,
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["token", "user"]);
          } catch {
            // Keep logout resilient even if local cleanup partially fails.
          }
          navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          <View style={styles.hero}>
            <Pressable style={({ pressed }) => [styles.backRow, pressed && styles.softPressed]} onPress={handleBack}>
              <View style={styles.backIconWrap}>
                <Icon name="arrow-left" size={18} color={theme.text} />
              </View>
              <Text style={styles.backText}>{copy.back}</Text>
            </Pressable>

            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <View style={styles.columns}>
            <View style={styles.mainColumn}>
              <SectionCard styles={styles} title={copy.appPreferences}>
                <SettingsRow
                  styles={styles}
                  title={copy.profileTitle}
                  subtitle={copy.profileSubtitle}
                  onPress={() => navigation.navigate("Profile")}
                  rightComponent={<Icon name="chevron-right" size={18} color={theme.muted} />}
                />
                <SettingsRow
                  styles={styles}
                  title={copy.notificationsTitle}
                  subtitle={notificationsEnabled ? copy.notificationsOn : copy.notificationsOff}
                  rightComponent={
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      trackColor={{ false: "#CFC3B4", true: "#F7B27F" }}
                      thumbColor={notificationsEnabled ? theme.accentStrong : "#FFFFFF"}
                    />
                  }
                />
                <SettingsRow
                  styles={styles}
                  title={copy.languageTitle}
                  subtitle={`${currentLanguageLabel} - ${copy.languageSubtitle}`}
                  onPress={handleLanguagePress}
                  rightComponent={<Icon name="chevron-right" size={18} color={theme.muted} />}
                />
                <SettingsRow
                  styles={styles}
                  title={copy.themeTitle}
                  subtitle={isDark ? copy.themeDark : copy.themeLight}
                  rightComponent={
                    <Switch
                      value={isDark}
                      onValueChange={(value) => setThemeMode(value ? "dark" : "light")}
                      trackColor={{ false: "#CFC3B4", true: "#F7B27F" }}
                      thumbColor={isDark ? theme.accentStrong : "#FFFFFF"}
                    />
                  }
                />
              </SectionCard>

              <SectionCard styles={styles} title={copy.safetyTitle}>
                <SettingsRow
                  styles={styles}
                  title={copy.emergencyContactTitle}
                  subtitle={copy.emergencyContactSubtitle}
                  onPress={() => navigation.navigate("EmergencyContact")}
                  rightComponent={<Icon name="chevron-right" size={18} color={theme.muted} />}
                />
                <SettingsRow
                  styles={styles}
                  title={copy.locationTitle}
                  subtitle={copy.locationSubtitle}
                  onPress={() =>
                    Alert.alert(copy.locationAlertTitle, copy.locationAlertMessage)
                  }
                  rightComponent={<Icon name="chevron-right" size={18} color={theme.muted} />}
                />
                <SettingsRow
                  styles={styles}
                  title={copy.policyTitle}
                  subtitle={copy.policySubtitle}
                  onPress={handlePolicy}
                  rightComponent={<Icon name="chevron-right" size={18} color={theme.muted} />}
                />
              </SectionCard>
            </View>

            <View style={styles.sideColumn}>
              <View style={styles.accountPanel}>
                <Text style={styles.panelEyebrow}>{copy.accountEyebrow}</Text>
                <Text style={styles.panelTitle}>{copy.accountTitle}</Text>
                <Text style={styles.panelText}>{copy.accountText}</Text>
                <View style={styles.profileInfoPill}>
                  <Icon name="user" size={16} color={theme.accentStrong} />
                  <Text style={styles.profileInfoText}>{copy.accountPill}</Text>
                </View>
              </View>

              <View style={styles.logoutPanel}>
                <Text style={styles.panelEyebrow}>{copy.sessionEyebrow}</Text>
                <Text style={styles.panelTitleDark}>{copy.sessionTitle}</Text>
                <Text style={styles.panelTextDark}>{copy.sessionText}</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.logoutButton,
                    pressed && styles.logoutButtonPressed,
                  ]}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutText}>{copy.logoutAction}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({ title, children, styles }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SettingsRow({ title, subtitle, onPress, rightComponent, styles }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.item, onPress && pressed && styles.itemPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.itemCopy}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
      </View>
      <View>{rightComponent}</View>
    </Pressable>
  );
}

function createStyles(theme, isDark, isWide) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: 12,
      paddingBottom: 32,
    },
    shell: {
      width: "100%",
      maxWidth: 1080,
      alignSelf: "center",
    },
    hero: {
      backgroundColor: theme.surface,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      marginBottom: 16,
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 10,
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
    softPressed: {
      opacity: 0.85,
    },
    eyebrow: {
      marginTop: 22,
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: isWide ? 34 : 29,
      lineHeight: isWide ? 40 : 34,
      fontWeight: "800",
      letterSpacing: -1,
      maxWidth: 720,
    },
    subtitle: {
      marginTop: 12,
      color: theme.muted,
      fontSize: 14,
      lineHeight: 22,
      maxWidth: 700,
    },
    columns: {
      flexDirection: isWide ? "row" : "column",
      gap: 12,
    },
    mainColumn: {
      flex: 1.15,
      gap: 12,
    },
    sideColumn: {
      flex: 0.85,
      gap: 12,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.4,
      marginBottom: 8,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    itemPressed: {
      backgroundColor: theme.surfaceElevated || theme.surfaceSoft,
      borderRadius: 18,
      paddingHorizontal: 10,
    },
    itemCopy: {
      flex: 1,
      paddingRight: 12,
    },
    itemTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "700",
    },
    itemSubtitle: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    accountPanel: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
    },
    panelEyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    panelTitle: {
      marginTop: 10,
      color: theme.text,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.6,
      lineHeight: 28,
    },
    panelTitleDark: {
      marginTop: 10,
      color: "#FFFFFF",
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.6,
      lineHeight: 28,
    },
    panelText: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
    },
    panelTextDark: {
      marginTop: 10,
      color: "rgba(255,255,255,0.78)",
      fontSize: 13,
      lineHeight: 20,
    },
    profileInfoPill: {
      marginTop: 20,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    profileInfoText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700",
    },
    logoutPanel: {
      backgroundColor: theme.text,
      borderRadius: 28,
      padding: 20,
    },
    logoutButton: {
      marginTop: 20,
      alignSelf: "flex-start",
      backgroundColor: "#D64545",
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    logoutButtonPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
    logoutText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },
  };
}

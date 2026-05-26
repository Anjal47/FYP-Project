import React, { useCallback, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, TextInput, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import AppLogo from "../components/AppLogo";
import FloatingHelpChat from "../components/FloatingHelpChat";
import { useAppTheme } from "../context/ThemeContext";
import { getLocalizedCopy, translateText, useResolvedAppLanguage } from "../utils/localization";

const COPY_BY_LANGUAGE = {
  English: {
    heroEyebrow: "User Home",
    heroTitle: "Help should feel immediate, calm, and obvious.",
    heroSubtitle: "Access reporting, essential services, and emergency tools from one place.",
    searchPlaceholder: "Search services and reports",
    searchHint: "",
    noResults: "No matching service found.",
    priorityEyebrow: "Priority Actions",
    priorityTitle: "Start where you need help",
    helplines: "View helplines",
    quickAccessEyebrow: "Quick Access",
    quickAccessTitle: "Common user journeys",
    dockChat: "Chat",
    dockSettings: "Settings",
    stats: [
      { label: "Fast Paths", value: "7", note: "Core services" },
      { label: "Emergency", value: "24/7", note: "SOS support" },
      { label: "Private Help", value: "Safe", note: "Counseling & therapy" },
    ],
    actions: [
      {
        key: "reporting",
        title: "Reporting",
        desc: "File crime, waste, or road reports with clearer next steps.",
        tag: "Safety",
        icon: "file-text",
        screen: "ReportingHome",
      },
      {
        key: "counselors",
        title: "Counseling",
        desc: "Find support, book a session, and continue chats in one place.",
        tag: "Care",
        icon: "message-circle",
        screen: "Counseling",
      },
      {
        key: "traffic",
        title: "Traffic",
        desc: "Access traffic reporting, rules, and fine payment flows.",
        tag: "Road",
        icon: "credit-card",
        screen: "TrafficHome",
      },
      {
        key: "support",
        title: "Support",
        desc: "Connect to trusted NGOs and support organizations without digging through menus.",
        tag: "Help",
        icon: "help-circle",
        screen: "ConnectToNGOs",
      },
      {
        key: "donation",
        title: "Donate",
        desc: "Support verified requests and community needs with more trust.",
        tag: "Community",
        icon: "heart",
        screen: "Donation",
      },
      {
        key: "therapy",
        title: "Therapy",
        desc: "Reach therapy support quickly for deeper ongoing care.",
        tag: "Wellbeing",
        icon: "activity",
        screen: "TherapyScreen",
      },
      {
        key: "sos",
        title: "Emergency SOS",
        desc: "Launch urgent calls and emergency actions instantly.",
        tag: "Urgent",
        icon: "phone-call",
        screen: "EmergencySOS",
      },
    ],
  },
  Nepali: {
    heroEyebrow: "प्रयोगकर्ता गृहपृष्ठ",
    heroTitle: "सहयोग तुरुन्त, शान्त र स्पष्ट हुनुपर्छ।",
    heroSubtitle: "रिपोर्टिङ, आवश्यक सेवाहरू र आपतकालीन उपकरणहरू एउटै ठाउँबाट पहुँच गर्नुहोस्।",
    searchPlaceholder: "सेवा र रिपोर्ट खोज्नुहोस्",
    searchHint: "",
    noResults: "मिल्दो सेवा भेटिएन।",
    priorityEyebrow: "प्राथमिक कार्यहरू",
    priorityTitle: "जहाँ सहायता चाहिन्छ त्यहीँबाट सुरु गर्नुहोस्",
    helplines: "हेल्पलाइन हेर्नुहोस्",
    quickAccessEyebrow: "द्रुत पहुँच",
    quickAccessTitle: "सामान्य प्रयोगकर्ता यात्रा",
    dockChat: "च्याट",
    dockSettings: "सेटिङ",
    stats: [
      { label: "छिटो पहुँच", value: "7", note: "मुख्य सेवाहरू" },
      { label: "आपतकालीन", value: "24/7", note: "एसओएस सहायता" },
      { label: "गोप्य सहयोग", value: "सुरक्षित", note: "परामर्श र थेरापी" },
    ],
    actions: [
      {
        key: "reporting",
        title: "रिपोर्टिङ",
        desc: "अपराध, फोहोर वा सडकसम्बन्धी रिपोर्टहरू स्पष्ट अर्को चरणसहित दर्ता गर्नुहोस्।",
        tag: "सुरक्षा",
        icon: "file-text",
        screen: "ReportingHome",
      },
      {
        key: "counselors",
        title: "परामर्श",
        desc: "सहायता खोज्नुहोस्, सेसन बुक गर्नुहोस्, र एकै ठाउँमा च्याट जारी राख्नुहोस्।",
        tag: "हेरचाह",
        icon: "message-circle",
        screen: "Counseling",
      },
      {
        key: "traffic",
        title: "ट्राफिक",
        desc: "ट्राफिक रिपोर्टिङ, नियम र जरिवाना भुक्तानी प्रक्रियामा पहुँच पाउनुहोस्।",
        tag: "सडक",
        icon: "credit-card",
        screen: "TrafficHome",
      },
      {
        key: "support",
        title: "सहायता",
        desc: "मेनु खोजिरहनु नपरी विश्वसनीय एनजिओ र सहयोगी संस्थासँग जडान हुनुहोस्।",
        tag: "सहयोग",
        icon: "help-circle",
        screen: "ConnectToNGOs",
      },
      {
        key: "donation",
        title: "दान",
        desc: "विश्वसनीय अनुरोध र सामुदायिक आवश्यकतालाई बढी भरोसासहित सहयोग गर्नुहोस्।",
        tag: "समुदाय",
        icon: "heart",
        screen: "Donation",
      },
      {
        key: "therapy",
        title: "थेरापी",
        desc: "दीर्घकालीन हेरचाहका लागि छिटो थेरापी सहायता पाउनुहोस्।",
        tag: "कल्याण",
        icon: "activity",
        screen: "TherapyScreen",
      },
      {
        key: "sos",
        title: "आपतकालीन एसओएस",
        desc: "तत्काल कल र आपतकालीन कार्य तुरुन्त सुरु गर्नुहोस्।",
        tag: "तत्काल",
        icon: "phone-call",
        screen: "EmergencySOS",
      },
    ],
  },
};
const HomeScreen = ({
  navigation
}) => {
  const {
    theme,
    isDark
  } = useAppTheme();
  const {
    language,
    refreshLanguage
  } = useResolvedAppLanguage();
  const translate = useMemo(() => value => translateText(value, language), [language]);
  const copy = useMemo(() => getLocalizedCopy(COPY_BY_LANGUAGE, language), [language]);
  const {
    width
  } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");
  const query = searchQuery.trim().toLowerCase();
  const isWide = width >= 880;
  const contentWidth = Math.min(width - 24, 1080);
  const localizedActions = copy.actions;
  const englishActions = COPY_BY_LANGUAGE.English.actions;
  const localizedCards = localizedActions.filter(item => ["reporting", "counselors", "traffic", "support", "donation", "therapy"].includes(item.key));
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark, isWide, contentWidth)), [theme, isDark, isWide, contentWidth]);
  useFocusEffect(useCallback(() => {
    refreshLanguage();
  }, [refreshLanguage]));
  const filteredActions = query ? localizedActions.filter((item, index) => {
    const baseItem = englishActions[index];
    const text = `${item.title} ${item.desc} ${item.tag} ${baseItem.title} ${baseItem.desc} ${baseItem.tag}`.toLowerCase();
    return text.includes(query);
  }) : [];
  const handleActionPress = item => {
    if (typeof item.onPress === "function") {
      item.onPress(navigation);
      setSearchQuery("");
      return;
    }
    if (item.screen) {
      navigation.navigate(item.screen);
      setSearchQuery("");
    }
  };
  const quickStats = copy.stats;
  return <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.heroTopRow}>
              <AppLogo size={56} label={copy.heroEyebrow} />
            </View>

            <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
            <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>

            <View style={styles.searchShell}>
              <Icon name="search" size={18} color={theme.muted} />
              <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder={copy.searchPlaceholder} placeholderTextColor={theme.muted} style={styles.searchInput} />
              {!!searchQuery && <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.searchClear} activeOpacity={0.85}>
                  <Icon name="x" size={14} color={theme.text} />
                </TouchableOpacity>}
            </View>

            {!query && copy.searchHint ? <Text style={styles.searchHint}>{copy.searchHint}</Text> : null}

            {query ? <View style={styles.searchResults}>
                {filteredActions.length ? filteredActions.map(item => <Pressable key={item.key} style={({
              pressed
            }) => [styles.searchResultItem, pressed && styles.searchResultItemPressed]} onPress={() => handleActionPress(item)}>
                      {({
                pressed
              }) => <>
                          <View style={[styles.searchResultIcon, pressed && styles.searchResultIconPressed]}>
                            <Icon name={item.icon} size={16} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                          </View>
                          <View style={styles.searchResultCopy}>
                            <Text style={[styles.searchResultTitle, pressed && styles.searchResultTitlePressed]}>{item.title}</Text>
                            <Text style={[styles.searchResultDesc, pressed && styles.searchResultDescPressed]}>{item.desc}</Text>
                          </View>
                          <Icon name="arrow-up-right" size={16} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                        </>}
                    </Pressable>) : <Text style={styles.noResultsText}>{copy.noResults}</Text>}
              </View> : null}

            <View style={styles.statRow}>
              {quickStats.map(item => <View key={item.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statNote}>{item.note}</Text>
                </View>)}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>{copy.priorityEyebrow}</Text>
              <Text style={styles.sectionTitle}>{copy.priorityTitle}</Text>
            </View>
            <Pressable style={({
            pressed
          }) => [styles.sectionLink, pressed && styles.softPressed]} onPress={() => navigation.navigate("Support")}>
              <Text style={styles.sectionLinkText}>{copy.helplines}</Text>
            </Pressable>
          </View>

          <View style={styles.featureGrid}>
            {localizedCards.map((item, index) => <Pressable key={item.key} style={({
            pressed
          }) => [styles.featureCard, pressed && styles.featureCardPressed]} onPress={() => handleActionPress(item)}>
                {({
              pressed
            }) => <>
                    <View style={[styles.featureIconWrap, pressed && styles.featureIconWrapPressed]}>
                      <Icon name={item.icon} size={18} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                    </View>
                    <Text style={[styles.featureTitle, pressed && styles.featureTitlePressed]}>{item.title}</Text>
                    <Text style={[styles.featureDesc, pressed && styles.featureDescPressed]}>{item.desc}</Text>
                    <View style={styles.featureMetaRow}>
                      <Text style={[styles.featureTag, pressed && styles.featureTagPressed]}>{item.tag}</Text>
                      <Icon name="arrow-right" size={16} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                    </View>
                  </>}
              </Pressable>)}
          </View>

          <View style={styles.collectionCard}>
            <Text style={styles.collectionEyebrow}>{copy.quickAccessEyebrow}</Text>
            <Text style={styles.collectionTitle}>{copy.quickAccessTitle}</Text>
            {localizedActions.slice(0, 4).map(item => <Pressable key={item.key} style={({
            pressed
          }) => [styles.collectionRow, pressed && styles.collectionRowPressed]} onPress={() => handleActionPress(item)}>
                {({
              pressed
            }) => <>
                    <View style={[styles.collectionIcon, pressed && styles.collectionIconPressed]}>
                      <Icon name={item.icon} size={16} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                    </View>
                    <View style={styles.collectionCopy}>
                      <Text style={[styles.collectionRowTitle, pressed && styles.collectionRowTitlePressed]}>{item.title}</Text>
                      <Text style={[styles.collectionRowDesc, pressed && styles.collectionRowDescPressed]}>{item.desc}</Text>
                    </View>
                    <Icon name="chevron-right" size={16} color={pressed ? theme.accentStrong : theme.muted} />
                  </>}
              </Pressable>)}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomDock}>
        <Pressable style={({
        pressed
      }) => [styles.dockTab, pressed && styles.dockTabPressed]} onPress={() => navigation.navigate("UserBookedCounseling")}>
          {({
          pressed
        }) => <>
              <Icon name="message-circle" size={18} color={pressed ? theme.text : theme.muted} />
              <Text style={[styles.dockLabel, pressed && styles.dockLabelPressed]}>{copy.dockChat}</Text>
            </>}
        </Pressable>

        <Pressable style={({
        pressed
      }) => [styles.dockTab, styles.dockTabSos, styles.dockTabActive, pressed && styles.dockTabActivePressed]} onPress={() => navigation.navigate("EmergencySOS")}>
          <Icon name="alert-triangle" size={18} color="#FFFFFF" />
          <Text style={styles.dockLabelActive}>{translate("SOS")}</Text>
        </Pressable>

        <Pressable style={({
        pressed
      }) => [styles.dockTab, pressed && styles.dockTabPressed]} onPress={() => navigation.navigate("Settings")}>
          {({
          pressed
        }) => <>
              <Icon name="settings" size={18} color={pressed ? theme.text : theme.muted} />
              <Text style={[styles.dockLabel, pressed && styles.dockLabelPressed]}>{copy.dockSettings}</Text>
            </>}
        </Pressable>
      </View>
      <FloatingHelpChat bottom={110} fabBottom={145} />
    </SafeAreaView>;
};
function createStyles(theme, isDark, isWide, contentWidth) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    scroll: {
      flex: 1
    },
    scrollContent: {
      paddingBottom: 124
    },
    page: {
      width: "100%",
      maxWidth: contentWidth,
      alignSelf: "center",
      paddingHorizontal: 12,
      paddingTop: 12
    },
    heroCard: {
      borderRadius: 32,
      backgroundColor: theme.surface,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.26 : 0.09,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 10
      },
      elevation: 4,
      marginBottom: 20
    },
    heroGlow: {
      position: "absolute",
      width: 240,
      height: 240,
      borderRadius: 999,
      backgroundColor: theme.accentSoft,
      top: -80,
      right: -60
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center"
    },
    softPressed: {
      opacity: 0.85,
      transform: [{
        scale: 0.98
      }]
    },
    heroTitle: {
      marginTop: 22,
      color: theme.text,
      fontSize: isWide ? 34 : 30,
      fontWeight: "800",
      lineHeight: isWide ? 40 : 36,
      letterSpacing: -1.1,
      maxWidth: 680
    },
    heroSubtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 14,
      lineHeight: 22,
      maxWidth: 620
    },
    searchShell: {
      marginTop: 20,
      borderRadius: 20,
      backgroundColor: theme.surfaceElevated || theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 10
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      paddingVertical: 0
    },
    searchClear: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft
    },
    searchResults: {
      marginTop: 14,
      gap: 10
    },
    searchHint: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 12,
      fontWeight: "700"
    },
    searchResultItem: {
      backgroundColor: theme.surfaceElevated || theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      flexDirection: "row",
      alignItems: "center"
    },
    searchResultItemPressed: {
      backgroundColor: theme.accentStrong,
      borderColor: theme.accentStrong
    },
    searchResultIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12
    },
    searchResultIconPressed: {
      backgroundColor: "rgba(255,255,255,0.18)"
    },
    searchResultCopy: {
      flex: 1,
      paddingRight: 10
    },
    searchResultTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700"
    },
    searchResultTitlePressed: {
      color: "#FFFFFF"
    },
    searchResultDesc: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 2
    },
    searchResultDescPressed: {
      color: "rgba(255,255,255,0.84)"
    },
    noResultsText: {
      color: theme.muted,
      textAlign: "center",
      paddingVertical: 12,
      fontSize: 13,
      fontWeight: "700"
    },
    statRow: {
      marginTop: 20,
      flexDirection: isWide ? "row" : "column",
      gap: 12
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.surfaceElevated || theme.surfaceSoft,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border
    },
    statValue: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.6
    },
    statLabel: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700",
      marginTop: 8
    },
    statNote: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 4
    },
    sectionHeader: {
      marginTop: 6,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 12
    },
    sectionEyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1
    },
    sectionTitle: {
      marginTop: 4,
      color: theme.text,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.8
    },
    sectionLink: {
      backgroundColor: theme.surface,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.border
    },
    sectionLinkText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700"
    },
    featureGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12
    },
    featureCard: {
      width: isWide ? "31.9%" : "48.2%",
      minHeight: 172,
      backgroundColor: theme.surface,
      borderRadius: 26,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.18 : 0.06,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 6
      },
      elevation: 3
    },
    featureCardPressed: {
      backgroundColor: theme.accentStrong,
      borderColor: theme.accentStrong
    },
    featureIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18
    },
    featureIconWrapPressed: {
      backgroundColor: "rgba(255,255,255,0.18)"
    },
    featureTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: -0.4
    },
    featureTitlePressed: {
      color: "#FFFFFF"
    },
    featureDesc: {
      marginTop: 8,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      minHeight: 54
    },
    featureDescPressed: {
      color: "rgba(255,255,255,0.84)"
    },
    featureMetaRow: {
      marginTop: "auto",
      paddingTop: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    featureTag: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1
    },
    featureTagPressed: {
      color: "rgba(255,255,255,0.84)"
    },
    collectionCard: {
      marginTop: 20,
      width: "100%",
      maxWidth: isWide ? 560 : 680,
      alignSelf: "center",
      backgroundColor: theme.surface,
      borderRadius: 28,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border
    },
    collectionEyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1
    },
    collectionTitle: {
      marginTop: 6,
      color: theme.text,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: -0.6,
      marginBottom: 14
    },
    collectionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border
    },
    collectionRowPressed: {
      backgroundColor: theme.surfaceElevated || theme.surfaceSoft,
      borderRadius: 18,
      paddingHorizontal: 10
    },
    collectionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    collectionIconPressed: {
      backgroundColor: theme.accentStrong
    },
    collectionCopy: {
      flex: 1
    },
    collectionRowTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700"
    },
    collectionRowTitlePressed: {
      color: theme.accentStrong
    },
    collectionRowDesc: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 2
    },
    collectionRowDescPressed: {
      color: theme.text
    },
    bottomDock: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 18,
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      padding: 8,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.24 : 0.12,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 8
      },
      elevation: 6
    },
    dockTab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      paddingVertical: 12,
      gap: 4
    },
    dockTabSos: {
      flex: 1.18,
      paddingVertical: 16
    },
    dockTabActive: {
      backgroundColor: theme.accentStrong
    },
    dockTabPressed: {
      backgroundColor: theme.surfaceElevated || theme.surfaceSoft
    },
    dockTabActivePressed: {
      opacity: 0.92
    },
    dockLabel: {
      color: theme.muted,
      fontSize: 11,
      fontWeight: "700"
    },
    dockLabelPressed: {
      color: theme.text
    },
    dockLabelActive: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800"
    }
  };
}
export default HomeScreen;

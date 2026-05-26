import React, { useCallback, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { getLocalizedCopy, useResolvedAppLanguage } from "../utils/localization";

const COPY_BY_LANGUAGE = {
  English: {
    back: "Back",
    eyebrow: "Reporting Hub",
    title: "Choose the report path that matches the issue fastest.",
    subtitle: "Clear categories reduce mistakes and help the right team respond faster.",
    cards: [
      {
        title: "Crime Reporting",
        desc: "Submit crime-related incidents with a more direct and safety-focused flow.",
        tag: "High priority",
        icon: "shield",
        tone: "danger",
        onPress: (navigation) => navigation.navigate("CrimeReportingHome"),
      },
      {
        title: "Waste Reporting",
        desc: "Report garbage, sanitation, and local municipal cleanup issues.",
        tag: "Municipality",
        icon: "trash-2",
        tone: "default",
        onPress: (navigation) =>
          navigation.navigate("MunicipalityReportCreate", {
            category: "waste management",
          }),
      },
      {
        title: "Road Complaints",
        desc: "Flag potholes, broken surfaces, and public road hazards quickly.",
        tag: "Infrastructure",
        icon: "alert-circle",
        tone: "default",
        onPress: (navigation) =>
          navigation.navigate("MunicipalityReportCreate", {
            category: "road complaint",
          }),
      },
    ],
  },
  Nepali: {
    back: "फिर्ता",
    eyebrow: "रिपोर्टिङ केन्द्र",
    title: "समस्यासँग सबैभन्दा मिल्ने रिपोर्ट प्रकार छान्नुहोस्।",
    subtitle: "स्पष्ट श्रेणीहरूले गल्ती घटाउँछन् र सही टोलीलाई छिटो प्रतिक्रिया दिन मद्दत गर्छन्।",
    cards: [
      {
        title: "अपराध रिपोर्टिङ",
        desc: "अपराधसम्बन्धी घटनाहरू अझै स्पष्ट र सुरक्षा केन्द्रित प्रक्रियाबाट पठाउनुहोस्।",
        tag: "उच्च प्राथमिकता",
        icon: "shield",
        tone: "danger",
        onPress: (navigation) => navigation.navigate("CrimeReportingHome"),
      },
      {
        title: "फोहोर रिपोर्टिङ",
        desc: "फोहोर, सरसफाइ र स्थानीय सफाइसम्बन्धी समस्या रिपोर्ट गर्नुहोस्।",
        tag: "नगरपालिका",
        icon: "trash-2",
        tone: "default",
        onPress: (navigation) =>
          navigation.navigate("MunicipalityReportCreate", {
            category: "waste management",
          }),
      },
      {
        title: "सडक गुनासो",
        desc: "खाल्डाखुल्डी, बिग्रिएको सतह र सार्वजनिक सडक जोखिमहरू छिटो जानकारी दिनुहोस्।",
        tag: "पूर्वाधार",
        icon: "alert-circle",
        tone: "default",
        onPress: (navigation) =>
          navigation.navigate("MunicipalityReportCreate", {
            category: "road complaint",
          }),
      },
    ],
  },
};

const ReportingHomeScreen = ({ navigation }) => {
  const { theme, isDark } = useAppTheme();
  const { language, refreshLanguage } = useResolvedAppLanguage();
  const copy = useMemo(() => getLocalizedCopy(COPY_BY_LANGUAGE, language), [language]);
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const styles = useMemo(
    () => StyleSheet.create(createStyles(theme, isDark, isWide)),
    [theme, isDark, isWide]
  );
  useFocusEffect(useCallback(() => {
    refreshLanguage();
  }, [refreshLanguage]));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          <View style={styles.hero}>
            <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <View style={styles.backIconWrap}>
                <Icon name="arrow-left" size={18} color={theme.text} />
              </View>
              <Text style={styles.backText}>{copy.back}</Text>
            </TouchableOpacity>

            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <View style={styles.grid}>
            {copy.cards.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={[styles.card, item.tone === "danger" && styles.cardDanger]}
                onPress={() => item.onPress(navigation)}
                activeOpacity={0.92}
              >
                <View style={[styles.iconWrap, item.tone === "danger" && styles.iconWrapDanger]}>
                  <Icon
                    name={item.icon}
                    size={18}
                    color={item.tone === "danger" ? "#FFFFFF" : theme.accentStrong}
                  />
                </View>
                <Text style={[styles.cardTitle, item.tone === "danger" && styles.cardTitleDanger]}>
                  {item.title}
                </Text>
                <Text style={[styles.cardDesc, item.tone === "danger" && styles.cardDescDanger]}>
                  {item.desc}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.cardTag, item.tone === "danger" && styles.cardTagDanger]}>
                    {item.tag}
                  </Text>
                  <Icon
                    name="arrow-up-right"
                    size={16}
                    color={item.tone === "danger" ? "#FFFFFF" : theme.accentStrong}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 32,
      padding: 24,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.2 : 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
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
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    backText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700",
    },
    eyebrow: {
      marginTop: 24,
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: isWide ? 34 : 30,
      lineHeight: isWide ? 40 : 36,
      fontWeight: "800",
      letterSpacing: -1,
      maxWidth: 720,
    },
    subtitle: {
      marginTop: 12,
      color: theme.muted,
      fontSize: 14,
      lineHeight: 22,
      maxWidth: 680,
    },
    grid: {
      marginTop: 16,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    card: {
      width: isWide ? "32.2%" : "100%",
      minHeight: 220,
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.16 : 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    cardDanger: {
      backgroundColor: theme.accentStrong,
      borderColor: theme.accentStrong,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapDanger: {
      backgroundColor: "rgba(255,255,255,0.14)",
    },
    cardTitle: {
      marginTop: 18,
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    cardTitleDanger: {
      color: "#FFFFFF",
    },
    cardDesc: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      flex: 1,
    },
    cardDescDanger: {
      color: "rgba(255,255,255,0.82)",
    },
    cardFooter: {
      marginTop: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardTag: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    cardTagDanger: {
      color: "rgba(255,255,255,0.84)",
    },
  };
}

export default ReportingHomeScreen;

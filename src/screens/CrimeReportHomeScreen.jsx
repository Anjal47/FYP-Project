import React, { useCallback, useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { getLocalizedCopy, useResolvedAppLanguage } from "../utils/localization";

const COPY_BY_LANGUAGE = {
  English: {
    back: "Back",
    eyebrow: "Crime Reporting",
    title: "Choose a report type",
    subtitle: "Pick the closest match below and we will open one simple report form.",
    urgentNote: "If this is urgent or dangerous right now, contact emergency services first.",
    categories: [
      {
        key: "domestic-violence",
        title: "Domestic Violence",
        category: "Domestic Violence",
        desc: "Abuse, threats, or violence at home.",
        icon: "shield",
      },
      {
        key: "harassment",
        title: "Harassment",
        category: "Harassment",
        desc: "Threats, stalking, or repeated intimidation.",
        icon: "slash",
      },
      {
        key: "theft",
        title: "Theft",
        category: "Theft",
        desc: "Stolen items, robbery, or missing property.",
        icon: "lock",
      },
      {
        key: "cyber-crime",
        title: "Cyber Crime",
        category: "Cyber Crime",
        desc: "Online scams, blackmail, or digital abuse.",
        icon: "monitor",
      },
      {
        key: "assault",
        title: "Assault",
        category: "Assault",
        desc: "Physical attack, injury, or violent harm.",
        icon: "alert-triangle",
      },
      {
        key: "fraud",
        title: "Fraud",
        category: "Fraud",
        desc: "Cheating, fake requests, or money scams.",
        icon: "file-text",
      },
    ],
  },
  Nepali: {
    back: "फिर्ता",
    eyebrow: "अपराध रिपोर्टिङ",
    title: "रिपोर्टको प्रकार छान्नुहोस्",
    subtitle: "तलको सबैभन्दा मिल्दो विकल्प छान्नुहोस्, हामी एउटै सरल रिपोर्ट फारम खोलिदिन्छौं।",
    urgentNote: "यदि अहिले अवस्था अत्यन्तै जोखिमपूर्ण वा आपतकालीन छ भने, पहिले आपतकालीन सेवामा सम्पर्क गर्नुहोस्।",
    categories: [
      {
        key: "domestic-violence",
        title: "घरेलु हिंसा",
        category: "Domestic Violence",
        desc: "घरभित्र हुने दुव्र्यवहार, धम्की वा हिंसा।",
        icon: "shield",
      },
      {
        key: "harassment",
        title: "हैरानी",
        category: "Harassment",
        desc: "धम्की, पछ्याउने व्यवहार वा बारम्बार डर देखाउने काम।",
        icon: "slash",
      },
      {
        key: "theft",
        title: "चोरी",
        category: "Theft",
        desc: "चोरी, लुटपाट वा हराएको सम्पत्ति।",
        icon: "lock",
      },
      {
        key: "cyber-crime",
        title: "साइबर अपराध",
        category: "Cyber Crime",
        desc: "अनलाइन ठगी, ब्ल्याकमेल वा डिजिटल दुव्र्यवहार।",
        icon: "monitor",
      },
      {
        key: "assault",
        title: "आक्रमण",
        category: "Assault",
        desc: "शारीरिक आक्रमण, चोटपटक वा हिंसात्मक क्षति।",
        icon: "alert-triangle",
      },
      {
        key: "fraud",
        title: "ठगी",
        category: "Fraud",
        desc: "धोखाधडी, नक्कली माग वा पैसासम्बन्धी ठगी।",
        icon: "file-text",
      },
    ],
  },
};

export default function CrimeReportingHomeScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const { language, refreshLanguage } = useResolvedAppLanguage();
  const copy = useMemo(() => getLocalizedCopy(COPY_BY_LANGUAGE, language), [language]);
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  useFocusEffect(useCallback(() => {
    refreshLanguage();
  }, [refreshLanguage]));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Pressable style={styles.backRow} onPress={() => navigation.goBack?.()}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{copy.back}</Text>
          </Pressable>

          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View style={styles.quickNote}>
          <Icon name="info" size={16} color={theme.accentStrong} />
          <Text style={styles.quickNoteText}>{copy.urgentNote}</Text>
        </View>

        <View style={styles.list}>
          {copy.categories.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.rowCard, pressed && styles.rowCardPressed]}
              onPress={() =>
                navigation.navigate("CrimeReport", {
                  category: item.category,
                  categoryKey: item.key,
                  displayTitle: item.title,
                })
              }
            >
              {({ pressed }) => (
                <>
                  <View style={[styles.rowIconWrap, pressed && styles.rowIconWrapPressed]}>
                    <Icon name={item.icon} size={18} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, pressed && styles.rowTitlePressed]}>{item.title}</Text>
                    <Text style={[styles.rowDesc, pressed && styles.rowDescPressed]}>{item.desc}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={pressed ? "#FFFFFF" : theme.muted} />
                </>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme, isDark) {
  return {
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 14, paddingBottom: 32 },
    headerCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.18 : 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 10,
      marginBottom: 18,
    },
    backIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    backText: { color: theme.text, fontSize: 13, fontWeight: "700" },
    eyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "800",
    },
    subtitle: {
      marginTop: 8,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
    },
    quickNote: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: theme.accentSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 14,
    },
    quickNoteText: {
      flex: 1,
      color: theme.text,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "600",
    },
    list: { gap: 10 },
    rowCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
    },
    rowCardPressed: {
      backgroundColor: theme.accentStrong,
      borderColor: theme.accentStrong,
    },
    rowIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    rowIconWrapPressed: {
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    rowCopy: { flex: 1 },
    rowTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
    },
    rowTitlePressed: {
      color: "#FFFFFF",
    },
    rowDesc: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    rowDescPressed: {
      color: "rgba(255,255,255,0.84)",
    },
  };
}

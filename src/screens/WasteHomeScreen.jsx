import React, { useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { useLocalizedCopy } from "../utils/localization";

const COPY_BY_LANGUAGE = {
  English: {
    back: "Back",
    eyebrow: "Waste",
    title: "Keep civic cleanup reporting simple, direct, and usable.",
    subtitle:
      "File a waste issue, submit a municipality report, or check updates from one calmer home screen.",
    items: [
      {
        key: "waste-report",
        title: "Report Waste Issue",
        subtitle: "Garbage, overflow, dumping.",
        icon: "trash-2",
        screen: "WasteReport",
      },
      {
        key: "waste-status",
        title: "Track Reports",
        subtitle: "Check what has been reviewed.",
        icon: "file-text",
        screen: "WasteReportStatus",
      },
      {
        key: "municipality",
        title: "Municipality Report",
        subtitle: "Send a structured civic complaint.",
        icon: "map",
        screen: "MunicipalityReportCreate",
      },
    ],
  },
  Nepali: {
    back: "फिर्ता",
    eyebrow: "फोहोर",
    title: "सार्वजनिक सरसफाइसम्बन्धी रिपोर्टिङ सरल, सीधा र उपयोगी बनाउनुहोस्।",
    subtitle:
      "फोहोरसम्बन्धी समस्या दर्ता गर्नुहोस्, नगरपालिका रिपोर्ट पठाउनुहोस् वा एउटै शान्त होम स्क्रिनबाट अपडेट हेर्नुहोस्।",
    items: [
      {
        key: "waste-report",
        title: "फोहोर समस्या रिपोर्ट गर्नुहोस्",
        subtitle: "फोहोर, थुप्रो र अवैध फालाइ।",
        icon: "trash-2",
        screen: "WasteReport",
      },
      {
        key: "waste-status",
        title: "रिपोर्ट ट्र्याक गर्नुहोस्",
        subtitle: "कुन रिपोर्ट समीक्षा भयो हेर्नुहोस्।",
        icon: "file-text",
        screen: "WasteReportStatus",
      },
      {
        key: "municipality",
        title: "नगरपालिका रिपोर्ट",
        subtitle: "संरचित नागरिक गुनासो पठाउनुहोस्।",
        icon: "map",
        screen: "MunicipalityReportCreate",
      },
    ],
  },
};

export default function WasteHomeScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const copy = useLocalizedCopy(COPY_BY_LANGUAGE);
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable style={styles.backRow} onPress={() => navigation.goBack?.()}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{copy.back}</Text>
          </Pressable>

          <View style={styles.glow} />
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View style={styles.stack}>
          {copy.items.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate(item.screen)}
            >
              {({ pressed }) => (
                <>
                  <View style={[styles.iconWrap, pressed && styles.iconWrapPressed]}>
                    <Icon name={item.icon} size={18} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text style={[styles.cardTitle, pressed && styles.cardTitlePressed]}>{item.title}</Text>
                    <Text style={[styles.cardSubtitle, pressed && styles.cardSubtitlePressed]}>{item.subtitle}</Text>
                  </View>
                  <Icon name="arrow-up-right" size={16} color={pressed ? "#FFFFFF" : theme.accentStrong} />
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
    content: { padding: 12, paddingBottom: 32 },
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
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    glow: {
      position: "absolute",
      top: -84,
      right: -60,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: theme.accentSoft,
    },
    backRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 10, marginBottom: 20 },
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
    backText: { color: theme.text, fontSize: 13, fontWeight: "700" },
    eyebrow: { color: theme.accentStrong, fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
    title: { marginTop: 8, color: theme.text, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.8, maxWidth: 540 },
    subtitle: { marginTop: 10, color: theme.muted, fontSize: 13, lineHeight: 20, maxWidth: 520 },
    stack: { gap: 12 },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    cardPressed: { backgroundColor: theme.accentStrong, borderColor: theme.accentStrong },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapPressed: { backgroundColor: "rgba(255,255,255,0.14)" },
    cardCopy: { flex: 1 },
    cardTitle: { color: theme.text, fontSize: 15, fontWeight: "800" },
    cardTitlePressed: { color: "#FFFFFF" },
    cardSubtitle: { marginTop: 4, color: theme.muted, fontSize: 12, lineHeight: 18 },
    cardSubtitlePressed: { color: "rgba(255,255,255,0.82)" },
  };
}

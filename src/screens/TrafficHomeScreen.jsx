import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { useLocalizedCopy } from "../utils/localization";

const COPY_BY_LANGUAGE = {
  English: {
    back: "Back",
    eyebrow: "Traffic",
    title: "Road safety tools should be quick to scan and easy to act on.",
    subtitle:
      "Report incidents, review rules, pay fines, or check your submissions from one cleaner dashboard.",
    actions: [
      {
        title: "Report a Violation",
        subtitle: "Unsafe driving, incidents, and on-road risk reports.",
        icon: "alert-octagon",
        screen: "TrafficReport",
      },
      {
        title: "View Traffic Rules",
        subtitle: "Understand road rules and public-safety expectations.",
        icon: "book-open",
        screen: "TrafficRules",
      },
      {
        title: "Pay Fine",
        subtitle: "Check and clear traffic penalties in one flow.",
        icon: "credit-card",
        screen: "FinePayment",
      },
      {
        title: "My Traffic Reports",
        subtitle: "Track previously submitted reports and statuses.",
        icon: "file-text",
        screen: "TrafficReportStatus",
      },
    ],
  },
  Nepali: {
    back: "फिर्ता",
    eyebrow: "ट्राफिक",
    title: "सडक सुरक्षासम्बन्धी उपकरणहरू छिटो बुझिने र तुरुन्तै प्रयोग गर्न मिल्ने हुनुपर्छ।",
    subtitle:
      "घटना रिपोर्ट गर्नुहोस्, नियमहरू हेर्नुहोस्, जरिवाना तिर्नुहोस् वा आफ्ना विवरणहरू एउटै सफा ड्यासबोर्डबाट जाँच्नुहोस्।",
    actions: [
      {
        title: "उल्लङ्घन रिपोर्ट गर्नुहोस्",
        subtitle: "असुरक्षित ड्राइभिङ, घटना र सडक जोखिमसम्बन्धी रिपोर्टहरू।",
        icon: "alert-octagon",
        screen: "TrafficReport",
      },
      {
        title: "ट्राफिक नियमहरू हेर्नुहोस्",
        subtitle: "सडक नियम र सार्वजनिक सुरक्षासम्बन्धी अपेक्षाहरू बुझ्नुहोस्।",
        icon: "book-open",
        screen: "TrafficRules",
      },
      {
        title: "जरिवाना तिर्नुहोस्",
        subtitle: "ट्राफिक जरिवाना जाँच र भुक्तानी एउटै प्रक्रियाबाट गर्नुहोस्।",
        icon: "credit-card",
        screen: "FinePayment",
      },
      {
        title: "मेरा ट्राफिक रिपोर्टहरू",
        subtitle: "पहिले पठाइएका रिपोर्ट र तिनको स्थिति ट्र्याक गर्नुहोस्।",
        icon: "file-text",
        screen: "TrafficReportStatus",
      },
    ],
  },
};

export default function TrafficHomeScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const copy = useLocalizedCopy(COPY_BY_LANGUAGE);
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{copy.back}</Text>
          </Pressable>

          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View style={styles.grid}>
          {copy.actions.map((item) => (
            <Pressable
              key={item.title}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate(item.screen)}
            >
              {({ pressed }) => (
                <>
                  <View style={[styles.cardIconWrap, pressed && styles.cardIconWrapPressed]}>
                    <Icon name={item.icon} size={18} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                  </View>
                  <Text style={[styles.cardTitle, pressed && styles.cardTitlePressed]}>{item.title}</Text>
                  <Text style={[styles.cardSubtitle, pressed && styles.cardSubtitlePressed]}>
                    {item.subtitle}
                  </Text>
                  <Icon
                    name="arrow-up-right"
                    size={16}
                    color={pressed ? "#FFFFFF" : theme.accentStrong}
                    style={styles.arrow}
                  />
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
    content: { padding: 12, paddingBottom: 140 },
    hero: {
      backgroundColor: theme.surface,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.22 : 0.08,
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
    backText: { color: theme.text, fontSize: 13, fontWeight: "700" },
    eyebrow: {
      marginTop: 22,
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: 29,
      lineHeight: 35,
      fontWeight: "800",
      letterSpacing: -0.9,
      maxWidth: 560,
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 520,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    card: {
      width: "48.2%",
      minHeight: 188,
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
    },
    cardPressed: {
      backgroundColor: theme.accentStrong,
      borderColor: theme.accentStrong,
    },
    cardIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    cardIconWrapPressed: {
      backgroundColor: "rgba(255,255,255,0.14)",
    },
    cardTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 8,
    },
    cardTitlePressed: {
      color: "#FFFFFF",
    },
    cardSubtitle: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      paddingRight: 12,
    },
    cardSubtitlePressed: {
      color: "rgba(255,255,255,0.82)",
    },
    arrow: {
      marginTop: "auto",
      alignSelf: "flex-end",
    },
  };
}

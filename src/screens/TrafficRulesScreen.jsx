import React, { useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { useTranslate } from "../utils/localization";
const rules = [{
  id: 1,
  titleEn: "Always carry a valid driving licence.",
  bodyEn: "Drivers must carry a valid licence and registration documents on public roads."
}, {
  id: 2,
  titleEn: "Wear seat belt and helmet.",
  bodyEn: "Car occupants should use seat belts and two-wheeler riders must wear certified helmets."
}, {
  id: 3,
  titleEn: "Do not drive under alcohol or drugs.",
  bodyEn: "Anything that reduces judgement or focus makes driving unsafe and illegal."
}, {
  id: 4,
  titleEn: "Follow lane discipline and speed limits.",
  bodyEn: "Stay in marked lanes and obey speed limits set by traffic police and local authority."
}, {
  id: 5,
  titleEn: "Give priority to pedestrians.",
  bodyEn: "Slow near crossings, schools, and hospitals and allow safe pedestrian movement."
}];
export default function TrafficRulesScreen({
  navigation
}) {
  const translate = useTranslate();
  const localizedRules = rules.map(rule => ({
    ...rule,
    title: translate(rule.titleEn),
    body: translate(rule.bodyEn)
  }));
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{translate("Back")}</Text>
          </TouchableOpacity>

          <View style={styles.glow} />
          <Text style={styles.eyebrow}>{translate("Traffic Rules")}</Text>
          <Text style={styles.title}>{translate("Keep road guidance tighter, calmer, and easier to scan.")}</Text>
          <Text style={styles.subtitle}>{translate("The rules are now presented as short cards so users can understand key safety guidance faster.")}</Text>
        </View>

        <View style={styles.stack}>
          {localizedRules.map(rule => <View key={rule.id} style={styles.ruleCard}>
              <Text style={styles.badge}>{translate("Rule")} {rule.id}</Text>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
              <Text style={styles.ruleBody}>{rule.body}</Text>
            </View>)}
        </View>
      </ScrollView>
    </SafeAreaView>;
}
function createStyles(theme, isDark) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background
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
      elevation: 4
    },
    glow: {
      position: "absolute",
      top: -84,
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
      maxWidth: 540
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 520
    },
    stack: {
      gap: 12
    },
    ruleCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18
    },
    badge: {
      alignSelf: "flex-start",
      backgroundColor: theme.accentSoft,
      color: theme.accentStrong,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 10
    },
    ruleTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800"
    },
    ruleBody: {
      marginTop: 6,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    }
  };
}

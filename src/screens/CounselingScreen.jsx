import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { useTranslate } from "../utils/localization";
const actions = [{
  label: "Visit Counselors",
  description: "Start with guided counseling support and booking.",
  icon: "message-circle",
  action: "CounselingForm"
}, {
  label: "Urgent Therapy",
  description: "Move into therapy support when you need faster deeper care.",
  icon: "activity",
  action: "TherapyScreen"
}, {
  label: "Connect to NGOs",
  description: "Reach support organizations and practical local help.",
  icon: "users",
  action: "ConnectToNGOs"
}];
export default function CounselingScreen({
  navigation
}) {
  const translate = useTranslate();
  const localizedActions = actions.map(item => ({
    ...item,
    label: translate(item.label),
    description: translate(item.description)
  }));
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable style={styles.backRow} onPress={() => navigation?.goBack?.()}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{translate("Back")}</Text>
          </Pressable>

          <Text style={styles.eyebrow}>{translate("Care Hub")}</Text>
          <Text style={styles.title}>{translate("Choose the kind of support that fits what you need right now.")}</Text>
          <Text style={styles.subtitle}>{translate("Counseling, therapy, and NGO support now live in one cleaner flow with clearer choices.")}</Text>
        </View>

        <View style={styles.stack}>
          {localizedActions.map(item => <Pressable key={item.action} style={({
          pressed
        }) => [styles.card, pressed && styles.cardPressed]} onPress={() => navigation.navigate(item.action)}>
              {({
            pressed
          }) => <>
                  <View style={[styles.iconWrap, pressed && styles.iconWrapPressed]}>
                    <Icon name={item.icon} size={18} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text style={[styles.cardTitle, pressed && styles.cardTitlePressed]}>{item.label}</Text>
                    <Text style={[styles.cardDesc, pressed && styles.cardDescPressed]}>{item.description}</Text>
                  </View>
                  <Icon name="arrow-up-right" size={16} color={pressed ? "#FFFFFF" : theme.accentStrong} />
                </>}
            </Pressable>)}
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
      paddingBottom: 140
    },
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
      shadowOffset: {
        width: 0,
        height: 10
      },
      elevation: 4
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 10
    },
    backIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border
    },
    backText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700"
    },
    eyebrow: {
      marginTop: 22,
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: 29,
      lineHeight: 35,
      fontWeight: "800",
      letterSpacing: -0.9,
      maxWidth: 540
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 500
    },
    stack: {
      gap: 12
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 14
    },
    cardPressed: {
      backgroundColor: theme.accentStrong,
      borderColor: theme.accentStrong
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    iconWrapPressed: {
      backgroundColor: "rgba(255,255,255,0.14)"
    },
    cardCopy: {
      flex: 1
    },
    cardTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    cardTitlePressed: {
      color: "#FFFFFF"
    },
    cardDesc: {
      marginTop: 4,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18
    },
    cardDescPressed: {
      color: "rgba(255,255,255,0.82)"
    }
  };
}

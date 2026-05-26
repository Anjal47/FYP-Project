import React, { useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, useWindowDimensions } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { useTranslate } from "../utils/localization";
const emergencyNumbers = [{
  label: "Police",
  number: "100",
  description: "Immediate danger, crime, or urgent safety threats.",
  icon: "shield"
}, {
  label: "Fire Service",
  number: "101",
  description: "Fire, smoke, explosions, or fast evacuation support.",
  icon: "droplet"
}, {
  label: "Ambulance",
  number: "102",
  description: "Medical emergencies and serious injury response.",
  icon: "heart"
}, {
  label: "Traffic Control",
  number: "103",
  description: "Accidents, unsafe roads, or urgent traffic issues.",
  icon: "map"
}, {
  label: "Child Helpline",
  number: "1098",
  description: "Support for children at risk or in distress.",
  icon: "users"
}];
const wellbeingNumbers = [{
  label: "Suicide Prevention Helpline",
  number: "1166",
  description: "24/7 confidential emotional crisis support."
}, {
  label: "Women & GBV Support",
  number: "1145",
  description: "Violence, abuse, and safety guidance from the National Women Commission."
}];
const SupportScreen = ({
  navigation
}) => {
  const translate = useTranslate();
  const localizedEmergencyNumbers = emergencyNumbers.map(item => ({
    ...item,
    label: translate(item.label),
    description: translate(item.description)
  }));
  const localizedWellbeingNumbers = wellbeingNumbers.map(item => ({
    ...item,
    label: translate(item.label),
    description: translate(item.description)
  }));
  const localizedGuidePoints = guidePoints.map(item => ({
    ...item,
    title: translate(item.title),
    desc: translate(item.desc)
  }));
  const {
    theme,
    isDark
  } = useAppTheme();
  const {
    width
  } = useWindowDimensions();
  const isWide = width >= 900;
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark, isWide)), [theme, isDark, isWide]);
  const callNumber = num => {
    Linking.openURL(`tel:${num}`).catch(() => Alert.alert(translate("Error"), translate("Unable to open dialer on this device.")));
  };
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          <View style={styles.hero}>
            <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <View style={styles.backIconWrap}>
                <Icon name="arrow-left" size={18} color={theme.text} />
              </View>
              <Text style={styles.backText}>{translate("Back")}</Text>
            </TouchableOpacity>

            <Text style={styles.eyebrow}>{translate("Support Directory")}</Text>
            <Text style={styles.title}>{translate("Critical help lines should be calm, clear, and one tap away.")}</Text>
            <Text style={styles.subtitle}>{translate("Use this directory for immediate services, crisis support, and practical next steps in Nepal.")}</Text>
          </View>

          <View style={styles.dualColumn}>
            <View style={styles.primaryColumn}>
              <Text style={styles.sectionTitle}>{translate("Emergency Numbers")}</Text>
              {localizedEmergencyNumbers.map(item => <View key={item.number} style={styles.callCard}>
                  <View style={styles.callCardHeader}>
                    <View style={styles.callCardIcon}>
                      <Icon name={item.icon} size={18} color={theme.accentStrong} />
                    </View>
                    <View style={styles.callCardCopy}>
                      <Text style={styles.callCardTitle}>{item.label}</Text>
                      <Text style={styles.callCardDesc}>{item.description}</Text>
                    </View>
                    <TouchableOpacity style={styles.callButton} onPress={() => callNumber(item.number)} activeOpacity={0.9}>
                      <Text style={styles.callButtonNumber}>{item.number}</Text>
                      <Icon name="phone" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>)}
            </View>

            <View style={styles.secondaryColumn}>
              <View style={styles.infoPanel}>
                <Text style={styles.sectionTitle}>{translate("Mental Health & Safety")}</Text>
                {localizedWellbeingNumbers.map(item => <TouchableOpacity key={item.number} style={styles.infoRow} onPress={() => callNumber(item.number)} activeOpacity={0.9}>
                    <View style={styles.infoNumberWrap}>
                      <Text style={styles.infoNumber}>{item.number}</Text>
                    </View>
                    <View style={styles.infoCopy}>
                      <Text style={styles.infoTitle}>{item.label}</Text>
                      <Text style={styles.infoDesc}>{item.description}</Text>
                    </View>
                  </TouchableOpacity>)}
              </View>

              <View style={styles.guidePanel}>
                <Text style={styles.sectionTitle}>{translate("What To Do First")}</Text>
                {localizedGuidePoints.map(item => <View key={item.title} style={styles.guideRow}>
                    <View style={styles.guideDot} />
                    <View style={styles.guideCopy}>
                      <Text style={styles.guideTitle}>{item.title}</Text>
                      <Text style={styles.guideDesc}>{item.desc}</Text>
                    </View>
                  </View>)}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>;
};
const guidePoints = [{
  title: "If the situation is immediate",
  desc: "Call police or ambulance first before filling any report flow in the app."
}, {
  title: "If the danger is emotional or personal",
  desc: "Use the crisis and women’s support lines to talk to a real person quickly."
}, {
  title: "If you need evidence or follow-up",
  desc: "Use the app’s reporting flows after you are safe so the issue can be documented properly."
}];
function createStyles(theme, isDark, isWide) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    content: {
      padding: 12,
      paddingBottom: 140
    },
    shell: {
      width: "100%",
      maxWidth: 1080,
      alignSelf: "center"
    },
    hero: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 32,
      padding: 24,
      marginBottom: 16
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
      marginTop: 22,
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1
    },
    title: {
      marginTop: 8,
      color: theme.text,
      fontSize: isWide ? 34 : 29,
      lineHeight: isWide ? 40 : 34,
      fontWeight: "800",
      letterSpacing: -1,
      maxWidth: 760
    },
    subtitle: {
      marginTop: 12,
      color: theme.muted,
      fontSize: 14,
      lineHeight: 22,
      maxWidth: 700
    },
    dualColumn: {
      flexDirection: isWide ? "row" : "column",
      gap: 12
    },
    primaryColumn: {
      flex: 1.2,
      gap: 12
    },
    secondaryColumn: {
      flex: 0.9,
      gap: 12
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginBottom: 12
    },
    callCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18
    },
    callCardHeader: {
      flexDirection: "row",
      alignItems: "center"
    },
    callCardIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12
    },
    callCardCopy: {
      flex: 1,
      paddingRight: 10
    },
    callCardTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    callCardDesc: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4
    },
    callButton: {
      backgroundColor: theme.accentStrong,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minWidth: 78
    },
    callButtonNumber: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800"
    },
    infoPanel: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border
    },
    infoNumberWrap: {
      minWidth: 66,
      borderRadius: 14,
      backgroundColor: theme.accentSoft,
      paddingHorizontal: 10,
      paddingVertical: 10,
      alignItems: "center"
    },
    infoNumber: {
      color: theme.accentStrong,
      fontSize: 14,
      fontWeight: "800"
    },
    infoCopy: {
      flex: 1
    },
    infoTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700"
    },
    infoDesc: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4
    },
    guidePanel: {
      backgroundColor: theme.text,
      borderRadius: 28,
      padding: 20
    },
    guideRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingTop: 12
    },
    guideDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.accentStrong,
      marginTop: 6
    },
    guideCopy: {
      flex: 1
    },
    guideTitle: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800"
    },
    guideDesc: {
      color: "rgba(255,255,255,0.78)",
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4
    }
  };
}
export default SupportScreen;

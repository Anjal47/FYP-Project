import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { useTranslate } from "../utils/localization";
const STORAGE_KEY = "emergency_contact_number";
const sanitizePhone = raw => {
  if (!raw) return "";
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  return plus + digitsOnly;
};
export default function EmergencyContactScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  useEffect(() => {
    let mounted = true;
    const loadNumber = async () => {
      try {
        const savedNumber = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted) {
          setPhone(savedNumber || "");
        }
      } catch (error) {
        if (mounted) {
          setPhone("");
        }
      }
    };
    loadNumber();
    return () => {
      mounted = false;
    };
  }, []);
  const saveEmergencyContact = async () => {
    const cleaned = sanitizePhone(phone);
    if (!cleaned || cleaned.replace(/[^\d]/g, "").length < 6) {
      Alert.alert(translate("Invalid Number"), translate("Enter a valid emergency contact number."));
      return;
    }
    try {
      setSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, cleaned);
      Alert.alert(translate("Saved"), translate("Emergency contact updated successfully."), [{
        text: translate("OK"),
        onPress: () => navigation.goBack()
      }]);
    } catch (error) {
      Alert.alert(translate("Save Failed"), translate("Could not save emergency contact."));
    } finally {
      setSaving(false);
    }
  };
  return <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <View style={styles.backIconWrap}>
              <Icon name="arrow-left" size={18} color={theme.text} />
            </View>
            <Text style={styles.backText}>{translate("Back")}</Text>
          </TouchableOpacity>

          <Text style={styles.eyebrow}>{translate("Emergency Contact")}</Text>
          <Text style={styles.title}>{translate("Save the number AngelTouch should reach during urgent moments.")}</Text>
          <Text style={styles.subtitle}>{translate("Keep one trusted contact ready so SOS actions stay fast and predictable when you need them.")}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>{translate("Emergency Contact Number")}</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder={translate("+97798XXXXXXXX")} keyboardType="phone-pad" style={styles.input} placeholderTextColor={theme.muted} />

          <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={saveEmergencyContact} disabled={saving} activeOpacity={0.92}>
            <Text style={styles.saveText}>{saving ? "Saving..." : "Save Contact"}</Text>
          </TouchableOpacity>
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
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800",
      letterSpacing: -0.9,
      maxWidth: 560
    },
    subtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 500
    },
    formCard: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20
    },
    label: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 8
    },
    input: {
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
      color: theme.text,
      fontSize: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border
    },
    saveButton: {
      backgroundColor: theme.accentStrong,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center"
    },
    saveButtonDisabled: {
      opacity: 0.72
    },
    saveText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800"
    }
  };
}

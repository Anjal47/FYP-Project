import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import FloatingHelpChat from "../components/FloatingHelpChat";
import { useAppTheme } from "../context/ThemeContext";
import { createThemedStyles } from "../utils/themeStyles";

const ORANGE = "#FF7A1A";
const STORAGE_KEY = "emergency_contact_number";

const sanitizePhone = (raw) => {
  if (!raw) return "";
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  return plus + digitsOnly;
};

export default function EmergencyContactScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const styles = useMemo(
    () => StyleSheet.create(createThemedStyles(baseStyles, theme, isDark)),
    [theme, isDark]
  );

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
      Alert.alert("Invalid Number", "Enter a valid emergency contact number.");
      return;
    }

    try {
      setSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, cleaned);
      Alert.alert("Saved", "Emergency contact updated successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Save Failed", "Could not save emergency contact.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.title}>
            <Text style={styles.titleHighlight}> Emergency</Text>
            <Text style={styles.titleNormal}> Contact.</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>
          Save the person you want AngelTouch to call during emergencies.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Emergency Contact Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+97798XXXXXXXX"
            keyboardType="phone-pad"
            style={styles.input}
            placeholderTextColor={theme.muted}
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveEmergencyContact}
            disabled={saving}
            activeOpacity={0.9}
          >
            <Text style={styles.saveText}>
              {saving ? "Saving..." : "Save Contact"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FloatingHelpChat bottom={110} fabBottom={145} />
    </SafeAreaView>
  );
}

const baseStyles = {
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  titleHighlight: {
    color: ORANGE,
  },
  titleNormal: {
    color: "#111",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#111",
    fontSize: 15,
    marginBottom: 18,
  },
  saveButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.75,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  sidePill: {
    position: "absolute",
    right: 0,
    bottom: 110,
    width: 56,
    height: 110,
    backgroundColor: ORANGE,
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    elevation: 5,
  },
};

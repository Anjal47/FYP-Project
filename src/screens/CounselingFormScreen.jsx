import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { useAppTheme } from "../context/ThemeContext";
import { useTranslate } from "../utils/localization";
const BASE_URL = "http://10.0.2.2:5000";
const problemOptions = ["Anxiety", "Depression", "Family Issues", "Relationship Issues", "Other"];
const genderOptions = ["Male", "Female"];
const languageOptions = ["Nepali", "English"];
const modeOptions = ["Online", "Offline"];
async function apiCreateCounselingRequest(token, payload) {
  const res = await fetch(`${BASE_URL}/api/counseling/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload || {})
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to submit form");
  return json;
}
export default function CounselingFormScreen({
  navigation
}) {
  const translate = useTranslate();
  const {
    theme,
    isDark
  } = useAppTheme();
  const styles = useMemo(() => StyleSheet.create(createStyles(theme, isDark)), [theme, isDark]);
  const [problem, setProblem] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [language, setLanguage] = useState("");
  const [mode, setMode] = useState("");
  const [description, setDescription] = useState("");
  const [problemOpen, setProblemOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookedLoading, setBookedLoading] = useState(false);
  const closeAllDropdowns = () => {
    setProblemOpen(false);
    setGenderOpen(false);
    setLanguageOpen(false);
    setModeOpen(false);
  };
  const validate = () => {
    if (!problem || !age || !gender || !language || !mode) {
      Alert.alert(translate("Missing"), translate("Please fill all required fields."));
      return false;
    }
    const a = Number(age);
    if (!Number.isFinite(a) || a <= 0) {
      Alert.alert(translate("Invalid age"), translate("Please enter a valid age."));
      return false;
    }
    return true;
  };
  const bookedSessions = async () => {
    try {
      setBookedLoading(true);
      navigation.navigate("UserBookedCounseling");
    } finally {
      setBookedLoading(false);
    }
  };
  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{
            name: "Login"
          }]
        });
        return;
      }
      const payload = {
        problem,
        age: Number(age),
        gender,
        language,
        mode,
        description
      };
      const json = await apiCreateCounselingRequest(token, payload);
      const requestId = json?.request?._id || json?.request?.id;
      Alert.alert(translate("Submitted"), translate("Your counseling request is ready. Choose a counsellor next."), [{
        text: translate("Continue"),
        onPress: () => navigation.navigate("Counselors", {
          requestId
        })
      }]);
    } catch (error) {
      Alert.alert(translate("Submit failed"), error?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };
  return <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <View style={styles.backIconWrap}>
                <Icon name="arrow-left" size={18} color={theme.text} />
              </View>
              <Text style={styles.backText}>{translate("Back")}</Text>
            </TouchableOpacity>

            <View style={styles.heroGlow} />
            <Text style={styles.heroEyebrow}>{translate("Counseling Intake")}</Text>
            <Text style={styles.heroTitle}>{translate("Start with a clear request, then move into booking.")}</Text>
            <Text style={styles.heroSubtitle}>{translate("Smaller inputs, better grouping, and a calmer path to getting help.")}</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>{translate("Session details")}</Text>
            <FieldDropdown label={translate("Problem / Issue")} value={problem} placeholder={translate("Choose one")} open={problemOpen} setOpen={fn => {
            closeAllDropdowns();
            setProblemOpen(fn(problemOpen));
          }} onChoose={value => {
            setProblem(value);
            setProblemOpen(false);
          }} options={problemOptions} styles={styles} theme={theme} />

            <View style={styles.row}>
              <FieldInput label={translate("Age")} value={age} onChangeText={setAge} keyboardType="numeric" styles={styles} theme={theme} />
              <FieldDropdown label={translate("Gender")} value={gender} placeholder={translate("Select")} open={genderOpen} setOpen={fn => {
              closeAllDropdowns();
              setGenderOpen(fn(genderOpen));
            }} onChoose={value => {
              setGender(value);
              setGenderOpen(false);
            }} options={genderOptions} styles={styles} theme={theme} compact />
            </View>

            <FieldDropdown label={translate("Language Preference")} value={language} placeholder={translate("Choose language")} open={languageOpen} setOpen={fn => {
            closeAllDropdowns();
            setLanguageOpen(fn(languageOpen));
          }} onChoose={value => {
            setLanguage(value);
            setLanguageOpen(false);
          }} options={languageOptions} styles={styles} theme={theme} />

            <FieldDropdown label={translate("Mode of Communication")} value={mode} placeholder={translate("Choose mode")} open={modeOpen} setOpen={fn => {
            closeAllDropdowns();
            setModeOpen(fn(modeOpen));
          }} onChoose={value => {
            setMode(value);
            setModeOpen(false);
          }} options={modeOptions} styles={styles} theme={theme} />

            <FieldInput label={translate("Description")} value={description} onChangeText={setDescription} multiline placeholder={translate("Share any context that will help the counsellor prepare.")} styles={styles} theme={theme} />

            <TouchableOpacity style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={handleSubmit} activeOpacity={0.9} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{translate("Continue to Counsellors")}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.secondaryButton, bookedLoading && styles.buttonDisabled]} onPress={bookedSessions} activeOpacity={0.9} disabled={bookedLoading}>
              {bookedLoading ? <ActivityIndicator size="small" color={theme.text} /> : <Text style={styles.secondaryButtonText}>{translate("View Booked Sessions")}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>;
}
function FieldInput({
  label,
  styles,
  theme,
  multiline,
  ...props
}) {
  return <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} placeholderTextColor={theme.muted} multiline={!!multiline} style={[styles.input, multiline && styles.inputMultiline]} />
    </View>;
}
function FieldDropdown({
  label,
  value,
  placeholder,
  open,
  setOpen,
  onChoose,
  options,
  styles,
  theme,
  compact
}) {
  const translate = useTranslate();
  return <View style={[styles.fieldWrap, compact && styles.rowField]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(prev => !prev)} activeOpacity={0.9}>
        <Text style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}>{value ? translate(value) : placeholder}</Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={16} color={theme.muted} />
      </TouchableOpacity>
      {open ? <View style={styles.dropdownList}>
          {options.map(item => <TouchableOpacity key={item} style={styles.dropdownItem} onPress={() => onChoose(item)} activeOpacity={0.88}>
              <Text style={styles.dropdownItemText}>{translate(item)}</Text>
            </TouchableOpacity>)}
        </View> : null}
    </View>;
}
function createStyles(theme, isDark) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    flex: {
      flex: 1
    },
    content: {
      padding: 12,
      paddingBottom: 140
    },
    hero: {
      position: "relative",
      overflow: "hidden",
      backgroundColor: theme.surface,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 22,
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
    heroGlow: {
      position: "absolute",
      top: -86,
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
      marginBottom: 18
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
    heroEyebrow: {
      color: theme.accentStrong,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      textTransform: "uppercase"
    },
    heroTitle: {
      marginTop: 8,
      color: theme.text,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: "800",
      letterSpacing: -0.8,
      maxWidth: 540
    },
    heroSubtitle: {
      marginTop: 10,
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 500
    },
    panel: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 10
    },
    row: {
      flexDirection: "row",
      gap: 12
    },
    rowField: {
      flex: 1
    },
    fieldWrap: {
      marginBottom: 12
    },
    fieldLabel: {
      marginBottom: 6,
      color: theme.muted,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.7
    },
    input: {
      minHeight: 48,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.text,
      fontSize: 13
    },
    inputMultiline: {
      minHeight: 110,
      textAlignVertical: "top"
    },
    dropdown: {
      minHeight: 48,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    dropdownValue: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700"
    },
    dropdownPlaceholder: {
      color: theme.muted
    },
    dropdownList: {
      marginTop: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      backgroundColor: theme.surface
    },
    dropdownItem: {
      paddingHorizontal: 14,
      paddingVertical: 12
    },
    dropdownItemText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700"
    },
    primaryButton: {
      marginTop: 6,
      minHeight: 48,
      borderRadius: 18,
      backgroundColor: theme.accentStrong,
      alignItems: "center",
      justifyContent: "center"
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800"
    },
    secondaryButton: {
      marginTop: 10,
      minHeight: 48,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800"
    },
    buttonDisabled: {
      opacity: 0.75
    }
  };
}

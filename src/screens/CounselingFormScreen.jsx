// src/screens/CounselingFormScreen.jsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";

const ORANGE = "#FF7A1A";
const BASE_URL = "http://10.0.2.2:5000";

const problemOptions = ["Anxiety", "Depression", "Family Issues", "Relationship Issues", "Other"];
const genderOptions = ["Male", "Female"];
const languageOptions = ["Nepali", "English"];
const modeOptions = ["Online", "Offline"];

/**
 * ✅ Create counseling request
 * returns: { ok:true, request:{ _id / id } }
 */
async function apiCreateCounselingRequest(token, payload) {
  const res = await fetch(`${BASE_URL}/api/counseling/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload || {}),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to submit form");
  return json;
}

const CounselingFormScreen = ({ navigation }) => {
  // form values
  const [problem, setProblem] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [language, setLanguage] = useState("");
  const [mode, setMode] = useState("");
  const [description, setDescription] = useState("");

  // dropdown open states
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

  const bookedSessions = async () => {
    try {
      setBookedLoading(true);
      navigation.navigate("UserBookedCounseling");
    } finally {
      setBookedLoading(false);
    }
  };

  const validate = () => {
    if (!problem || !age || !gender || !language || !mode) {
      Alert.alert("Missing", "Please fill all required fields.");
      return false;
    }
    const a = Number(age);
    if (!Number.isFinite(a) || a <= 0) {
      Alert.alert("Invalid age", "Please enter a valid age.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const payload = {
        problem,
        age: Number(age),
        gender,
        language,
        mode,
        description,
      };

      const json = await apiCreateCounselingRequest(token, payload);

      // support both id styles
      const requestId = json?.request?._id || json?.request?.id;

      Alert.alert(
        "Submitted ✅",
        "Your counseling request has been submitted. Now choose a counselor.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Counselors", { requestId }),
          },
        ]
      );
    } catch (e) {
      Alert.alert("Submit failed", e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettingsPress = () => navigation.navigate("Settings");
  const handleHomePress = () => navigation.navigate("Home");
  const handleProfilePress = () => navigation.navigate("Profile");

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.headerTitle}> Counseling</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Problem / Issue */}
          <Text style={styles.label}>Problem/Issue *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              closeAllDropdowns();
              setProblemOpen((prev) => !prev);
            }}
            activeOpacity={0.9}
          >
            <Text style={[styles.placeholder, problem ? styles.selectedValue : null]}>
              {problem || "Problem..."}
            </Text>
            <Icon name={problemOpen ? "chevron-up" : "chevron-down"} size={18} color="#666" />
          </TouchableOpacity>
          {problemOpen && (
            <View style={styles.dropdownList}>
              {problemOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setProblem(item);
                    setProblemOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Age & Gender */}
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                placeholder="XX"
                placeholderTextColor="#B0B0B0"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>

            <View style={[styles.rowItem, { marginRight: 0 }]}>
              <Text style={styles.label}>Gender *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  closeAllDropdowns();
                  setGenderOpen((prev) => !prev);
                }}
                activeOpacity={0.9}
              >
                <Text style={[styles.placeholder, gender ? styles.selectedValue : null]}>
                  {gender || "Select..."}
                </Text>
                <Icon name={genderOpen ? "chevron-up" : "chevron-down"} size={18} color="#666" />
              </TouchableOpacity>
              {genderOpen && (
                <View style={styles.dropdownList}>
                  {genderOptions.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setGender(item);
                        setGenderOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Language Preference */}
          <Text style={styles.label}>Language Preference *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              closeAllDropdowns();
              setLanguageOpen((prev) => !prev);
            }}
            activeOpacity={0.9}
          >
            <Text style={[styles.placeholder, language ? styles.selectedValue : null]}>
              {language || "Language..."}
            </Text>
            <Icon name={languageOpen ? "chevron-up" : "chevron-down"} size={18} color="#666" />
          </TouchableOpacity>
          {languageOpen && (
            <View style={styles.dropdownList}>
              {languageOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setLanguage(item);
                    setLanguageOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Mode of Communication */}
          <Text style={styles.label}>Mode of Communication *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              closeAllDropdowns();
              setModeOpen((prev) => !prev);
            }}
            activeOpacity={0.9}
          >
            <Text style={[styles.placeholder, mode ? styles.selectedValue : null]}>
              {mode || "Mode of Communication..."}
            </Text>
            <Icon name={modeOpen ? "chevron-up" : "chevron-down"} size={18} color="#666" />
          </TouchableOpacity>
          {modeOpen && (
            <View style={styles.dropdownList}>
              {modeOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setMode(item);
                    setModeOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter Description..."
            placeholderTextColor="#B0B0B0"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.helperText}>Please fill every details.</Text>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.75 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#111" />
                <Text style={styles.submitText}>Submitting...</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>

          {/* View Booked Sessions */}
          <TouchableOpacity
            style={[styles.submitButton1, bookedLoading && { opacity: 0.75 }]}
            onPress={bookedSessions}
            disabled={bookedLoading}
            activeOpacity={0.9}
          >
            {bookedLoading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#111" />
                <Text style={styles.submitText}>Loading…</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>View Booked Sessions</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ORANGE SIDE PILL */}
      <View style={styles.sidePill} />

      {/* ✅ BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem} onPress={handleSettingsPress} activeOpacity={0.8}>
          <Icon name="settings" size={20} color="#9A9A9A" />
          <Text style={styles.tabLabel}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={handleHomePress} activeOpacity={0.8}>
          <View style={styles.homeIconWrapper}>
            <Icon name="home" size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={handleProfilePress} activeOpacity={0.8}>
          <Icon name="user" size={20} color="#9A9A9A" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CounselingFormScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F4F4" },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3",
  },
  backRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: ORANGE,
    marginLeft: 8,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 160,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  placeholder: { color: "#B0B0B0", fontSize: 14 },
  selectedValue: { color: "#222" },

  dropdownList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 10 },
  dropdownItemText: { fontSize: 14, color: "#222" },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  rowItem: { flex: 1, marginRight: 8 },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#222",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },
  textArea: { height: 100, textAlignVertical: "top" },

  helperText: { fontSize: 12, color: "#555", marginBottom: 20 },

  submitButton: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 60,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  submitButton1: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 60,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginTop: 10,
  },
  submitText: { fontSize: 16, fontWeight: "700", color: "#111" },

  sidePill: {
    position: "absolute",
    right: 0,
    top: "55%",
    width: 56,
    height: 110,
    backgroundColor: ORANGE,
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: -2, height: 2 },
  },

  bottomBar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  homeIconWrapper: {
    backgroundColor: ORANGE,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  tabLabel: { fontSize: 11, color: "#9A9A9A", marginTop: 2 },
  tabLabelActive: { color: ORANGE, fontWeight: "600" },
});

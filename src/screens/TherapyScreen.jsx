// src/screens/TherapyScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.0.2.2:5000";

const problemOptions = ["Anxiety", "Depression", "Family Issues", "Relationship Issues", "Other"];
const genderOptions = ["Male", "Female"];
const languageOptions = ["Nepali", "English"];
const modeOptions = ["Online", "Offline"];

async function apiCreateTherapyRequest(token, payload) {
  const res = await fetch(`${BASE_URL}/api/therapy/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to submit form");
  return data;
}

async function apiGetMyAppointments(token) {
  const res = await fetch(`${BASE_URL}/api/therapy/my/appointments`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load your bookings");
  return data;
}

const norm = (v) => String(v || "").toLowerCase().trim();
const getApptId = (b) => String(b?._id || b?.id || "");

export default function TherapyScreen({ navigation }) {
  const UI = useMemo(
    () => ({
      orange: "#FF7A1A",
      text: "#111",
      mut: "#666",
      card: "#FFFFFF",
      line: "#E3E3E3",
      ok: "#22C55E",
      warn: "#F59E0B",
      danger: "#EF4444",
    }),
    []
  );

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

  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  const closeAllDropdowns = () => {
    setProblemOpen(false);
    setGenderOpen(false);
    setLanguageOpen(false);
    setModeOpen(false);
  };

  const badgeColor = (status) => {
    const s = norm(status);
    if (s === "confirmed") return UI.ok;      // approved
    if (s === "pending") return UI.warn;
    if (s === "cancelled") return UI.danger;
    if (s === "completed") return UI.ok;
    return UI.mut;
  };

  // ✅ CHAT: unlock after APPROVED/CONFIRMED only (NOT online mode)
  const canChat = (booking) => norm(booking?.status) === "confirmed";

  const loadMyBookings = async () => {
    try {
      setBookingsLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const data = await apiGetMyAppointments(token);
      setMyBookings(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (e) {
      Alert.alert("Bookings", e?.message || "Could not load bookings");
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      loadMyBookings();
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const handleSubmit = async () => {
    try {
      if (!problem || !age || !gender || !language || !mode) {
        Alert.alert("Missing", "Please fill problem, age, gender, language and mode.");
        return;
      }

      if (Number(age) < 5 || Number(age) > 100) {
        Alert.alert("Invalid age", "Please enter a valid age.");
        return;
      }

      setSubmitting(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const payload = { problem, age: Number(age), gender, language, mode, description };

      const data = await apiCreateTherapyRequest(token, payload);
      const requestId = data?.request?.id;

      Alert.alert("Form Submitted ✅", "Now pick a therapist and time slot.", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("BookTherapyScreen", {
              requestId,
              formSummary: payload,
            }),
        },
      ]);
    } catch (e) {
      Alert.alert("Submit failed", e?.message || "Could not submit form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.headerTitle}> Therapy</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ✅ MY BOOKINGS LIST */}
          <View style={[styles.bookingsCard, { backgroundColor: UI.card }]}>
            <View style={styles.bookingsHeaderRow}>
              <Text style={styles.bookingsTitle}>My Booked Sessions</Text>

              <TouchableOpacity onPress={loadMyBookings} style={styles.refreshBtn} activeOpacity={0.9}>
                <Icon name="refresh-cw" size={16} color="#111" />
                <Text style={styles.refreshTxt}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {bookingsLoading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
                <ActivityIndicator color={UI.orange} />
                <Text style={{ color: UI.mut, fontWeight: "700" }}>Loading your bookings…</Text>
              </View>
            ) : myBookings.length === 0 ? (
              <Text style={{ color: UI.mut, fontWeight: "700" }}>No bookings yet. Submit the form and book a slot.</Text>
            ) : (
              myBookings.map((b) => {
                const therapistName = b?.therapist?.fullName || "Therapist";
                const appointmentId = getApptId(b);

                return (
                  <View key={appointmentId || String(Math.random())} style={styles.bookingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookingTherapist}>{therapistName}</Text>
                      <Text style={styles.bookingMeta}>
                        {b.month} {b.day} • {b.slot}
                      </Text>

                      {!!b?.therapist?.workingArea && <Text style={styles.bookingMetaSmall}>{b.therapist.workingArea}</Text>}

                      {canChat(b) ? (
                        <TouchableOpacity
                          style={styles.chatBtn}
                          activeOpacity={0.9}
                          onPress={() =>
                            navigation.navigate("TherapyChat", {
                              appointmentId: String(appointmentId),
                              therapistName,
                            })
                          }
                        >
                          <Icon name="message-circle" size={16} color="#111" />
                          <Text style={styles.chatTxt}>Message</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.chatLockTxt}>Chat unlocks after Approved.</Text>
                      )}
                    </View>

                    <View style={[styles.statusPill, { borderColor: badgeColor(b.status) }]}>
                      <View style={[styles.statusDot, { backgroundColor: badgeColor(b.status) }]} />
                      <Text style={[styles.statusTxt, { color: badgeColor(b.status) }]}>
                        {String(b.status || "pending").toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* FORM */}
          <Text style={styles.label}>Problem/Issue</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              closeAllDropdowns();
              setProblemOpen((prev) => !prev);
            }}
          >
            <Text style={[styles.placeholder, problem ? styles.selectedValue : null]}>{problem || "Problem..."}</Text>
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

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="XXXX"
                placeholderTextColor="#B0B0B0"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>

            <View style={[styles.rowItem, { marginRight: 0 }]}>
              <Text style={styles.label}>Gender</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  closeAllDropdowns();
                  setGenderOpen((prev) => !prev);
                }}
              >
                <Text style={[styles.placeholder, gender ? styles.selectedValue : null]}>{gender || "Select..."}</Text>
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

          <Text style={styles.label}>Language Preference</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              closeAllDropdowns();
              setLanguageOpen((prev) => !prev);
            }}
          >
            <Text style={[styles.placeholder, language ? styles.selectedValue : null]}>{language || "Language..."}</Text>
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

          <Text style={styles.label}>Mode of Communication</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              closeAllDropdowns();
              setModeOpen((prev) => !prev);
            }}
          >
            <Text style={[styles.placeholder, mode ? styles.selectedValue : null]}>{mode || "Mode of Communication..."}</Text>
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

          <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#111" />
                <Text style={styles.submitText}>Submitting…</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.sidePill} />
    </SafeAreaView>
  );
}

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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FF7A1A", marginLeft: 8 },

  content: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 140 },

  bookingsCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    backgroundColor: "#FFF",
  },
  bookingsHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  bookingsTitle: { fontSize: 14, fontWeight: "900", color: "#111" },

  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EEE",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  refreshTxt: { fontSize: 12, fontWeight: "900", color: "#111" },

  bookingRow: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 10,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  bookingTherapist: { fontSize: 13, fontWeight: "900", color: "#111" },
  bookingMeta: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#666" },
  bookingMetaSmall: { marginTop: 2, fontSize: 11, fontWeight: "700", color: "#888" },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 99 },
  statusTxt: { fontSize: 10, fontWeight: "900" },

  chatBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF4E8",
    borderWidth: 1,
    borderColor: "#FFD7B7",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  chatTxt: { fontWeight: "900", color: "#111" },
  chatLockTxt: { marginTop: 10, fontSize: 11, fontWeight: "800", color: "#888" },

  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6 },

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
  submitText: { fontSize: 16, fontWeight: "700", color: "#111" },

  sidePill: {
    position: "absolute",
    right: 0,
    bottom: 110,
    width: 56,
    height: 110,
    backgroundColor: "#FF7A1A",
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: -2, height: 2 },
  },
});

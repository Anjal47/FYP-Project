// src/screens/BookCounselorScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FloatingHelpChat from "../components/FloatingHelpChat";
import { useAppTheme } from "../context/ThemeContext";
import { createThemedStyles } from "../utils/themeStyles";

const ORANGE = "#FF7A1A";
const BASE_URL = "http://10.0.2.2:5000"; // Android emulator

// ✅ Slot options (keep consistent with backend by trimming)
const timeSlots = [
  "09:00 - 09:30 AM",
  "10:00 - 10:30 AM",
  "11:00 - 11:30 AM",
  "02:00 - 02:30 PM",
  "03:00 - 03:30 PM",
];

/**
 * GET counsellors list (role=counsellor) from backend.
 * Expected backend: { ok: true, counsellors: [{ _id/id, fullName, workingArea, qualification, phone, ...}] }
 */
async function apiGetCounsellors(token) {
  const res = await fetch(`${BASE_URL}/api/counseling/counsellors`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to load counsellors");
  return json;
}

/**
 * POST booking counseling appointment
 * POST /api/counseling/appointments
 * payload = { counsellorId, requestId, month, day, slot, notes }
 */
async function apiBookCounseling(token, payload) {
  const res = await fetch(`${BASE_URL}/api/counseling/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload || {}),
  });

  const json = await res.json().catch(() => ({}));

  // ✅ important: handle double booking conflict cleanly
  if (res.status === 409) {
    throw new Error(json?.message || "This slot is already booked. Please choose another time.");
  }

  if (!res.ok) throw new Error(json?.message || "Failed to book counseling session");
  return json;
}

/** normalize id because sometimes you get _id or id */
const getId = (x) => String(x?._id || x?.id || "");

/** Month list for dynamic month selector */
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Get number of days in a given month/year
 * monthIndex: 0-11
 */
const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

/**
 * Get weekday offset for calendar grid
 * We want Monday as first column.
 * JS getDay(): 0=Sun ... 6=Sat
 * Convert to Monday-first index:
 *   Mon=0, Tue=1, ... Sun=6
 */
const getMondayFirstOffset = (year, monthIndex) => {
  const js = new Date(year, monthIndex, 1).getDay(); // 0..6 (Sun..Sat)
  return (js + 6) % 7; // shift so Mon=0
};

export default function BookCounselorScreen({ navigation, route }) {
  const UI = useMemo(
    () => ({
      bg: "#F4F4F4",
      card: "#FFFFFF",
      text: "#111",
      mut: "#666",
      line: "#E3E3E3",
      orange: ORANGE,
    }),
    []
  );

  // ✅ requestId passed from CounselingFormScreen navigate()
  const requestId = route?.params?.requestId || null;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [counsellors, setCounsellors] = useState([]);
  const [selectedCounsellor, setSelectedCounsellor] = useState(null);

  // ✅ dynamic month/year
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(now.getMonth()); // 0-11
  const [monthOpen, setMonthOpen] = useState(false);

  const [selectedDay, setSelectedDay] = useState(null);

  const [slotOpen, setSlotOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

  // ✅ compute days dynamically
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonthIndex);
  const offset = getMondayFirstOffset(selectedYear, selectedMonthIndex);

  // ✅ build calendar grid with blanks first
  const calendarCells = useMemo(() => {
    const blanks = Array.from({ length: offset }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [offset, daysInMonth]);

  const loadCounsellors = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const data = await apiGetCounsellors(token);
      setCounsellors(Array.isArray(data?.counsellors) ? data.counsellors : []);
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not load counsellors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!requestId) {
      Alert.alert(
        "Missing requestId",
        "Counseling requestId was not received. Please submit the counseling form again.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    loadCounsellors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ reset selected day if month changes (avoid invalid day like 31 on Feb)
  useEffect(() => {
    if (selectedDay && selectedDay > daysInMonth) setSelectedDay(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonthIndex, selectedYear]);

  const goPrevMonth = () => {
    setMonthOpen(false);
    setSelectedDay(null);
    setSelectedSlot("");

    setSelectedMonthIndex((prev) => {
      if (prev === 0) {
        setSelectedYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goNextMonth = () => {
    setMonthOpen(false);
    setSelectedDay(null);
    setSelectedSlot("");

    setSelectedMonthIndex((prev) => {
      if (prev === 11) {
        setSelectedYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleSubmit = async () => {
    try {
      if (!requestId) {
        Alert.alert("Missing request", "No requestId found. Please submit the counseling form again.");
        return;
      }

      const counsellorId = getId(selectedCounsellor);
      if (!counsellorId) {
        Alert.alert("Pick counsellor", "Please select a counsellor first.");
        return;
      }

      if (!selectedDay || !selectedSlot) {
        Alert.alert("Incomplete", "Please select a day and a time slot.");
        return;
      }

      setBooking(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const month = MONTHS[selectedMonthIndex]; // ✅ dynamic month string (matches backend model)

      const payload = {
        counsellorId,
        requestId,
        month: String(month).trim(),
        day: Number(selectedDay),
        slot: String(selectedSlot).trim(),
        notes: "",
      };
      const data = await apiBookCounseling(token, payload);

      Alert.alert(
        "Session Booked ✅",
        `Counsellor: ${selectedCounsellor?.fullName || "—"}\nRequest ID: ${requestId}\nDate: ${month} ${selectedDay}, ${selectedYear}\nTime: ${selectedSlot}\nStatus: ${
          data?.appointment?.status || "pending"
        }`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert("Booking failed", e?.message || "Could not book counselling session");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: UI.bg }]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={UI.orange} />
          <Text style={{ marginTop: 10, color: UI.mut, fontWeight: "700" }}>Loading counsellors…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: UI.bg }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color={UI.text} />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}> Counseling</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Book Session.</Text>

        {/* COUNSELLOR LIST */}
        <Text style={styles.label}>Select Counsellor</Text>

        {counsellors.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: UI.card }]}>
            <Text style={{ color: UI.mut, fontWeight: "700" }}>
              No counsellors found. Ask admin to create counsellor accounts.
            </Text>
            <TouchableOpacity onPress={loadCounsellors} style={[styles.reloadBtn]}>
              <Text style={{ fontWeight: "900", color: UI.text }}>Reload</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
            {counsellors.map((c, index) => {
              const id = getId(c) || `c-${index}`;
              const active = getId(selectedCounsellor) === getId(c);

              return (
                <TouchableOpacity
                  key={id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedCounsellor(c)}
                  style={[styles.counsellorCard, active && { borderColor: ORANGE, borderWidth: 1.5 }]}
                >
                  <View style={styles.avatar} />
                  <Text style={styles.counsellorName}>{c?.fullName || "Counsellor"}</Text>
                  {!!c?.qualification && <Text style={styles.counsellorMeta}>{c.qualification}</Text>}
                  {!!c?.workingArea && <Text style={styles.counsellorMeta}>{c.workingArea}</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* CALENDAR CARD */}
        <View style={styles.calendarCard}>
          {/* month controls */}
          <View style={styles.monthBar}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.navBtn} activeOpacity={0.85}>
              <Icon name="chevron-left" size={18} color="#111" />
            </TouchableOpacity>

            {/* Month dropdown */}
            <TouchableOpacity
              style={styles.monthCenter}
              onPress={() => setMonthOpen((p) => !p)}
              activeOpacity={0.9}
            >
              <Text style={styles.monthTitle}>
                {MONTHS[selectedMonthIndex]} {selectedYear}
              </Text>
              <Icon name={monthOpen ? "chevron-up" : "chevron-down"} size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity onPress={goNextMonth} style={styles.navBtn} activeOpacity={0.85}>
              <Icon name="chevron-right" size={18} color="#111" />
            </TouchableOpacity>
          </View>

          {/* Month dropdown list */}
          {monthOpen && (
            <View style={styles.monthDropdown}>
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, idx) => {
                  const active = idx === selectedMonthIndex;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.monthItem, active && styles.monthItemActive]}
                      onPress={() => {
                        setSelectedMonthIndex(idx);
                        setMonthOpen(false);
                        setSelectedDay(null);
                        setSelectedSlot("");
                      }}
                    >
                      <Text style={[styles.monthItemText, active && styles.monthItemTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Year controls */}
              <View style={styles.yearRow}>
                <TouchableOpacity
                  style={styles.yearBtn}
                  onPress={() => {
                    setSelectedYear((y) => y - 1);
                    setSelectedDay(null);
                    setSelectedSlot("");
                  }}
                >
                  <Icon name="minus" size={16} color="#111" />
                  <Text style={styles.yearBtnText}>Year</Text>
                </TouchableOpacity>

                <Text style={styles.yearText}>{selectedYear}</Text>

                <TouchableOpacity
                  style={styles.yearBtn}
                  onPress={() => {
                    setSelectedYear((y) => y + 1);
                    setSelectedDay(null);
                    setSelectedSlot("");
                  }}
                >
                  <Icon name="plus" size={16} color="#111" />
                  <Text style={styles.yearBtnText}>Year</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Week labels */}
          <View style={styles.weekRow}>
            <Text style={styles.weekLabel}>Mo</Text>
            <Text style={styles.weekLabel}>Tu</Text>
            <Text style={styles.weekLabel}>We</Text>
            <Text style={styles.weekLabel}>Th</Text>
            <Text style={styles.weekLabel}>Fr</Text>
            <Text style={[styles.weekLabel, styles.weekendLabel]}>Sa</Text>
            <Text style={[styles.weekLabel, styles.weekendLabel]}>Su</Text>
          </View>

          {/* Days grid (with blanks) */}
          <View style={styles.daysGrid}>
            {calendarCells.map((cell, idx) => {
              if (cell === null) {
                return <View key={`blank-${idx}`} style={[styles.dayCell, { backgroundColor: "transparent" }]} />;
              }

              const isSelected = cell === selectedDay;

              return (
                <TouchableOpacity
                  key={`day-${cell}`}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDay(cell)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{cell}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TIME SLOT DROPDOWN */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.label}>Time Slot</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setSlotOpen((prev) => !prev)}
            activeOpacity={0.9}
          >
            <Text style={[styles.placeholder, selectedSlot ? styles.selectedValue : null]}>
              {selectedSlot || "Time Slot..."}
            </Text>
            <Icon name={slotOpen ? "chevron-up" : "chevron-down"} size={18} color="#666" />
          </TouchableOpacity>

          {slotOpen && (
            <View style={styles.dropdownList}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedSlot(slot);
                    setSlotOpen(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dropdownItemText}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[styles.submitButton, booking && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={booking}
          activeOpacity={0.9}
        >
          {booking ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator color="#111" />
              <Text style={styles.submitText}>Booking…</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ORANGE SIDE PILL */}
      <FloatingHelpChat bottom={110} fabBottom={145} />
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
  headerTitle: { fontSize: 20, fontWeight: "700", marginLeft: 8 },
  headerHighlight: { color: "#FF7A1A" },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 140 },

  screenTitle: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 16 },

  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },

  counsellorCard: {
    width: 160,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 14,
    marginRight: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#EAEAEA", marginBottom: 10 },
  counsellorName: { fontSize: 13, fontWeight: "900", color: "#111" },
  counsellorMeta: { marginTop: 4, fontSize: 11, fontWeight: "700", color: "#666" },

  emptyBox: { borderRadius: 18, padding: 14, marginBottom: 10 },
  reloadBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EEE",
  },

  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginTop: 14,
  },

  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  monthCenter: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  monthTitle: { fontSize: 15, fontWeight: "800", textAlign: "center", color: "#111" },

  monthDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE",
    padding: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  monthItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  monthItemActive: {
    backgroundColor: "#FF7A1A",
  },
  monthItemText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 13,
  },
  monthItemTextActive: {
    color: "#FFF",
  },

  yearRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  yearBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  yearBtnText: { fontWeight: "900", color: "#111", fontSize: 12 },
  yearText: { fontWeight: "900", color: "#111", fontSize: 14 },

  weekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, paddingHorizontal: 4 },
  weekLabel: { fontSize: 12, color: "#777", width: 24, textAlign: "center" },
  weekendLabel: { color: "#FF7A1A" },

  daysGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 4 },
  dayCell: {
    width: "12%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  dayCellSelected: { backgroundColor: "#FF7A1A" },
  dayText: { fontSize: 12, color: "#444", fontWeight: "700" },
  dayTextSelected: { color: "#FFFFFF", fontWeight: "900" },

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
  placeholder: { color: "#B0B0B0", fontSize: 14, fontWeight: "700" },
  selectedValue: { color: "#222", fontWeight: "900" },
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
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12 },
  dropdownItemText: { fontSize: 14, color: "#222", fontWeight: "800" },

  submitButton: {
    marginTop: 20,
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
  submitText: { fontSize: 16, fontWeight: "900", color: "#111" },

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

// src/screens/BookTherapyScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslate } from "../utils/localization";
const ORANGE = "#FF7A1A";
const BASE_URL = "http://10.0.2.2:5000"; // Android emulator

const timeSlots = ["09:00 - 09:30 AM", "10:00 - 10:30 AM", "11:00 - 11:30 AM", "02:00 - 02:30 PM", "03:00 - 03:30 PM"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const getDaysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};
const getFirstDayOffsetMonday = (year, monthIndex) => {
  const jsDay = new Date(year, monthIndex, 1).getDay();
  return (jsDay + 6) % 7;
};
async function apiGetTherapists(token) {
  const res = await fetch(`${BASE_URL}/api/therapy/therapists`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load therapists");
  return data;
}
async function apiBookTherapy(token, payload) {
  const res = await fetch(`${BASE_URL}/api/therapy/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || "Failed to book appointment";
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}
const getId = x => String(x?._id || x?.id || "");
export default function BookTherapyScreen({
  navigation,
  route
}) {
  const translate = useTranslate();
  const UI = useMemo(() => ({
    bg: "#F4F4F4",
    card: "#FFFFFF",
    text: "#111",
    mut: "#666",
    line: "#E3E3E3",
    orange: ORANGE
  }), []);
  const requestId = route?.params?.requestId || null;
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [slotOpen, setSlotOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const monthName = MONTHS[monthIndex];
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const offset = getFirstDayOffsetMonday(year, monthIndex);
  const calendarCells = useMemo(() => {
    const blanks = Array.from({
      length: offset
    }, (_, i) => ({
      type: "blank",
      key: `b-${i}`
    }));
    const days = Array.from({
      length: daysInMonth
    }, (_, i) => ({
      type: "day",
      day: i + 1,
      key: `d-${i + 1}`
    }));
    return [...blanks, ...days];
  }, [offset, daysInMonth]);
  const loadTherapists = async () => {
    try {
      setLoading(true);
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
      const data = await apiGetTherapists(token);
      setTherapists(Array.isArray(data?.therapists) ? data.therapists : []);
    } catch (e) {
      Alert.alert(translate("Error"), e?.message || "Could not load therapists");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!requestId) {
      Alert.alert(translate("Missing requestId"), translate("Therapy requestId was not received. Please submit the therapy form again."), [{
        text: translate("OK"),
        onPress: () => navigation.goBack()
      }]);
      return;
    }
    loadTherapists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setSelectedDay(null);
    setSelectedSlot("");
    setSlotOpen(false);
  }, [monthIndex, year]);
  const changeMonth = dir => {
    setSelectedDay(null);
    setSelectedSlot("");
    setSlotOpen(false);
    setMonthIndex(prev => {
      let next = prev + dir;
      if (next < 0) {
        next = 11;
        setYear(y => y - 1);
      } else if (next > 11) {
        next = 0;
        setYear(y => y + 1);
      }
      return next;
    });
  };
  const handleSubmit = async () => {
    try {
      if (!requestId) {
        Alert.alert(translate("Missing request"), translate("No requestId found. Please submit the therapy form again."));
        return;
      }
      const therapistId = getId(selectedTherapist);
      if (!therapistId) {
        Alert.alert(translate("Pick therapist"), translate("Please select a therapist first."));
        return;
      }
      if (!selectedDay || !selectedSlot) {
        Alert.alert(translate("Incomplete"), translate("Please select a day and a time slot."));
        return;
      }
      setBooking(true);
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
        therapistId,
        requestId,
        month: monthName,
        day: selectedDay,
        slot: selectedSlot,
        notes: ""
      };
      const data = await apiBookTherapy(token, payload);
      Alert.alert(translate("Appointment Booked ✅"), `${translate("Therapist")}: ${selectedTherapist?.fullName || translate("Therapist")}\n${translate("Request ID")}: ${requestId}\n${translate("Date")}: ${translate(monthName)} ${selectedDay}, ${year}\n${translate("Time")}: ${selectedSlot}\n${translate("Status")}: ${translate(data?.appointment?.status || "pending")}`, [{
        text: translate("OK"),
        onPress: () => navigation.goBack()
      }]);
    } catch (e) {
      if (e?.status === 409) {
        Alert.alert(translate("Slot not available"), e?.message || "This time slot is already booked.");
      } else {
        Alert.alert(translate("Booking failed"), e?.message || "Could not book appointment");
      }
    } finally {
      setBooking(false);
    }
  };
  if (loading) {
    return <SafeAreaView style={[styles.container, {
      backgroundColor: UI.bg
    }]}>
        <View style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
      }}>
          <ActivityIndicator size="large" color={UI.orange} />
          <Text style={{
          marginTop: 10,
          color: UI.mut,
          fontWeight: "700"
        }}>{translate("Loading therapists…")}</Text>
        </View>
      </SafeAreaView>;
  }
  return <SafeAreaView style={[styles.container, {
    backgroundColor: UI.bg
  }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color={UI.text} />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}>{translate("Therapy")}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>{translate("Book Appointment.")}</Text>

        <Text style={styles.label}>{translate("Select Therapist")}</Text>

        {therapists.length === 0 ? <View style={[styles.emptyBox, {
        backgroundColor: UI.card
      }]}>
            <Text style={{
          color: UI.mut,
          fontWeight: "700"
        }}>{translate("No therapists found. Ask admin to create therapist accounts.")}</Text>
            <TouchableOpacity onPress={loadTherapists} style={styles.reloadBtn}>
              <Text style={{
            fontWeight: "900",
            color: UI.text
          }}>{translate("Reload")}</Text>
            </TouchableOpacity>
          </View> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{
        paddingBottom: 6
      }}>
            {therapists.map((t, idx) => {
          const id = getId(t) || `t-${idx}`;
          const active = getId(selectedTherapist) === id;
          return <TouchableOpacity key={id} activeOpacity={0.9} onPress={() => setSelectedTherapist(t)} style={[styles.therapistCard, active && {
            borderColor: ORANGE,
            borderWidth: 1.5
          }]}>
                  <View style={styles.avatar} />
                  <Text style={styles.therapistName}>{t?.fullName || translate("Therapist")}</Text>
                  {!!t?.qualification && <Text style={styles.therapistMeta}>{t.qualification}</Text>}
                  {!!t?.workingArea && <Text style={styles.therapistMeta}>{t.workingArea}</Text>}
                </TouchableOpacity>;
        })}
          </ScrollView>}

        <View style={styles.calendarCard}>
          <View style={styles.monthHeaderRow}>
            <TouchableOpacity style={styles.monthNavBtn} onPress={() => changeMonth(-1)} activeOpacity={0.8}>
              <Icon name="chevron-left" size={18} color="#111" />
            </TouchableOpacity>

            <View style={{
            alignItems: "center"
          }}>
              <Text style={styles.monthTitle}>
                {translate(monthName)} {year}
              </Text>
              <Text style={styles.monthSub}>{translate("Pick a day")}</Text>
            </View>

            <TouchableOpacity style={styles.monthNavBtn} onPress={() => changeMonth(1)} activeOpacity={0.8}>
              <Icon name="chevron-right" size={18} color="#111" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            <Text style={styles.weekLabel}>{translate("Mo")}</Text>
            <Text style={styles.weekLabel}>{translate("Tu")}</Text>
            <Text style={styles.weekLabel}>{translate("We")}</Text>
            <Text style={styles.weekLabel}>{translate("Th")}</Text>
            <Text style={styles.weekLabel}>{translate("Fr")}</Text>
            <Text style={[styles.weekLabel, styles.weekendLabel]}>{translate("Sa")}</Text>
            <Text style={[styles.weekLabel, styles.weekendLabel]}>{translate("Su")}</Text>
          </View>

          <View style={styles.daysGrid}>
            {calendarCells.map(cell => {
            if (cell.type === "blank") {
              return <View key={cell.key} style={[styles.dayCell, {
                backgroundColor: "transparent"
              }]} />;
            }
            const day = cell.day;
            const isSelected = day === selectedDay;
            return <TouchableOpacity key={cell.key} style={[styles.dayCell, isSelected && styles.dayCellSelected]} onPress={() => setSelectedDay(day)} activeOpacity={0.9}>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                </TouchableOpacity>;
          })}
          </View>
        </View>

        <View style={{
        marginTop: 24
      }}>
          <Text style={styles.label}>{translate("Time Slot")}</Text>

          <TouchableOpacity style={styles.dropdown} onPress={() => setSlotOpen(p => !p)} activeOpacity={0.9}>
            <Text style={[styles.placeholder, selectedSlot ? styles.selectedValue : null]}>
              {selectedSlot || translate("Time Slot...")}
            </Text>
            <Icon name={slotOpen ? "chevron-up" : "chevron-down"} size={18} color="#666" />
          </TouchableOpacity>

          {slotOpen && <View style={styles.dropdownList}>
              {timeSlots.map(slot => <TouchableOpacity key={slot} style={styles.dropdownItem} onPress={() => {
            setSelectedSlot(slot);
            setSlotOpen(false);
          }} activeOpacity={0.9}>
                  <Text style={styles.dropdownItemText}>{slot}</Text>
                </TouchableOpacity>)}
            </View>}
        </View>

        <TouchableOpacity style={[styles.submitButton, booking && {
        opacity: 0.7
      }]} onPress={handleSubmit} disabled={booking} activeOpacity={0.9}>
          {booking ? <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10
        }}>
              <ActivityIndicator color="#111" />
              <Text style={styles.submitText}>{translate("Booking…")}</Text>
            </View> : <Text style={styles.submitText}>{translate("Submit")}</Text>}
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4"
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3E3E3"
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8
  },
  headerHighlight: {
    color: "#FF7A1A"
  },
  body: {
    flex: 1
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 140
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8
  },
  therapistCard: {
    width: 160,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 14,
    marginRight: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3
    },
    elevation: 4
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EAEAEA",
    marginBottom: 10
  },
  therapistName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111"
  },
  therapistMeta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#666"
  },
  emptyBox: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10
  },
  reloadBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EEE"
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
    shadowOffset: {
      width: 0,
      height: 3
    },
    elevation: 4,
    marginTop: 14
  },
  monthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEE"
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center"
  },
  monthSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#777"
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4
  },
  weekLabel: {
    fontSize: 12,
    color: "#777",
    width: 24,
    textAlign: "center"
  },
  weekendLabel: {
    color: "#FF7A1A"
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 4
  },
  dayCell: {
    width: "12%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4
  },
  dayCellSelected: {
    backgroundColor: "#FF7A1A"
  },
  dayText: {
    fontSize: 12,
    color: "#444"
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700"
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
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 2
  },
  placeholder: {
    color: "#B0B0B0",
    fontSize: 14
  },
  selectedValue: {
    color: "#222"
  },
  dropdownList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3
    },
    elevation: 5,
    overflow: "hidden"
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#222"
  },
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
    shadowOffset: {
      width: 0,
      height: 3
    },
    elevation: 4
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111"
  },
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
    shadowOffset: {
      width: -2,
      height: 2
    }
  }
});

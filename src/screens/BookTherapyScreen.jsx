// src/screens/BookTherapyScreen.jsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

const timeSlots = [
  "09:00 - 09:30 AM",
  "10:00 - 10:30 AM",
  "11:00 - 11:30 AM",
  "02:00 - 02:30 PM",
  "03:00 - 03:30 PM",
];

const BookTherapyScreen = ({ navigation }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [slotOpen, setSlotOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

  const handleSubmit = () => {
    if (!selectedDay || !selectedSlot) {
      Alert.alert("Incomplete", "Please select a day and a time slot.");
      return;
    }

    Alert.alert(
      "Appointment Booked",
      `Date: December ${selectedDay}\nTime: ${selectedSlot}`,
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(), // or navigate elsewhere
        },
      ]
    );
  };

  const handleHomePress = () => navigation.navigate("Home");

  const days = [
    1, 2, 3, 4, 5, 6, 7,
    8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28,
    29, 30, 31,
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#111" />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerHighlight}> Therapy</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Book Appointment.</Text>

        {/* CALENDAR CARD */}
        <View style={styles.calendarCard}>
          <Text style={styles.monthTitle}>December</Text>

          <View style={styles.weekRow}>
            <Text style={styles.weekLabel}>Mo</Text>
            <Text style={styles.weekLabel}>Tu</Text>
            <Text style={styles.weekLabel}>We</Text>
            <Text style={styles.weekLabel}>Th</Text>
            <Text style={styles.weekLabel}>Fr</Text>
            <Text style={[styles.weekLabel, styles.weekendLabel]}>Sa</Text>
            <Text style={[styles.weekLabel, styles.weekendLabel]}>Su</Text>
          </View>

          <View style={styles.daysGrid}>
            {days.map((day) => {
              const isSelected = day === selectedDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
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
          >
            <Text
              style={[
                styles.placeholder,
                selectedSlot ? styles.selectedValue : null,
              ]}
            >
              {selectedSlot || "Time Slot..."}
            </Text>
            <Icon
              name={slotOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#666"
            />
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
                >
                  <Text style={styles.dropdownItemText}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ORANGE SIDE PILL */}
      <View style={styles.sidePill} />

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="settings" size={20} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={handleHomePress}>
          <Icon name="home" size={22} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="user" size={20} color="#111" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookTherapyScreen;

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
    marginLeft: 8,
  },
  headerHighlight: { color: "#FF7A1A" },

  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 140,
  },

  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
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
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  weekLabel: {
    fontSize: 12,
    color: "#777",
    width: 24,
    textAlign: "center",
  },
  weekendLabel: {
    color: "#FF7A1A",
  },

  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dayCell: {
    width: "12%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  dayCellSelected: {
    backgroundColor: "#FF7A1A",
  },
  dayText: {
    fontSize: 12,
    color: "#444",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
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
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#222",
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

  bottomBar: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    width: 220,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tabItem: { paddingHorizontal: 12, paddingVertical: 4 },
});

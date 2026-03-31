import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";

const donationData = [
  {
    id: 1,
    title: "Help for Surgery",
    location: "Kathmandu, Nepal",
    needed: 50000,
    raised: 20000,
    urgency: "Urgent",
    description: "Need support for an emergency surgery treatment.",
    contactNumber: "+9779800000000",
    physicalHelpNote:
      "You can contact directly to provide medicine, food, transport, or other in-person support.",
    qrNote: "Scan this QR to donate quickly and easily.",
  },
  {
    id: 2,
    title: "Support School Fees",
    location: "Pokhara, Nepal",
    needed: 30000,
    raised: 12000,
    urgency: "Medium",
    description: "Help a student continue education by covering school fees.",
    contactNumber: "+9779800000001",
    physicalHelpNote:
      "You can contact directly to provide books, stationery, fees, or other educational support.",
    qrNote: "Scan this QR to donate quickly and easily.",
  },
  {
    id: 3,
    title: "Emergency Food Support",
    location: "Lalitpur, Nepal",
    needed: 15000,
    raised: 7000,
    urgency: "Low",
    description: "Support a family in urgent need of food supplies.",
    contactNumber: "+9779800000002",
    physicalHelpNote:
      "You can help physically by providing food packs or essential supplies.",
    qrNote: "Scan this QR to donate quickly and easily.",
  },
];

const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case "Urgent":
      return "#FF3B30";
    case "Medium":
      return "#FF7A1A";
    default:
      return "#777";
  }
};

const getUrgencyBg = (urgency) => {
  switch (urgency) {
    case "Urgent":
      return "#FFE5E2";
    case "Medium":
      return "#FFF3E8";
    default:
      return "#F2F2F2";
  }
};

export default function DonationScreen({ navigation }) {
  const [currentView, setCurrentView] = useState("home");
  const [formData, setFormData] = useState({
    fullName: "",
    contact: "",
    location: "",
    helpType: "Medical",
    description: "",
    amountNeeded: "",
    urgency: "Medium",
  });

  const handleSubmit = () => {
    Alert.alert("Success", "Charity request submitted");
    setCurrentView("home");
    setFormData({
      fullName: "",
      contact: "",
      location: "",
      helpType: "Medical",
      description: "",
      amountNeeded: "",
      urgency: "Medium",
    });
  };

  return (
    <SafeAreaView style={styles.page}>
      {currentView === "form" ? (
        <>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView("home")}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ask for Charity</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
            <View style={styles.formCard}>
              <TextInput
                placeholder="Full Name"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                style={styles.input}
                placeholderTextColor="#777"
              />

              <TextInput
                placeholder="Contact Info"
                value={formData.contact}
                onChangeText={(text) => setFormData({ ...formData, contact: text })}
                style={styles.input}
                placeholderTextColor="#777"
              />

              <TextInput
                placeholder="Location"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                style={styles.input}
                placeholderTextColor="#777"
              />

              <TextInput
                placeholder="Type of Help Needed"
                value={formData.helpType}
                onChangeText={(text) => setFormData({ ...formData, helpType: text })}
                style={styles.input}
                placeholderTextColor="#777"
              />

              <TextInput
                placeholder="Description"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                style={[styles.input, styles.textArea]}
                placeholderTextColor="#777"
                multiline
              />

              <TextInput
                placeholder="Amount Needed"
                value={formData.amountNeeded}
                onChangeText={(text) =>
                  setFormData({ ...formData, amountNeeded: text })
                }
                style={styles.input}
                placeholderTextColor="#777"
                keyboardType="numeric"
              />

              <TextInput
                placeholder="Urgency (Low / Medium / Urgent)"
                value={formData.urgency}
                onChangeText={(text) => setFormData({ ...formData, urgency: text })}
                style={styles.input}
                placeholderTextColor="#777"
              />

              <View style={styles.uploadBox}>
                <Text style={styles.uploadText}>Upload Proof</Text>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={styles.topBar}>
            <Text style={styles.pageTitle}>Donate / Charity</Text>
          </View>

          <TouchableOpacity
            style={styles.askCard}
            onPress={() => setCurrentView("form")}
            activeOpacity={0.9}
          >
            <View>
              <Text style={styles.askTitle}>Ask for Charity</Text>
              <Text style={styles.askSubtitle}>
                Request help by filling out a form
              </Text>
            </View>
            <Text style={styles.askArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.listWrap}>
            {donationData.map((item) => {
              const progress = Math.min((item.raised / item.needed) * 100, 100);

              return (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardLocation}>{item.location}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>

                  <View style={styles.cardAmounts}>
                    <Text style={styles.amountText}>Need: Rs. {item.needed}</Text>
                    <Text style={styles.amountText}>Raised: Rs. {item.raised}</Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View
                      style={[styles.progressBarFill, { width: `${progress}%` }]}
                    />
                  </View>

                  <View style={styles.cardBottom}>
                    <View
                      style={[
                        styles.urgencyBadge,
                        { backgroundColor: getUrgencyBg(item.urgency) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          { color: getUrgencyColor(item.urgency) },
                        ]}
                      >
                        {item.urgency}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.donateButton}
                      onPress={() =>
                        navigation.navigate("DonateNow", { donation: item })
                      }
                    >
                      <Text style={styles.donateButtonText}>Donate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  topBar: {
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },
  askCard: {
    backgroundColor: "#FF7A1A",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  askTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  askSubtitle: {
    color: "#fff",
    fontSize: 14,
    marginTop: 6,
  },
  askArrow: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  listWrap: {
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    elevation: 3,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111",
  },
  cardLocation: {
    marginTop: 6,
    marginBottom: 10,
    color: "#777",
    fontSize: 14,
  },
  cardDesc: {
    marginBottom: 14,
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
  },
  cardAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
    flexWrap: "wrap",
  },
  amountText: {
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#F2F2F2",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FF7A1A",
    borderRadius: 999,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  urgencyText: {
    fontSize: 13,
    fontWeight: "700",
  },
  donateButton: {
    backgroundColor: "#FF7A1A",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  donateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    backgroundColor: "#fff",
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  backButtonText: {
    fontSize: 18,
    color: "#111",
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    elevation: 3,
    gap: 14,
  },
  input: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2F2F2",
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#111",
    marginBottom: 14,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#FF7A1A",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    backgroundColor: "#FFF3E8",
    marginBottom: 6,
  },
  uploadText: {
    color: "#FF7A1A",
    fontWeight: "600",
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#FF7A1A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { postJSON } from "../../utils/api";
import { useTranslate } from "../../utils/localization";
const ORANGE = "#FF7A00";
export default function TrafficFineCreateScreen({
  navigation
}) {
  const translate = useTranslate();
  const [userEmail, setUserEmail] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [fineCode, setFineCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    const trimmedEmail = String(userEmail || "").trim().toLowerCase();
    const trimmedReason = String(reason || "").trim();
    const trimmedCode = String(fineCode || "").trim();
    const numericAmount = Number(amount);
    if (!trimmedEmail || !trimmedReason || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return Alert.alert(translate("Missing info"), translate("Email, reason, and a valid amount are required."));
    }
    try {
      setSubmitting(true);
      const res = await postJSON("/api/traffic/fines", {
        userEmail: trimmedEmail,
        fineCode: trimmedCode || undefined,
        reason: trimmedReason,
        amount: numericAmount
      });
      Alert.alert(translate("Fine issued"), `Fine Code: ${res?.fine?.fineCode || "N/A"}\nUser: ${res?.user?.email || trimmedEmail}`, [{
        text: translate("Issue Another"),
        style: "cancel",
        onPress: () => {
          setReason("");
          setAmount("");
          setFineCode("");
        }
      }, {
        text: translate("Done"),
        onPress: () => navigation.goBack()
      }]);
    } catch (error) {
      Alert.alert(translate("Failed"), error.message || "Could not issue traffic fine");
    } finally {
      setSubmitting(false);
    }
  };
  return <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>{translate("Issue Traffic Fine")}</Text>
            <Text style={styles.subtitle}>{translate("Create a fine by the user's email address")}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#08111D" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>{translate("Police Fine Desk")}</Text>
            <Text style={styles.heroText}>{translate("Issue a real fine linked to the citizen's account so it appears automatically in Pay Fine.")}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{translate("Recipient")}</Text>
          <Text style={styles.sectionHint}>{translate("Use the exact email the user logs in with.")}</Text>
          <Field label={translate("User Email")} value={userEmail} onChangeText={setUserEmail} placeholder={translate("user@example.com")} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.sectionTitle}>{translate("Fine Details")}</Text>
          <Text style={styles.sectionHint}>{translate("Reason and amount are required. Fine code is optional.")}</Text>
          <Field label={translate("Reason")} value={reason} onChangeText={setReason} placeholder={translate("Over Speeding")} />

          <Field label={translate("Amount")} value={amount} onChangeText={setAmount} placeholder={translate("1500")} keyboardType="numeric" />

          <Field label={translate("Fine Code (optional)")} value={fineCode} onChangeText={setFineCode} placeholder={translate("Leave blank to auto-generate")} />
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewTop}>
            <Text style={styles.previewLabel}>{translate("Live Preview")}</Text>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>{translate("UNPAID")}</Text>
            </View>
          </View>

          <Text style={styles.previewCode}>{fineCode.trim() || "Auto-generated fine code"}</Text>
          <Text style={styles.previewReason}>{reason.trim() || "Reason will appear here"}</Text>
          <Text style={styles.previewAmount}>{translate("Rs")}{amount.trim() || "0"}</Text>
          <Text style={styles.previewEmail}>{userEmail.trim() || "No recipient email yet"}</Text>
        </View>

        <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabledBtn]} onPress={submit} disabled={submitting} activeOpacity={0.9}>
          {submitting ? <ActivityIndicator color="#fff" /> : <>
              <Ionicons name="paper-plane-outline" size={18} color="#fff" />
            <Text style={styles.submitTxt}>{translate("Issue Fine")}</Text>
          </>}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>;
}
function Field({
  label,
  ...props
}) {
  return <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} style={styles.input} placeholderTextColor="#9A9A9A" />
    </View>;
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F3EE"
  },
  content: {
    paddingBottom: 28
  },
  page: {
    padding: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#B45309",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 3
  },
  headerTextWrap: {
    flex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111"
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#7C6C60"
  },
  heroCard: {
    backgroundColor: "#FFF7EF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderWidth: 1,
    borderColor: "#F3D3B3"
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center"
  },
  heroTextWrap: {
    flex: 1
  },
  heroTitle: {
    color: "#111",
    fontSize: 18,
    fontWeight: "800"
  },
  heroText: {
    marginTop: 6,
    color: "#7C6C60",
    fontSize: 13,
    lineHeight: 18
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EADBCB",
    shadowColor: "#B45309",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6
    },
    elevation: 4
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4
  },
  sectionHint: {
    fontSize: 12,
    color: "#7C6C60",
    marginBottom: 12,
    lineHeight: 17
  },
  fieldWrap: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5F5248",
    marginBottom: 8
  },
  input: {
    backgroundColor: "#FFFDFB",
    borderWidth: 1,
    borderColor: "#EADBCB",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111"
  },
  previewCard: {
    marginTop: 16,
    backgroundColor: "#FFF7F0",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#FFD7B0"
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  previewLabel: {
    color: "#9A3412",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4
  },
  previewBadge: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FFD7B0"
  },
  previewBadgeText: {
    color: "#D97706",
    fontSize: 11,
    fontWeight: "900"
  },
  previewCode: {
    color: "#111",
    fontSize: 17,
    fontWeight: "800"
  },
  previewReason: {
    marginTop: 8,
    color: "#555",
    fontSize: 14,
    fontWeight: "700"
  },
  previewAmount: {
    marginTop: 12,
    color: ORANGE,
    fontSize: 28,
    fontWeight: "900"
  },
  previewEmail: {
    marginTop: 8,
    color: "#777",
    fontSize: 12,
    fontWeight: "700"
  },
  submitBtn: {
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: ORANGE,
    borderRadius: 20,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#FF7A00",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6
    },
    elevation: 4
  },
  submitTxt: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800"
  },
  disabledBtn: {
    opacity: 0.7
  }
});
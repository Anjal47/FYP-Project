import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL, getJSON, postJSON } from "../utils/api";

const FinePaymentScreen = ({ route }) => {
  const navigation = useNavigation();

  const incomingFine = route?.params?.fine;

  const [fine, setFine] = useState(
    incomingFine || {
      _id: "",
      fineCode: "No fine loaded",
      reason: "Your latest traffic fine will appear here",
      amount: 0,
      status: "UNPAID",
    }
  );

  const [payment, setPayment] = useState(null);
  const [loadingFine, setLoadingFine] = useState(!incomingFine?._id);
  const [loadingPay, setLoadingPay] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadMyFine() {
      if (incomingFine?._id) return;

      try {
        setLoadingFine(true);
        const res = await getJSON("/api/traffic/fines/mine");
        const fines = Array.isArray(res?.fines) ? res.fines : [];
        const selected =
          fines.find((item) => item.status === "UNPAID") ||
          fines.find((item) => item.status === "PENDING") ||
          fines[0] ||
          null;

        if (!active) return;

        if (selected) {
          setFine(selected);
        } else {
          setFine({
            _id: "",
            fineCode: "No active fine",
            reason: "You do not have any traffic fines to pay right now",
            amount: 0,
            status: "UNPAID",
          });
        }
      } catch (error) {
        if (!active) return;
        Alert.alert("Error", error.message || "Failed to load your fines");
      } finally {
        if (active) setLoadingFine(false);
      }
    }

    loadMyFine();
    return () => {
      active = false;
    };
  }, [incomingFine?._id]);

  const handlePayNow = async () => {
    try {
      const fineId = fine?._id;

      if (!fineId) {
        Alert.alert("Error", "No payable fine found for your account");
        return;
      }

      setLoadingPay(true);

      const res = await postJSON("/api/traffic/payments/initiate", {
        fineId: fineId,
      });

      if (res.ok) {
        setPayment(res.payment);
        setFine((prev) => ({
          ...prev,
          status: "PENDING",
        }));

        const redirectUrl =
          res?.esewa?.redirectUrl ||
          (res?.payment?._id
            ? `${BASE_URL}/api/traffic/payments/${res.payment._id}/esewa`
            : null);
        if (!redirectUrl) {
          throw new Error("eSewa redirect URL was not returned");
        }

        await Linking.openURL(redirectUrl);
      } else {
        Alert.alert("Error", res.message || "Failed to initiate payment");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoadingPay(false);
    }
  };

  const handleVerifyPayment = async () => {
    try {
      if (!payment?._id) {
        Alert.alert("Error", "Start payment first");
        return;
      }

      setLoadingVerify(true);

      const res = await postJSON("/api/traffic/payments/verify", {
        paymentId: payment._id,
      });

      if (res.ok) {
        setPayment(res.payment || payment);
        setFine((prev) => ({
          ...prev,
          status:
            res?.payment?.status === "SUCCESS"
              ? "PAID"
              : res?.payment?.status === "FAILED"
                ? "UNPAID"
                : "PENDING",
        }));
        Alert.alert(
          res?.payment?.status === "SUCCESS" ? "Success" : "Verification",
          res.message || "Verification completed"
        );
      } else {
        Alert.alert("Error", res.message || "Verification failed");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoadingVerify(false);
    }
  };

  const getStatusColor = () => {
    if (fine.status === "PAID") return "#16A34A";
    if (fine.status === "PENDING") return "#D97706";
    return "#FF3B30";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color="#111" />
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>
            <Text style={{ color: "#FF7A00" }}>Traffic</Text> Fine
          </Text>
          <Text style={styles.subtitle}>Pay your fine securely</Text>
        </View>
      </View>

      <View style={styles.card}>
        {loadingFine ? (
          <View style={styles.loadingFineWrap}>
            <ActivityIndicator color="#FF7A00" />
            <Text style={styles.loadingFineText}>Loading your fine...</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.label}>Fine Code</Text>
          <Text style={styles.value}>{fine.fineCode || "N/A"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Reason</Text>
          <Text style={styles.value}>{fine.reason}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.amount}>Rs {fine.amount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {fine.status}
          </Text>
        </View>

        {payment?.transactionRef ? (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Transaction Ref</Text>
              <Text style={styles.value}>{payment.transactionRef}</Text>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.infoCard}>
        <Icon name="info" size={18} color="#FF7A00" />
        <Text style={styles.infoText}>
          Press Pay Now first, then Verify Payment.
        </Text>
      </View>

      <View style={styles.sandboxCard}>
        <Text style={styles.sandboxTitle}>eSewa Sandbox Test Account</Text>
        <Text style={styles.sandboxText}>ID: 9806800001</Text>
        <Text style={styles.sandboxText}>Password: Nepal@123</Text>
        <Text style={styles.sandboxText}>Token / OTP: 123456</Text>
      </View>

      {fine.status !== "PAID" ? (
        <>
          <TouchableOpacity
            style={[styles.button, loadingPay && styles.disabledButton]}
            onPress={handlePayNow}
            disabled={loadingPay || loadingFine || !fine?._id}
            activeOpacity={0.85}
          >
            {loadingPay ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="credit-card" size={18} color="#fff" />
                <Text style={styles.buttonText}>Pay Now</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              loadingVerify && styles.disabledButton,
            ]}
            onPress={handleVerifyPayment}
            disabled={loadingVerify || loadingFine || !fine?._id}
            activeOpacity={0.85}
          >
            {loadingVerify ? (
              <ActivityIndicator color="#FF7A00" />
            ) : (
              <>
                <Icon name="check-circle" size={18} color="#FF7A00" />
                <Text style={styles.secondaryButtonText}>Verify Payment</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.successCard}>
          <Icon name="check-circle" size={22} color="#16A34A" />
          <Text style={styles.successText}>Fine paid successfully</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default FinePaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F7",
    padding: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 3,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
  },

  subtitle: {
    color: "#888",
    marginTop: 4,
    fontSize: 13,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    elevation: 6,
  },
  loadingFineWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  loadingFineText: {
    marginLeft: 10,
    color: "#777",
    fontSize: 13,
    fontWeight: "700",
  },

  row: {
    marginVertical: 6,
  },

  label: {
    fontSize: 12,
    color: "#999",
  },

  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },

  amount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF3B30",
  },

  statusText: {
    fontSize: 16,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 8,
  },

  infoCard: {
    backgroundColor: "#FFF4E8",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  infoText: {
    marginLeft: 10,
    color: "#9A3412",
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  sandboxCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EDE7DA",
  },
  sandboxTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  sandboxText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },

  button: {
    flexDirection: "row",
    backgroundColor: "#FF7A00",
    padding: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    marginBottom: 12,
  },

  secondaryButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF7A00",
  },

  buttonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "700",
    fontSize: 15,
  },

  secondaryButtonText: {
    color: "#FF7A00",
    marginLeft: 8,
    fontWeight: "700",
    fontSize: 15,
  },

  disabledButton: {
    opacity: 0.7,
  },

  successCard: {
    backgroundColor: "#ECFDF3",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  successText: {
    color: "#16A34A",
    marginLeft: 8,
    fontWeight: "800",
    fontSize: 16,
  },
});

import AsyncStorage from "@react-native-async-storage/async-storage";

export function getRoleRoute(role) {
  if (role === "admin") return "AdminTabs";
  if (role === "counsellor") return "CounsellorHome";
  if (role === "therapist") return "TherapistHome";
  if (role === "police") return "PoliceHome";
  if (role === "municipality") return "MunicipalityWasteDashboard";
  return "Home";
}

export async function resolveInitialRouteFromStorage(storage = AsyncStorage) {
  try {
    const token = await storage.getItem("token");
    const userStr = await storage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (token && user?.role) {
      return getRoleRoute(user.role);
    }

    return "Welcome";
  } catch {
    return "Welcome";
  }
}

export function parsePaymentReturnUrl(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const target = parsed.host || parsed.pathname.replace(/^\//, "");

    if (target !== "payment-return") {
      return null;
    }

    return {
      paymentId: parsed.searchParams.get("paymentId") || "",
      status: parsed.searchParams.get("status") || "",
    };
  } catch {
    return null;
  }
}

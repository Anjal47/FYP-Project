import { Alert, Linking } from "react-native";

function sanitizeRoomSegment(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}

export function buildVideoRoom({ appointmentId, serviceType }) {
  const safeAppointmentId = sanitizeRoomSegment(appointmentId, "room");
  const safeServiceType = sanitizeRoomSegment(serviceType, "chat");
  const roomName = `myapp-${safeServiceType}-${safeAppointmentId}`;
  const roomConfig = [
    "config.prejoinPageEnabled=false",
    "config.disableDeepLinking=true",
    "config.requireDisplayName=false",
    "interfaceConfig.MOBILE_APP_PROMO=false",
  ].join("&");

  return {
    roomName,
    webUrl: `https://meet.jit.si/${encodeURIComponent(roomName)}#${roomConfig}`,
  };
}

export async function openVideoCall({ appointmentId, serviceType, participantName }) {
  if (!appointmentId) {
    Alert.alert("Video call unavailable", "This chat is missing its appointment ID.");
    return;
  }

  const { webUrl } = buildVideoRoom({ appointmentId, serviceType });

  try {
    await Linking.openURL(webUrl);
  } catch (error) {
    Alert.alert(
      "Video call unavailable",
      error?.message || `Could not open the video call for ${participantName || "this chat"}.`
    );
  }
}

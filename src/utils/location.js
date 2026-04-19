import { Alert, PermissionsAndroid, Platform } from "react-native";
import Geolocation from "@react-native-community/geolocation";

async function requestAndroidLocationPermission() {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: "Allow precise location",
      message: "AngelTouch needs your location to pin the report exactly.",
      buttonPositive: "Allow",
      buttonNegative: "Deny",
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getCurrentPreciseLocation() {
  if (Platform.OS === "android") {
    const allowed = await requestAndroidLocationPermission();
    if (!allowed) {
      throw new Error("Location permission was denied");
    }
  }

  if (Platform.OS === "ios") {
    const auth = await Geolocation.requestAuthorization("whenInUse");
    if (auth === "denied" || auth === "disabled") {
      throw new Error("Location permission was denied");
    }
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          capturedAt: new Date(position.timestamp || Date.now()).toISOString(),
        });
      },
      (error) => {
        reject(new Error(error?.message || "Unable to get current location"));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
}

export function formatPinnedLocation(geoLocation) {
  if (
    !Number.isFinite(geoLocation?.latitude) ||
    !Number.isFinite(geoLocation?.longitude)
  ) {
    return "No pinpoint selected";
  }

  const parts = [
    `${geoLocation.latitude.toFixed(6)}, ${geoLocation.longitude.toFixed(6)}`,
  ];

  if (Number.isFinite(geoLocation?.accuracy)) {
    parts.push(`±${Math.round(geoLocation.accuracy)}m`);
  }

  return parts.join(" • ");
}

export function showLocationUnavailableAlert(error) {
  Alert.alert(
    "Location unavailable",
    error?.message || "We couldn't fetch your current location."
  );
}

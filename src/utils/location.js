import { Alert, PermissionsAndroid, Platform } from "react-native";
import Geolocation from "@react-native-community/geolocation";

const DEFAULT_LOCATION_COPY = {
  permissionTitle: "Allow precise location",
  permissionMessage: "AngelTouch needs your location to pin the report exactly.",
  permissionAllow: "Allow",
  permissionDeny: "Deny",
  permissionDeniedMessage: "Location permission was denied",
  locationUnavailableTitle: "Location unavailable",
  locationUnavailableMessage: "We couldn't fetch your current location.",
  noPinnedPoint: "No pinpoint selected",
};

function getLocationCopy(copy = {}) {
  return { ...DEFAULT_LOCATION_COPY, ...copy };
}

async function requestAndroidLocationPermission(copy) {
  const strings = getLocationCopy(copy);

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: strings.permissionTitle,
      message: strings.permissionMessage,
      buttonPositive: strings.permissionAllow,
      buttonNegative: strings.permissionDeny,
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getCurrentPreciseLocation(copy) {
  const strings = getLocationCopy(copy);

  if (Platform.OS === "android") {
    const allowed = await requestAndroidLocationPermission(strings);
    if (!allowed) {
      throw new Error(strings.permissionDeniedMessage);
    }
  }

  if (Platform.OS === "ios") {
    const auth = await Geolocation.requestAuthorization("whenInUse");
    if (auth === "denied" || auth === "disabled") {
      throw new Error(strings.permissionDeniedMessage);
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
        reject(new Error(error?.message || strings.locationUnavailableMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
}

export function formatPinnedLocation(geoLocation, copy) {
  const strings = getLocationCopy(copy);

  if (
    !Number.isFinite(geoLocation?.latitude) ||
    !Number.isFinite(geoLocation?.longitude)
  ) {
    return strings.noPinnedPoint;
  }

  const parts = [
    `${geoLocation.latitude.toFixed(6)}, ${geoLocation.longitude.toFixed(6)}`,
  ];

  if (Number.isFinite(geoLocation?.accuracy)) {
    parts.push(`+/-${Math.round(geoLocation.accuracy)}m`);
  }

  return parts.join(" | ");
}

export function showLocationUnavailableAlert(error, copy) {
  const strings = getLocationCopy(copy);

  Alert.alert(
    strings.locationUnavailableTitle,
    error?.message || strings.locationUnavailableMessage
  );
}

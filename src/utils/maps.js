import { Linking } from "react-native";

export async function openCoordinatesInMaps({ latitude, longitude, label = "Pinned location" }) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Missing coordinates for this location.");
  }

  const encodedLabel = encodeURIComponent(label);
  const coordinatePair = `${latitude},${longitude}`;
  const mapUrls = [
    `geo:${coordinatePair}?q=${coordinatePair}(${encodedLabel})`,
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinatePair)}`,
  ];

  let lastError = null;

  for (const url of mapUrls) {
    try {
      await Linking.openURL(url);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No maps app or browser is available on this device.");
}

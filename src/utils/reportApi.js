import { launchImageLibrary } from "react-native-image-picker";

const BASE_URL = "http://10.0.2.2:5000";

function normalizePickedFile(asset, fallbackName) {
  if (!asset?.uri) return null;
  return {
    uri: asset.uri,
    type: asset.type || "application/octet-stream",
    name: asset.fileName || fallbackName,
  };
}

export async function pickReportPhoto() {
  const result = await launchImageLibrary({
    mediaType: "photo",
    selectionLimit: 1,
    quality: 0.8,
  });

  if (result.didCancel) return null;
  if (result.errorCode) {
    throw new Error(result.errorMessage || "Could not pick image");
  }

  return normalizePickedFile(result.assets?.[0], `report-photo-${Date.now()}.jpg`);
}

export async function pickReportVideo() {
  const result = await launchImageLibrary({
    mediaType: "video",
    selectionLimit: 1,
  });

  if (result.didCancel) return null;
  if (result.errorCode) {
    throw new Error(result.errorMessage || "Could not pick video");
  }

  return normalizePickedFile(result.assets?.[0], `report-video-${Date.now()}.mp4`);
}

export async function createReportRequest(token, payload, media = {}) {
  const cleanPayload = {
    type: String(payload?.type || "").trim(),
    area: String(payload?.area || "").trim(),
    description: String(payload?.description || "").trim(),
    priority: String(payload?.priority || "Medium").trim(),
    geoLocation:
      payload?.geoLocation &&
      Number.isFinite(Number(payload.geoLocation.latitude)) &&
      Number.isFinite(Number(payload.geoLocation.longitude))
        ? {
            latitude: Number(payload.geoLocation.latitude),
            longitude: Number(payload.geoLocation.longitude),
            accuracy: Number.isFinite(Number(payload.geoLocation.accuracy))
              ? Number(payload.geoLocation.accuracy)
              : null,
            capturedAt: payload.geoLocation.capturedAt || new Date().toISOString(),
          }
        : null,
  };

  if (!cleanPayload.type || !cleanPayload.area) {
    throw new Error("type and area required");
  }

  const hasMedia = !!(media.photo || media.video || media.audio);

  let res;

  if (hasMedia) {
    const body = new FormData();
    body.append("type", cleanPayload.type);
    body.append("area", cleanPayload.area);
    body.append("description", cleanPayload.description);
    body.append("priority", cleanPayload.priority);
    if (cleanPayload.geoLocation) {
      body.append("geoLocation", JSON.stringify(cleanPayload.geoLocation));
    }
    body.append("payload", JSON.stringify(cleanPayload));

    if (media.photo) body.append("photo", media.photo);
    if (media.video) body.append("video", media.video);
    if (media.audio) body.append("audio", media.audio);

    res = await fetch(`${BASE_URL}/api/reports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
    });
  } else {
    res = await fetch(`${BASE_URL}/api/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cleanPayload),
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to submit report");
  return data;
}

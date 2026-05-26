import { Alert } from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { BASE_URL } from "./api";

let cachedDocumentPickerModule;
let cachedDocumentPickerLoadError = null;
let documentPickerLoadAttempted = false;

function getDocumentPickerModule() {
  if (!documentPickerLoadAttempted) {
    documentPickerLoadAttempted = true;

    try {
      // Load lazily so stale native binaries do not crash as soon as a report screen renders.
      cachedDocumentPickerModule = require("@react-native-documents/picker");
      cachedDocumentPickerLoadError = null;
    } catch (error) {
      cachedDocumentPickerModule = null;
      cachedDocumentPickerLoadError = error;
    }
  }

  return {
    DocumentPicker: cachedDocumentPickerModule,
    loadError: cachedDocumentPickerLoadError,
  };
}

function createAudioPickerUnavailableError() {
  return new Error(
    "Audio upload needs a rebuilt app before the native picker is available. Close the current app, rebuild Android, and try again."
  );
}

function normalizeToken(token) {
  if (!token) return "";

  const cleaned = String(token).trim().replace(/^"+|"+$/g, "");
  return cleaned.startsWith("Bearer ") ? cleaned.slice(7).trim() : cleaned;
}

function normalizePickedFile(asset, fallbackName) {
  if (!asset?.uri) return null;
  return {
    uri: asset.uri,
    type: asset.type || "application/octet-stream",
    name: asset.fileName || fallbackName,
  };
}

function normalizeDocumentFile(file, fallbackName) {
  const uri = file?.fileCopyUri || file?.uri;
  if (!uri) return null;

  return {
    uri,
    type: file.type || "application/octet-stream",
    name: file.name || fallbackName,
  };
}

export function isReportAudioPickerAvailable() {
  const { DocumentPicker } = getDocumentPickerModule();
  return !!(DocumentPicker?.pick && DocumentPicker?.types?.audio);
}

async function pickSingleVisualAsset(launcher, fallbackName, errorMessage, options = {}) {
  const result = await launcher({
    mediaType: "photo",
    selectionLimit: 1,
    quality: 0.8,
    saveToPhotos: false,
    cameraType: "back",
    ...options,
  });

  if (result.didCancel) return null;
  if (result.errorCode) {
    throw new Error(result.errorMessage || errorMessage);
  }

  return normalizePickedFile(result.assets?.[0], fallbackName);
}

function promptForVisualSource({
  title,
  message,
  uploadLabel,
  captureLabel,
  cancelLabel,
  uploadPicker,
  capturePicker,
}) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finishResolve = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    const finishReject = (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    const runPicker = async (picker) => {
      try {
        finishResolve(await picker());
      } catch (error) {
        finishReject(error);
      }
    };

    Alert.alert(
      title,
      message,
      [
        {
          text: cancelLabel,
          style: "cancel",
          onPress: () => finishResolve(null),
        },
        {
          text: uploadLabel,
          onPress: () => {
            runPicker(uploadPicker);
          },
        },
        {
          text: captureLabel,
          onPress: () => {
            runPicker(capturePicker);
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => finishResolve(null),
      }
    );
  });
}


export async function pickReportPhotoFromLibrary() {
  return pickSingleVisualAsset(
    launchImageLibrary,
    `report-photo-${Date.now()}.jpg`,
    "Could not pick image"
  );
}

export async function captureReportPhoto() {
  return pickSingleVisualAsset(
    launchCamera,
    `report-photo-${Date.now()}.jpg`,
    "Could not capture image"
  );
}

export function pickReportPhoto(options = {}) {
  const {
    title = "Add Image",
    message = "Choose how to add an image for this report.",
    uploadLabel = "Upload",
    captureLabel = "Capture",
    cancelLabel = "Cancel",
  } = options;

  return promptForVisualSource({
    title,
    message,
    uploadLabel,
    captureLabel,
    cancelLabel,
    uploadPicker: pickReportPhotoFromLibrary,
    capturePicker: captureReportPhoto,
  });
}

export async function pickReportVideoFromLibrary() {
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

export async function captureReportVideo() {
  const result = await launchCamera({
    mediaType: "video",
    saveToPhotos: false,
    cameraType: "back",
    durationLimit: 60,
    videoQuality: "high",
  });

  if (result.didCancel) return null;
  if (result.errorCode) {
    throw new Error(result.errorMessage || "Could not capture video");
  }

  return normalizePickedFile(result.assets?.[0], `report-video-${Date.now()}.mp4`);
}

export function pickReportVideo(options = {}) {
  const {
    title = "Add Video",
    message = "Choose how to add a video for this report.",
    uploadLabel = "Upload",
    captureLabel = "Capture",
    cancelLabel = "Cancel",
  } = options;

  return promptForVisualSource({
    title,
    message,
    uploadLabel,
    captureLabel,
    cancelLabel,
    uploadPicker: pickReportVideoFromLibrary,
    capturePicker: captureReportVideo,
  });
}

export async function pickReportAudio() {
  const { DocumentPicker, loadError } = getDocumentPickerModule();

  if (!DocumentPicker?.pick || !DocumentPicker?.types?.audio) {
    throw loadError instanceof Error
      ? createAudioPickerUnavailableError()
      : createAudioPickerUnavailableError();
  }

  try {
    const [result] = await DocumentPicker.pick({
      type: [DocumentPicker.types.audio],
    });

    return normalizeDocumentFile(result, `report-audio-${Date.now()}.m4a`);
  } catch (error) {
    if (
      DocumentPicker.isErrorWithCode?.(error) &&
      error.code === DocumentPicker.errorCodes?.OPERATION_CANCELED
    ) {
      return null;
    }

    if (
      error instanceof Error &&
      /RNDocumentPicker|TurboModuleRegistry\.getEnforcing/i.test(error.message)
    ) {
      throw createAudioPickerUnavailableError();
    }

    throw new Error(error?.message || "Could not pick audio");
  }
}
export async function createReportRequest(token, payload, media = {}) {
  const authToken = normalizeToken(token);
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

  if (!authToken) {
    throw new Error("Login required");
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
        Authorization: `Bearer ${authToken}`,
      },
      body,
    });
  } else {
    res = await fetch(`${BASE_URL}/api/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(cleanPayload),
    });
  }

  try {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Failed to submit report");
    return data;
  } catch (error) {
    if (error instanceof Error && error.message === "Network request failed") {
      throw new Error(`Could not reach the report server at ${BASE_URL}. If you are testing on a real phone, update the API base URL to your computer's LAN IP.`);
    }
    throw error;
  }
}

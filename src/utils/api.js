import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "http://10.0.2.2:5000";

function normalizeToken(token) {
  if (!token) return "";

  const cleaned = String(token).trim().replace(/^"+|"+$/g, "");
  return cleaned.startsWith("Bearer ") ? cleaned.slice(7).trim() : cleaned;
}

async function getAuthHeaders(extraHeaders = {}) {
  const rawToken = await AsyncStorage.getItem("token");
  const token = normalizeToken(rawToken);

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readJson(res) {
  return res.json().catch(() => ({}));
}

async function handleApiError(res) {
  const data = await readJson(res);
  const message = data?.message || "Request failed";

  if (
    res.status === 401 &&
    ["Invalid token", "Missing token", "User not found"].includes(message)
  ) {
    await AsyncStorage.multiRemove(["token", "user"]);
    throw new Error("Your session expired. Please log in again.");
  }

  throw new Error(message);
}

export async function getJSON(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    await handleApiError(res);
  }

  return readJson(res);
}

export async function postJSON(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: await getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body || {}),
  });

  if (!res.ok) {
    await handleApiError(res);
  }

  return readJson(res);
}

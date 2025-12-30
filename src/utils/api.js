const BASE_URL = "http://10.0.2.2:5000"; // Android emulator
// If physical device, use your PC IP e.g. http://192.168.1.10:5000

export async function postJSON(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

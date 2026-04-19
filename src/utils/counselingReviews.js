import { BASE_URL } from "./api";

export async function getMyCounselingReviews(token) {
  const res = await fetch(`${BASE_URL}/api/counseling/reviews/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load reviews");
  return data;
}

export async function submitCounselingReview(token, appointmentId, payload) {
  const res = await fetch(`${BASE_URL}/api/counseling/appointments/${appointmentId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to submit review");
  return data;
}

export function formatReviewSummary(summary) {
  const average = Number(summary?.averageRating || 0);
  const count = Number(summary?.reviewCount || 0);

  if (!count) return "No reviews yet";
  return `${average.toFixed(1)} / 5 (${count} review${count === 1 ? "" : "s"})`;
}

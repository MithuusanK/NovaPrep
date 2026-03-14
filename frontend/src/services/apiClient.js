const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Small helper for JSON POST requests to the backend.
 * Keeps network and error handling consistent across API calls.
 */
export async function postJson(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const rawText = await response.text();
  let data = {};

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    const message =
      data?.error ||
      (rawText ? `Request failed with status ${response.status}: ${rawText.slice(0, 180)}` : `Request failed with status ${response.status}`);
    throw new Error(message);
  }

  return data;
}

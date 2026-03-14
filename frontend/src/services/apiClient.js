const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function parseApiResponse(response) {
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
      (rawText
        ? `Request failed with status ${response.status}: ${rawText.slice(0, 180)}`
        : `Request failed with status ${response.status}`);
    throw new Error(message);
  }

  return data;
}

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

  return parseApiResponse(response);
}

/**
 * Helper for multipart/form-data POST requests.
 */
export async function postFormData(path, formData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData
  });

  return parseApiResponse(response);
}

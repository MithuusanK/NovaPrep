export function safeJsonParse(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("AI response is empty or invalid.");
  }

  // Handle common LLM behavior where JSON is wrapped in ```json blocks.
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  return JSON.parse(cleaned);
}

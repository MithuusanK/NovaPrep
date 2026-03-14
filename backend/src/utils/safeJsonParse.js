export function safeJsonParse(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("AI response is empty or invalid.");
  }

  // Handle common LLM behavior where JSON is wrapped in markdown fences.
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // Fast path: valid raw JSON.
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    // Fallback: extract the first JSON object/array from mixed text.
    const objectStart = cleaned.indexOf("{");
    const objectEnd = cleaned.lastIndexOf("}");
    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");

    const hasObject = objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart;
    const hasArray = arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart;

    if (hasObject && (!hasArray || objectStart <= arrayStart)) {
      return JSON.parse(cleaned.slice(objectStart, objectEnd + 1));
    }

    if (hasArray) {
      return JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1));
    }

    throw firstError;
  }
}

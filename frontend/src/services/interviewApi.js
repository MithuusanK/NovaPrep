import { postJson } from "./apiClient";

/**
 * Integration points for all required interview backend routes.
 */
export function generateQuestion(payload) {
  return postJson("/api/generate-question", payload);
}

export function evaluateAnswer(payload) {
  return postJson("/api/evaluate-answer", payload);
}

export function generateFinalSummary(payload) {
  return postJson("/api/final-summary", payload);
}

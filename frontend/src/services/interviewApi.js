import { postFormData, postJson } from "./apiClient";

export function parseResume({ resumeText, resumeFile, targetRoleHint }) {
  if (resumeFile) {
    const formData = new FormData();
    formData.append("resumeFile", resumeFile);
    formData.append("targetRoleHint", targetRoleHint || "");
    if (resumeText) {
      formData.append("resumeText", resumeText);
    }

    return postFormData("/api/parse-resume", formData);
  }

  return postJson("/api/parse-resume", {
    resumeText: resumeText || "",
    targetRoleHint: targetRoleHint || ""
  });
}

/**
 * Integration points for all required interview backend routes.
 */
export function generateQuestion(payload) {
  return postJson("/api/generate-question", payload);
}

export function evaluateAnswer(payload) {
  return postJson("/api/evaluate-answer", payload);
}

export function conversationTurn(payload) {
  return postJson("/api/conversation-turn", payload);
}

export function generateFinalSummary(payload) {
  return postJson("/api/final-summary", payload);
}

export function transcribeVoice(payload) {
  return postJson("/api/voice/transcribe", payload);
}

export function speakVoice(payload) {
  return postJson("/api/voice/speak", payload);
}

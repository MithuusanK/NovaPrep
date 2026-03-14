import pdfParse from "pdf-parse";

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

export async function extractResumeText(file) {
  if (!file) {
    return "";
  }

  if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new Error("Uploaded resume file is invalid.");
  }

  if (file.size > MAX_RESUME_BYTES) {
    throw new Error("Resume file is too large. Please keep it under 5 MB.");
  }

  const mimeType = String(file.mimetype || "").toLowerCase();
  const originalName = String(file.originalname || "").toLowerCase();
  const isPdf = mimeType === "application/pdf" || originalName.endsWith(".pdf");
  const isText =
    mimeType === "text/plain" ||
    originalName.endsWith(".txt") ||
    originalName.endsWith(".md");

  if (isPdf) {
    const parsed = await pdfParse(file.buffer);
    return String(parsed?.text || "").trim();
  }

  if (isText) {
    return file.buffer.toString("utf-8").trim();
  }

  throw new Error("Unsupported resume file type. Use PDF or TXT.");
}

export function errorHandler(err, req, res, next) {
  console.error("API Error:", err);

  const isMulterError = err?.name === "MulterError";
  const status = err.status || (isMulterError ? 400 : 500);
  const message = isMulterError
    ? "Invalid file upload. Please use a PDF or TXT file under 5 MB."
    : err.message || "Internal server error";

  res.status(status).json({
    error: message
  });
}

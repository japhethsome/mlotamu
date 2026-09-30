export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.originalUrl}`,
  });
}

export function errorHandler(error, req, res, next) {
  console.error("[server:error]", error);

  const status = error.status || 500;
  const message = error.message || "Unexpected server error.";

  res.status(status).json({
    message,
    details: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
}

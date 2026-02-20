export const notFound = (req, res, _next) => {
  res.status(404).json({ message: `Not Found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, _next) => {
  const statusFromError = err.statusCode || err.status || res.statusCode;
  const status = statusFromError && statusFromError !== 200 ? statusFromError : 500;

  // Log server-side for diagnostics; avoid leaking stack to clients.
  console.error(`[ERROR] ${req.method} ${req.originalUrl} -> ${status}`, err);

  const response = {
    message: err.message || "Server Error"
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

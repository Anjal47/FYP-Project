function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found: ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    ok: false,
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}

module.exports = { notFound, errorHandler };

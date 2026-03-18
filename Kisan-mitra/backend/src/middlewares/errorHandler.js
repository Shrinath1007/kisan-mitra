// src/middlewares/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
  });
};

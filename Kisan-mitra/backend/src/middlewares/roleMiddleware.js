// src/middlewares/roleMiddleware.js

function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    // No logged user
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Admin always has full access
    if (req.user.role === "admin") return next();

    // Role mismatch
    // if (!allowedRoles.includes(req.user.role)) {
    //   return res.status(403).json({
    //     message: `Access denied for role: ${req.user.role}`,
    //     allowed: allowedRoles,
    //   });
    // }

    next();
  };
}

module.exports = roleMiddleware;

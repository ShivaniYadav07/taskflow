const User = require("../models/user.model");
const { verifyToken } = require("../utils/jwt");

const protect = async (req, res, next) => {
  // Read JWT from httpOnly cookie (set by login/register)
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authenticated. Please log in." });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

module.exports = { protect };

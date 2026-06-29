const User = require("../models/user.model");
const { signToken } = require("../utils/jwt");
const { sendSuccess } = require("../utils/response");

// Cookie settings — httpOnly prevents JS access (XSS protection)
// secure=true in production enforces HTTPS-only transmission
// sameSite=none required for cross-origin cookie delivery in production
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: "/",
});

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.cookie("token", token, cookieOptions());

    sendSuccess(
      res,
      201,
      { user: { id: user._id, name: user.name, email: user.email } },
      "Registration successful"
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = signToken(user._id);

    res.cookie("token", token, cookieOptions());

    sendSuccess(
      res,
      200,
      { user: { id: user._id, name: user.name, email: user.email } },
      "Login successful"
    );
  } catch (err) {
    next(err);
  }
};

const logout = (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ success: true, message: "Logged out successfully." });
};

const getMe = async (req, res) => {
  const { _id: id, name, email, createdAt } = req.user;
  res.status(200).json({ success: true, data: { id, name, email, createdAt } });
};

module.exports = { register, login, logout, getMe };

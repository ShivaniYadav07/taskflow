const User = require("../models/user.model");
const { signToken } = require("../utils/jwt");
const { sendSuccess } = require("../utils/response");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    sendSuccess(res, 201, { token, user: { id: user._id, name: user.name, email: user.email } }, "Registration successful");
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (excluded by default via `select: false`)
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = signToken(user._id);

    sendSuccess(res, 200, { token, user: { id: user._id, name: user.name, email: user.email } }, "Login successful");
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  const { _id: id, name, email, createdAt } = req.user;
  res.status(200).json({ success: true, data: { id, name, email, createdAt } });
};

module.exports = { register, login, getMe };

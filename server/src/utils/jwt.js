const jwt = require("jsonwebtoken");

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    algorithm: "HS256",
  });

// Explicit algorithm whitelist prevents algorithm-confusion attacks
const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });

module.exports = { signToken, verifyToken };

const { Router } = require("express");
const { body } = require("express-validator");

const { register, login, logout, getMe } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 50 }),
    body("email").normalizeEmail().isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").normalizeEmail().isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.post("/logout", logout);

router.get("/me", protect, getMe);

module.exports = router;

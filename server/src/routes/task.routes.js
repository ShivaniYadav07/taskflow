const { Router } = require("express");
const { body, param, query } = require("express-validator");

const {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

const router = Router();

// All task routes require a valid JWT
router.use(protect);

const STATUSES = ["todo", "in-progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

router.get(
  "/",
  [
    query("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}`),
    query("priority").optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(", ")}`),
  ],
  validate,
  getAllTasks
);

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid task ID")],
  validate,
  getTask
);

router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 100 }),
    body("description").optional().trim().isLength({ max: 500 }),
    body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}`),
    body("priority").optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(", ")}`),
    body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid date"),
  ],
  validate,
  createTask
);

router.patch(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    body("title").optional().trim().notEmpty().isLength({ max: 100 }),
    body("description").optional().trim().isLength({ max: 500 }),
    body("status").optional().isIn(STATUSES),
    body("priority").optional().isIn(PRIORITIES),
    body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid date"),
  ],
  validate,
  updateTask
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid task ID")],
  validate,
  deleteTask
);

module.exports = router;

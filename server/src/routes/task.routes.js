const { Router } = require("express");
const { body, param, query } = require("express-validator");

const {
  getTasksByProject,
  getMyTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");
const { getComments, addComment, deleteComment } = require("../controllers/comment.controller");
const { protect } = require("../middleware/auth.middleware");
const { verifyProjectMember } = require("../middleware/projectAuth.middleware");
const { validate } = require("../middleware/validate.middleware");

const router = Router();

router.use(protect);

const STATUSES = ["todo", "in-progress", "done"];
const PRIORITIES = ["low", "medium", "high"];
const SORT_FIELDS = [
  "-createdAt", "createdAt",
  "-dueDate", "dueDate",
  "-priority", "priority",
  "-title", "title",
];

// @route   GET /api/tasks/me
router.get(
  "/me",
  [
    query("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}`),
    query("priority").optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(", ")}`),
    query("sort").optional().isIn(SORT_FIELDS).withMessage(`sort must be one of: ${SORT_FIELDS.join(", ")}`),
  ],
  validate,
  getMyTasks
);

// @route   GET /api/tasks
router.get(
  "/",
  [
    query("projectId").isMongoId().withMessage("Valid projectId is required"),
    query("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}`),
    query("priority").optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(", ")}`),
    query("sort").optional().isIn(SORT_FIELDS).withMessage(`sort must be one of: ${SORT_FIELDS.join(", ")}`),
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 200 }).withMessage("limit must be between 1 and 200"),
  ],
  validate,
  verifyProjectMember,
  getTasksByProject
);

// @route   GET /api/tasks/:id
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid task ID")],
  validate,
  getTask
);

// @route   POST /api/tasks
router.post(
  "/",
  [
    body("projectId").isMongoId().withMessage("Valid projectId is required"),
    body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 100 }),
    body("description").optional().trim().isLength({ max: 500 }),
    body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}`),
    body("priority").optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(", ")}`),
    body("assignedTo").optional({ checkFalsy: true }).isMongoId().withMessage("assignedTo must be a valid user ID"),
    body("dueDate").optional({ checkFalsy: true }).isISO8601().withMessage("dueDate must be a valid date"),
  ],
  validate,
  verifyProjectMember,
  createTask
);

// @route   PATCH /api/tasks/:id
router.patch(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    body("title").optional().trim().notEmpty().isLength({ max: 100 }),
    body("description").optional().trim().isLength({ max: 500 }),
    body("status").optional().isIn(STATUSES),
    body("priority").optional().isIn(PRIORITIES),
    body("assignedTo").optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage("assignedTo must be a valid user ID"),
    body("dueDate").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("dueDate must be a valid date"),
  ],
  validate,
  updateTask
);

// @route   DELETE /api/tasks/:id
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid task ID")],
  validate,
  deleteTask
);

// @route   GET/POST /api/tasks/:id/comments
router.route("/:id/comments")
  .get(
    [param("id").isMongoId().withMessage("Invalid task ID")],
    validate,
    getComments
  )
  .post(
    [
      param("id").isMongoId().withMessage("Invalid task ID"),
      body("body").trim().notEmpty().withMessage("Comment body is required").isLength({ max: 2000 }),
    ],
    validate,
    addComment
  );

// @route   DELETE /api/tasks/:taskId/comments/:commentId
router.delete(
  "/:taskId/comments/:commentId",
  [
    param("taskId").isMongoId().withMessage("Invalid task ID"),
    param("commentId").isMongoId().withMessage("Invalid comment ID"),
  ],
  validate,
  deleteComment
);

module.exports = router;

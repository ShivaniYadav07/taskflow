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

// All task routes require a valid JWT
router.use(protect);

const STATUSES = ["todo", "in-progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

// @route   GET /api/tasks/me
// @desc    Get tasks assigned to current user across all projects
router.get(
  "/me",
  [
    query("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}`),
    query("priority").optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(", ")}`),
  ],
  validate,
  getMyTasks
);

// @route   GET /api/tasks
// @desc    Get all tasks for a specific project
router.get(
  "/",
  [
    query("projectId").isMongoId().withMessage("Valid projectId is required in query parameters"),
    query("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}`),
    query("priority").optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(", ")}`),
  ],
  validate,
  verifyProjectMember, // Automatically uses req.query.projectId
  getTasksByProject
);

// @route   GET /api/tasks/:id
// @desc    Get a single task
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid task ID")],
  validate,
  getTask
);

// @route   POST /api/tasks
// @desc    Create a new task within a project
router.post(
  "/",
  [
    body("projectId").isMongoId().withMessage("Valid projectId is required"),
    body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 100 }),
    body("description").optional().trim().isLength({ max: 500 }),
    body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}`),
    body("priority").optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(", ")}`),
    body("assignedTo").optional({ checkFalsy: true }).isMongoId().withMessage("assignedTo must be a valid user ID"),
  ],
  validate,
  verifyProjectMember, // Automatically uses req.body.projectId
  createTask
);

// @route   PATCH /api/tasks/:id
// @desc    Update a task (status, assignees, etc)
router.patch(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid task ID"),
    body("title").optional().trim().notEmpty().isLength({ max: 100 }),
    body("description").optional().trim().isLength({ max: 500 }),
    body("status").optional().isIn(STATUSES),
    body("priority").optional().isIn(PRIORITIES),
    body("assignedTo").optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage("assignedTo must be a valid user ID"),
  ],
  validate,
  updateTask // Validates project membership inside the controller using the task's DB state
);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid task ID")],
  validate,
  deleteTask // Validates project membership inside the controller
);

// @route   GET  /api/tasks/:id/comments
// @route   POST /api/tasks/:id/comments
// @desc    List or add comments on a task
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
// @desc    Delete own comment
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

const Task = require("../models/task.model");
const Comment = require("../models/comment.model");
const { sendSuccess } = require("../utils/response");

const isProjectMember = (project, userId) => {
  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some((id) => id.toString() === userId.toString());
  return isOwner || isMember;
};

// @desc    Get all tasks for a specific project
// @route   GET /api/tasks?projectId=...
// @access  Private (Project Member)
const getTasksByProject = async (req, res, next) => {
  try {
    if (!req.project) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const { status, priority, sort = "-createdAt", page = 1, limit = 50 } = req.query;

    const filter = { projectId: req.project._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const pageNumber = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10), 200); // hard cap at 200
    const skip = (pageNumber - 1) * limitNumber;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate("assignedTo createdBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limitNumber),
      Task.countDocuments(filter),
    ]);

    sendSuccess(res, 200, {
      count: tasks.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      tasks,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all tasks assigned to the current user across all projects
// @route   GET /api/tasks/me
// @access  Private
const getMyTasks = async (req, res, next) => {
  try {
    const { status, priority, sort = "-createdAt" } = req.query;

    const filter = { assignedTo: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate("projectId", "name key")
      .populate("createdBy", "name email")
      .sort(sort);

    sendSuccess(res, 200, { count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single task
// @route   GET /api/tasks/:id
// @access  Private (Project Member)
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("projectId", "name key owner members")
      .populate("assignedTo createdBy", "name email");

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    if (!isProjectMember(task.projectId, req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    sendSuccess(res, 200, { task });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new task within a project
// @route   POST /api/tasks
// @access  Private (Project Member)
const createTask = async (req, res, next) => {
  try {
    if (!req.project) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    if (assignedTo && !isProjectMember(req.project, assignedTo)) {
      return res.status(400).json({ success: false, message: "Assigned user is not a member of this project." });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      projectId: req.project._id,
      assignedTo,
      createdBy: req.user._id,
    });

    sendSuccess(res, 201, { task }, "Task created");
  } catch (err) {
    next(err);
  }
};

// @desc    Update a task
// @route   PATCH /api/tasks/:id
// @access  Private (Project Member)
const updateTask = async (req, res, next) => {
  try {
    const allowed = ["title", "description", "status", "priority", "assignedTo", "dueDate"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const task = await Task.findById(req.params.id).populate("projectId");

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    if (!isProjectMember(task.projectId, req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (updates.assignedTo && !isProjectMember(task.projectId, updates.assignedTo)) {
      return res.status(400).json({ success: false, message: "Assigned user is not a member of this project." });
    }

    Object.assign(task, updates);
    await task.save();

    sendSuccess(res, 200, { task }, "Task updated");
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a task and its comments
// @route   DELETE /api/tasks/:id
// @access  Private (Project Member)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate("projectId");

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    if (!isProjectMember(task.projectId, req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Cascade: delete all comments belonging to this task before removing the task
    await Comment.deleteMany({ taskId: task._id });
    await task.deleteOne();

    sendSuccess(res, 200, null, "Task deleted");
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasksByProject, getMyTasks, getTask, createTask, updateTask, deleteTask };

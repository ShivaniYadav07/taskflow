const Task = require("../models/task.model");
const { sendSuccess } = require("../utils/response");

const getAllTasks = async (req, res, next) => {
  try {
    const { status, priority, sort = "-createdAt", page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const tasks = await Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    const total = await Task.countDocuments(filter);

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

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }
    sendSuccess(res, 200, { task });
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const task = await Task.create({ title, description, status, priority, dueDate, user: req.user._id });
    sendSuccess(res, 201, { task }, "Task created");
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const allowed = ["title", "description", "status", "priority", "dueDate"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    sendSuccess(res, 200, { task }, "Task updated");
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }
    sendSuccess(res, 200, null, "Task deleted");
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllTasks, getTask, createTask, updateTask, deleteTask };

const Project = require("../models/project.model");
const Task = require("../models/task.model");
const Comment = require("../models/comment.model");
const User = require("../models/user.model");

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    const { name, key, description } = req.body;

    const existingProject = await Project.findOne({ owner: req.user._id, key: key.toUpperCase() });
    if (existingProject) {
      return res.status(400).json({ success: false, message: "A project with this key already exists." });
    }

    const project = await Project.create({
      name,
      key: key.toUpperCase(),
      description,
      owner: req.user._id,
      members: [],
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects for a user (owned or member)
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Private (Member/Owner)
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await req.project.populate("owner members", "name email");
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project details
// @route   PUT /api/projects/:id
// @access  Private (Owner only)
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    req.project.name = name || req.project.name;
    req.project.description = description !== undefined ? description : req.project.description;

    const updatedProject = await req.project.save();
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a project and all associated tasks and comments
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
exports.deleteProject = async (req, res, next) => {
  try {
    // Collect task IDs before deleting so we can cascade to comments
    const tasks = await Task.find({ projectId: req.project._id }, "_id");
    const taskIds = tasks.map((t) => t._id);

    // Cascade: comments → tasks → project
    await Comment.deleteMany({ taskId: { $in: taskIds } });
    await Task.deleteMany({ projectId: req.project._id });
    await req.project.deleteOne();

    res.status(200).json({ success: true, message: "Project and all associated data deleted." });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a member to the project by email
// @route   POST /api/projects/:id/members
// @access  Private (Owner only)
exports.addMember = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "User email is required" });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: "User not found with this email" });
    }

    if (userToAdd._id.toString() === req.project.owner.toString()) {
      return res.status(400).json({ success: false, message: "User is already the project owner" });
    }

    if (req.project.members.includes(userToAdd._id)) {
      return res.status(400).json({ success: false, message: "User is already a member" });
    }

    req.project.members.push(userToAdd._id);
    await req.project.save();

    res.status(200).json({ success: true, message: "Member added successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member from the project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Owner only)
exports.removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!req.project.members.some((id) => id.toString() === userId)) {
      return res.status(400).json({ success: false, message: "User is not a member of this project" });
    }

    req.project.members = req.project.members.filter((id) => id.toString() !== userId);
    await req.project.save();

    // Unassign the removed user from all tasks in this project
    await Task.updateMany(
      { projectId: req.project._id, assignedTo: userId },
      { $unset: { assignedTo: 1 } }
    );

    res.status(200).json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    next(error);
  }
};

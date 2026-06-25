const Project = require("../models/project.model");
const Task = require("../models/task.model");
const User = require("../models/user.model");

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { name, key, description } = req.body;

    // Check if project key already exists for this user to prevent collision
    const existingProject = await Project.findOne({ owner: req.user._id, key: key.toUpperCase() });
    if (existingProject) {
      return res.status(400).json({ success: false, message: "A project with this key already exists." });
    }

    const project = await Project.create({
      name,
      key: key.toUpperCase(),
      description,
      owner: req.user._id,
      members: [], // Owner doesn't need to be in members array
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get all projects for a user (owned or member)
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    // Find projects where the user is either the owner OR in the members array
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Private (Member/Owner)
exports.getProjectById = async (req, res) => {
  try {
    // req.project is already fetched and attached by verifyProjectMember middleware
    const project = await req.project.populate("owner members", "name email");
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Update project details
// @route   PUT /api/projects/:id
// @access  Private (Owner only)
exports.updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    // We only allow updating name and description, not the key or owner
    req.project.name = name || req.project.name;
    req.project.description = description !== undefined ? description : req.project.description;

    const updatedProject = await req.project.save();
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Delete a project and associated tasks
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
exports.deleteProject = async (req, res) => {
  try {
    // Cascading delete: Remove all tasks tied to this project first
    await Task.deleteMany({ projectId: req.project._id });
    
    // Delete the project itself
    await req.project.deleteOne();

    res.status(200).json({ success: true, message: "Project and associated tasks deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Add a member to the project by email
// @route   POST /api/projects/:id/members
// @access  Private (Owner only)
exports.addMember = async (req, res) => {
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
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Remove a member from the project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Owner only)
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.project.members.includes(userId)) {
      return res.status(400).json({ success: false, message: "User is not a member of this project" });
    }

    req.project.members = req.project.members.filter((id) => id.toString() !== userId);
    await req.project.save();

    // Clean up: Unassign this user from any tasks in this project
    await Task.updateMany(
      { projectId: req.project._id, assignedTo: userId },
      { $unset: { assignedTo: 1 } }
    );

    res.status(200).json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

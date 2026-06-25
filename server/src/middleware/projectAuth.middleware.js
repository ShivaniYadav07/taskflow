const Project = require("../models/project.model");

// Middleware to verify if a user has access to a project (Owner or Member)
exports.verifyProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.projectId || req.query.projectId;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((memberId) => memberId.toString() === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({ success: false, message: "Access denied. You are not a member of this project." });
    }

    // Attach project to request object to prevent redundant DB queries in controllers
    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error verifying project access", error: error.message });
  }
};

// Middleware to verify if a user is the absolute owner of a project (Admin rights)
exports.verifyProjectOwner = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.projectId || req.query.projectId;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    // If verifyProjectMember already ran, req.project will exist, saving a DB query
    const project = req.project || await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;

    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Access denied. Only the project owner can perform this action." });
    }

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error verifying project ownership", error: error.message });
  }
};

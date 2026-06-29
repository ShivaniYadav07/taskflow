const Comment = require("../models/comment.model");
const Task = require("../models/task.model");

// Verify the requesting user belongs to the task's project
const verifyTaskAccess = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate("projectId");
  if (!task) return null;

  const project = task.projectId;
  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some((id) => id.toString() === userId.toString());

  return isOwner || isMember ? task : null;
};

// @desc    Get all comments for a task
// @route   GET /api/tasks/:id/comments
// @access  Private (Project Member)
exports.getComments = async (req, res, next) => {
  try {
    const task = await verifyTaskAccess(req.params.id, req.user._id);
    if (!task) {
      return res.status(403).json({ success: false, message: "Access denied or task not found." });
    }

    const comments = await Comment.find({ taskId: req.params.id })
      .populate("authorId", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private (Project Member)
exports.addComment = async (req, res, next) => {
  try {
    const { body } = req.body;

    const task = await verifyTaskAccess(req.params.id, req.user._id);
    if (!task) {
      return res.status(403).json({ success: false, message: "Access denied or task not found." });
    }

    const comment = await Comment.create({
      taskId: req.params.id,
      authorId: req.user._id,
      body: body.trim(),
    });

    await comment.populate("authorId", "name email");

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment (own only)
// @route   DELETE /api/tasks/:taskId/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found." });
    }

    if (comment.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own comments." });
    }

    await comment.deleteOne();
    res.status(200).json({ success: true, message: "Comment deleted." });
  } catch (error) {
    next(error);
  }
};

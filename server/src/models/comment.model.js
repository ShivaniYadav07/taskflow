const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: [true, "Comment body is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
  },
  { timestamps: true }
);

// Efficient retrieval of all comments for a task in chronological order
commentSchema.index({ taskId: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);

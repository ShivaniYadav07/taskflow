const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    key: {
      type: String,
      required: [true, "Project key is required"],
      trim: true,
      uppercase: true,
      minlength: [2, "Project key must be at least 2 characters"],
      maxlength: [10, "Project key cannot exceed 10 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Indexes for efficient querying of user projects
projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });
// Compound index to ensure project keys are unique per owner
projectSchema.index({ owner: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("Project", projectSchema);

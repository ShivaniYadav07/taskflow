const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const { protect } = require("../middleware/auth.middleware");
const { verifyProjectMember, verifyProjectOwner } = require("../middleware/projectAuth.middleware");

// Apply basic JWT authentication to all project routes
router.use(protect);

// Project Collection endpoints
router.route("/")
  .post(projectController.createProject) // Any authenticated user can create a project
  .get(projectController.getProjects);   // Get all projects the user owns or is a member of

// Single Project endpoints
router.route("/:id")
  .get(verifyProjectMember, projectController.getProjectById) // Members and Owner can view
  .put(verifyProjectOwner, projectController.updateProject)   // Only Owner can update details
  .delete(verifyProjectOwner, projectController.deleteProject); // Only Owner can delete

// Member Management endpoints
router.route("/:id/members")
  .post(verifyProjectOwner, projectController.addMember); // Only Owner can invite

router.route("/:id/members/:userId")
  .delete(verifyProjectOwner, projectController.removeMember); // Only Owner can kick

module.exports = router;

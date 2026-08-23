const express = require("express");
const router = express.Router();
const {
  createWorkflow,
  getAllWorkflows,
  getWorkflowById,
  updateWorkflow,
} = require("../controllers/workflowController");
const { protect, restrictTo } = require("../middlewares/auth");

router.use(protect);

router
  .route("/")
  .get(getAllWorkflows)
  .post(restrictTo("admin"), createWorkflow);

router
  .route("/:id")
  .get(getWorkflowById)
  .patch(restrictTo("admin"), updateWorkflow);

module.exports = router;

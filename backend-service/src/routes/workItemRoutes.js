const express = require("express");
const router = express.Router();
const {
  createWorkItem,
  getWorkItemById,
  updateWorkItem,
} = require("../controllers/workItemController");
const { protect } = require("../middlewares/auth");

router.use(protect);

router.route("/").post(createWorkItem);

router.route("/:id").get(getWorkItemById).patch(updateWorkItem);

module.exports = router;

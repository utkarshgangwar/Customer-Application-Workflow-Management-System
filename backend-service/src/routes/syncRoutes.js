const express = require("express");
const router = express.Router();
const {
  getApplicationSyncJobs,
  retrySyncJob,
} = require("../controllers/syncController");
const { protect, restrictTo } = require("../middlewares/auth");

router.use(protect);

router.get("/application/:applicationId", getApplicationSyncJobs);
router.post("/:id/retry", restrictTo("admin", "manager"), retrySyncJob);

module.exports = router;

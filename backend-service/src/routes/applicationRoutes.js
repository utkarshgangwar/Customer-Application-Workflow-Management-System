const express = require('express');
const router = express.Router();
const {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStage,
  updateApplicationStatus,
  assignApplication,
  getApplicationActivities,
  getApplicationWorkItems,
} = require('../controllers/applicationController');
const { protect, restrictTo } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getAllApplications)
  .post(createApplication);

router.route('/:id')
  .get(getApplicationById);

// Workflow Stage & Status Transitions
router.patch('/:id/stage', updateApplicationStage);
router.patch('/:id/status', updateApplicationStatus);
router.patch('/:id/assign', restrictTo('admin', 'manager'), assignApplication);

// Sub-resources
router.get('/:id/activities', getApplicationActivities);
router.get('/:id/work-items', getApplicationWorkItems);

module.exports = router;
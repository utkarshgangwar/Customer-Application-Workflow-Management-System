const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middlewares/auth");

router.use(protect);

router
  .route("/")
  .get(userController.getAllUsers)
  .post(restrictTo("admin"), userController.createUser);

router
  .route("/:id")
  .get(userController.getUserById)
  .patch(userController.updateUser);

module.exports = router;

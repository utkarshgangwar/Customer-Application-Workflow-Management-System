const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const customerRoutes = require("./customerRoutes");
const applicationRoutes = require("./applicationRoutes");
const workItemRoutes = require("./workItemRoutes");
const workflowRoutes = require("./workflowRoutes");
const documents = require("./documentRoutes");

// Mount Sub-routers
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/customers", customerRoutes);
router.use("/applications", applicationRoutes);
router.use("/work-items", workItemRoutes);
router.use("/workflows", workflowRoutes);
router.use("/documents", documents);

module.exports = router;

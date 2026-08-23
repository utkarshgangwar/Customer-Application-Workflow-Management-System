const express = require("express");
const router = express.Router();
const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerApplications,
} = require("../controllers/customerController");
const { protect } = require("../middlewares/auth");

router.use(protect);

router.route("/").get(getAllCustomers).post(createCustomer);

router.route("/:id").get(getCustomerById).patch(updateCustomer);

router.get("/:id/applications", getCustomerApplications);

module.exports = router;

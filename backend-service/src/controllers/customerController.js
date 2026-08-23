const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const {
  Customer,
  CustomerApplication,
  WorkItem,
  Document,
} = require("../models");

// 1. Create a New Customer
exports.createCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.create(req.body);
  res.status(201).json({ success: true, data: customer });
});

// 2. Get All Customers with multi-field search and pagination
exports.getAllCustomers = asyncHandler(async (req, res, next) => {
  const { search, page = 1, limit = 8 } = req.query;
  const filter = {};

  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { city: searchRegex },
      { "mobile.num": searchRegex },
    ];
  }

  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 8;
  const skip = (parsedPage - 1) * parsedLimit;

  const [customers, total] = await Promise.all([
    Customer.find(filter).skip(skip).limit(parsedLimit).sort({ createdAt: -1 }),
    Customer.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    results: customers.length,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit) || 1,
    },
    data: customers,
  });
});

// 3. Get Single Customer By ID
exports.getCustomerById = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return next(new AppError("Customer not found.", 404));
  res.status(200).json({ success: true, data: customer });
});

// 4. Update Customer Profile (Accessible by Executive, Manager, Admin)
exports.updateCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!customer) return next(new AppError("Customer not found.", 404));

  res.status(200).json({ success: true, data: customer });
});

// GET /api/v1/customers/:id/applications
exports.getCustomerApplications = asyncHandler(async (req, res, next) => {
  const customerId = req.params.id;

  // 1. Fetch all applications for this customer
  const applications = await CustomerApplication.find({ customerId })
    .populate("workflowId", "name code")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .lean();

  if (!applications || applications.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  // 2. Fetch and attach all work items (with populated Document attachments)
  const appIds = applications.map((app) => app._id);
  const workItems = await WorkItem.find({ applicationId: { $in: appIds } })
    .populate("attachmentId", "name fileUrl fileType status")
    .populate("assignedTo", "name email")
    .sort({ stageOrderNumber: 1, createdAt: 1 })
    .lean();

  // Group work items by applicationId
  const workItemMap = {};
  workItems.forEach((item) => {
    const appId = item.applicationId.toString();
    if (!workItemMap[appId]) workItemMap[appId] = [];
    workItemMap[appId].push(item);
  });

  // Attach work items to each application
  const applicationsWithWorkItems = applications.map((app) => ({
    ...app,
    workItems: workItemMap[app._id.toString()] || [],
  }));

  res.status(200).json({
    success: true,
    data: applicationsWithWorkItems,
  });
});

// 6. Get Comprehensive Customer Dossier (Profile + Applications + Document Archives)
exports.getCustomerDossier = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return next(new AppError("Customer not found.", 404));

  const [applications, documents] = await Promise.all([
    CustomerApplication.find({ customerId: customer._id })
      .populate("workflowId", "name")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 }),
    Document.find({ customerId: customer._id }).sort({ createdAt: -1 }),
  ]);

  const applicationsWithFiles = await Promise.all(
    applications.map(async (app) => {
      const workItems = await WorkItem.find({ applicationId: app._id })
        .populate("attachmentId", "name fileUrl fileType status")
        .sort({ stageOrderNumber: 1 });

      return {
        ...app.toObject(),
        workItems,
      };
    }),
  );

  res.status(200).json({
    success: true,
    data: {
      customer,
      applications: applicationsWithFiles,
      documents,
    },
  });
});

const request = require("supertest");
const app = require("../src/app");
const {
  CustomerApplication,
  Workflow,
  User,
  WorkItem,
} = require("../src/models");

describe("Application API Unit Stubs", () => {
  let adminToken, executiveToken;
  let mockWorkflowId, mockCustomerId, mockExecutiveId;

  beforeAll(() => {
    // Generate mock tokens or headers
    adminToken = "Bearer mock-admin-jwt";
    executiveToken = "Bearer mock-exec-jwt";
    mockWorkflowId = "6a8af5bc82ed776b42f58029";
    mockCustomerId = "6a8af5bc82ed776b42f58030";
    mockExecutiveId = "6a8af5bc82ed776b42f58035";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/v1/applications -> creates docket and provisions Stage 1 work items", async () => {
    jest.spyOn(Workflow, "findById").mockResolvedValue({
      _id: mockWorkflowId,
      teamId: "team-canada",
      stages: [
        {
          name: "NEW_REGISTRATION",
          orderNumber: 1,
          workRequired: [{ title: "Verify Score", workType: "CHECK" }],
        },
      ],
    });

    jest.spyOn(User, "findById").mockResolvedValue({
      _id: mockExecutiveId,
      teamId: "team-canada",
    });

    jest.spyOn(CustomerApplication, "create").mockResolvedValue({
      _id: "app-123",
      currentStage: "NEW_REGISTRATION",
      status: "ACTIVE",
    });

    jest.spyOn(WorkItem, "insertMany").mockResolvedValue([]);

    const res = await request(app)
      .post("/api/v1/applications")
      .set("Authorization", adminToken)
      .send({
        customerId: mockCustomerId,
        workflowId: mockWorkflowId,
        title: "Test Application",
        assignedTo: mockExecutiveId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("PATCH /api/v1/applications/:id/stage -> blocks transition if pending tasks exist", async () => {
    jest.spyOn(CustomerApplication, "findById").mockResolvedValue({
      _id: "app-123",
      currentStage: "NEW_REGISTRATION",
      status: "ACTIVE",
      version: 1,
    });

    jest.spyOn(Workflow, "findById").mockResolvedValue({
      stages: [
        {
          name: "NEW_REGISTRATION",
          allowedTransitions: ["DOCUMENTATION_STAGE"],
        },
      ],
    });

    // Mock pending tasks remaining
    jest
      .spyOn(WorkItem, "find")
      .mockResolvedValue([{ title: "Pending Task 1" }]);

    const res = await request(app)
      .patch("/api/v1/applications/app-123/stage")
      .set("Authorization", executiveToken)
      .send({
        newStage: "DOCUMENTATION_STAGE",
        version: 1,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Cannot advance stage/i);
  });
});

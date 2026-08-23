const request = require("supertest");
const app = require("../src/app");
const { User, Workflow } = require("../src/models");

describe("User & Scoping API Unit Stubs", () => {
  it("GET /api/v1/users?workflowId=... -> filters staff by workflow domain unit", async () => {
    jest.spyOn(Workflow, "findById").mockReturnValue({
      select: jest.fn().mockResolvedValue({ teamId: "team-canada" }),
    });

    jest.spyOn(User, "findWithWorkloadStats").mockResolvedValue({
      users: [
        { name: "Priyanka Verma", role: "manager", teamId: "team-canada" },
        { name: "Vikram Joshi", role: "executive", teamId: "team-canada" },
      ],
      total: 2,
      teams: [{ _id: "team-canada", name: "Canada PR Unit" }],
    });

    const res = await request(app)
      .get("/api/v1/users?workflowId=wf-123")
      .set("Authorization", "Bearer mock-exec-jwt");

    expect(res.statusCode).toBe(200);
    expect(res.body.data.users.length).toBe(2);
    expect(User.findWithWorkloadStats).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "team-canada",
        role: { $in: ["executive", "manager"] },
      }),
      0,
      50,
    );
  });
});

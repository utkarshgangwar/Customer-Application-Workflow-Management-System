const request = require("supertest");
const app = require("../src/app");
const { WorkItem } = require("../src/models");

describe("WorkItem API Unit Stubs", () => {
  it("PATCH /api/v1/work-items/:id -> attaches document and populates reference", async () => {
    const mockUpdatedItem = {
      _id: "task-1",
      title: "Upload Passport",
      status: "COMPLETED",
      attachmentId: {
        _id: "doc-1",
        name: "passport.pdf",
        fileUrl: "/uploads/passport.pdf",
      },
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(WorkItem, "findById").mockResolvedValue(mockUpdatedItem);

    const res = await request(app)
      .patch("/api/v1/work-items/task-1")
      .set("Authorization", "Bearer mock-exec-jwt")
      .send({
        attachmentId: "doc-1",
        status: "COMPLETED",
      });

    expect(res.statusCode).toBe(200);
    expect(mockUpdatedItem.attachmentId).toBe("doc-1");
    expect(mockUpdatedItem.status).toBe("COMPLETED");
  });
});

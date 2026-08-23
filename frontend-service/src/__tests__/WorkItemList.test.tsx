import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import WorkItemList from "../components/WorkItemList";

// Extract props directly from the component definition
type WorkItemListProps = React.ComponentProps<typeof WorkItemList>;
type WorkItemType = WorkItemListProps["workItems"][number];

const mockItems: WorkItemType[] = [
  {
    _id: "work_1",
    applicationId: "app_123",
    stageOrderNumber: 1,
    title: "Verify Passport Copy",
    status: "PENDING" as WorkItemType["status"],
    stageName: "Documentation",
    attachmentId: null,
  },
  {
    _id: "work_2",
    applicationId: "app_123",
    stageOrderNumber: 1,
    title: "Background Check",
    status: "COMPLETED" as WorkItemType["status"],
    stageName: "Documentation",
    attachmentId: {
      _id: "doc_123",
      name: "passport_scan.pdf",
      fileUrl: "https://example.com/passport_scan.pdf",
      fileType: "application/pdf",
      status: "verified",
    } as unknown as WorkItemType["attachmentId"],
  },
];

describe("WorkItemList Component", () => {
  it("renders checklist items and stages correctly", () => {
    // Pass strictly what WorkItemListProps requires
    const props = {
      workItems: mockItems,
    } as WorkItemListProps;

    render(<WorkItemList {...props} />);

    expect(screen.getByText("Verify Passport Copy")).toBeInTheDocument();
    expect(screen.getByText("Background Check")).toBeInTheDocument();
  });
});

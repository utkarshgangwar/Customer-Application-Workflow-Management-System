import { render, screen, fireEvent } from "@testing-library/react";
import WorkItemList from "@/components/WorkItemList";
import { WorkItem } from "@/types";

describe("WorkItemList Component", () => {
  const mockToggle = jest.fn();
  const mockRefresh = jest.fn();

  const mockItems: WorkItem[] = [
    {
      _id: "item-1",
      applicationId: "app-1",
      stageName: "STAGE_1",
      stageOrderNumber: 1,
      title: "Verify Passport Copy",
      status: "PENDING",
      attachmentId: null,
    },
    {
      _id: "item-2",
      applicationId: "app-1",
      stageName: "STAGE_1",
      stageOrderNumber: 1,
      title: "IELTS Scorecard",
      status: "COMPLETED",
      attachmentId: {
        _id: "doc-1",
        name: "ielts.pdf",
        fileUrl: "/uploads/ielts.pdf",
        fileType: "application/pdf",
        status: "ATTACHED",
      },
    },
  ];

  it("renders tasks and displays attachment link for completed items", () => {
    render(
      <WorkItemList
        workItems={mockItems}
        onToggle={mockToggle}
        onRefresh={mockRefresh}
      />,
    );

    expect(screen.getByText("Verify Passport Copy")).toBeInTheDocument();
    expect(screen.getByText("📎 ielts.pdf")).toBeInTheDocument();
    expect(screen.getByText("Attach File")).toBeInTheDocument();
  });

  it("calls onToggle when task checkbox is clicked", () => {
    render(
      <WorkItemList
        workItems={mockItems}
        onToggle={mockToggle}
        onRefresh={mockRefresh}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    expect(mockToggle).toHaveBeenCalledWith("item-1", "PENDING");
  });
});

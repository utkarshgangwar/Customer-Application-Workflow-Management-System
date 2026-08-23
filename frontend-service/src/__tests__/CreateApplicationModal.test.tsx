import { render, screen, fireEvent } from "@testing-library/react";
import CreateApplicationModal from "@/components/CreateApplicationModal";

// Mock fetch client to avoid network requests
jest.mock("@/lib/fetchClient", () => ({
  apiClient: jest.fn(() => Promise.resolve({ data: [] })),
}));

describe("CreateApplicationModal Component", () => {
  it("renders when open and blocks review if required title is empty", () => {
    const handleClose = jest.fn();
    const handleSuccess = jest.fn();

    render(
      <CreateApplicationModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />,
    );

    expect(screen.getByText("Create Application Docket")).toBeInTheDocument();

    const submitBtn = screen.getByText("Review & Lodge Docket →");
    fireEvent.click(submitBtn);

    // Verifies form stays open on invalid input
    expect(handleSuccess).not.toHaveBeenCalled();
  });
});

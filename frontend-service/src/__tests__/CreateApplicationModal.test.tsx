import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreateApplicationModal from "../components/CreateApplicationModal";
import { apiClient } from "@/lib/fetchClient";

// Mock apiClient as a callable function
jest.mock("@/lib/fetchClient", () => ({
  apiClient: jest.fn(),
}));

const mockWorkflows = [
  {
    _id: "wf_1",
    name: "Express Entry PR",
    teamId: { _id: "team_1", name: "Canada Unit" },
    stages: [
      { orderNumber: 1, name: "Documentation", allowedTransitions: ["Review"] },
      { orderNumber: 2, name: "Review", allowedTransitions: ["Completed"] },
    ],
  },
];

const mockCustomers = [
  {
    _id: "cust_1",
    name: "John Doe",
    email: "john@example.com",
    mobile: { code: "+1", num: 9876543210 },
  },
];

const mockUsers = [
  {
    _id: "user_1",
    name: "Sarah Jenkins",
    email: "sarah@example.com",
    role: "executive",
    teamId: "team_1",
  },
];

describe("CreateApplicationModal Component", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (apiClient as unknown as jest.Mock).mockImplementation(
      (endpoint: string, options?: RequestInit) => {
        if (options?.method === "POST") {
          return Promise.resolve({
            status: "success",
            data: { _id: "app_123" },
          });
        }
        if (endpoint.includes("/workflows")) {
          return Promise.resolve({ data: mockWorkflows });
        }
        if (endpoint.includes("/customers")) {
          return Promise.resolve({ data: mockCustomers });
        }
        if (endpoint.includes("/users")) {
          return Promise.resolve({ data: mockUsers });
        }
        return Promise.resolve({ data: [] });
      },
    );
  });

  it("renders modal and resolves initial data loads cleanly", async () => {
    render(
      <CreateApplicationModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Express Entry PR/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
  });

  it("submits application form through review and confirmation steps", async () => {
    render(
      <CreateApplicationModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Express Entry PR/i)).toBeInTheDocument();
    });

    // Step 1: Click Review & Lodge Docket to open confirmation screen
    const reviewBtn = screen.getByRole("button", {
      name: /Review & Lodge Docket/i,
    });
    fireEvent.click(reviewBtn);

    // Step 2: Await confirmation view and click final submission button
    await waitFor(() => {
      expect(
        screen.getByText("Confirm Application Docket"),
      ).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", {
      name: /Confirm & Lodge Docket/i,
    });
    fireEvent.click(confirmBtn);

    // Step 3: Verify success and modal close
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

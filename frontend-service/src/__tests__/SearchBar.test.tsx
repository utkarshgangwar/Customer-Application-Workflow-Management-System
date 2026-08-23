import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SearchBar from "@/components/SearchBar";

describe("SearchBar Component", () => {
  it("renders with placeholder and fires onChange callback when typing", async () => {
    const handleChange = jest.fn();

    render(
      <SearchBar
        value=""
        placeholder="Search applicants..."
        onChange={handleChange}
      />,
    );

    const input = screen.getByPlaceholderText("Search applicants...");
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Canada" } });

    // Handles both direct triggers and debounced updates
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith("Canada");
    });
  });

  it("renders with the provided initial value", () => {
    render(
      <SearchBar
        value="Express Entry"
        placeholder="Search applicants..."
        onChange={jest.fn()}
      />,
    );

    const input = screen.getByPlaceholderText(
      "Search applicants...",
    ) as HTMLInputElement;
    expect(input.value).toBe("Express Entry");
  });
});

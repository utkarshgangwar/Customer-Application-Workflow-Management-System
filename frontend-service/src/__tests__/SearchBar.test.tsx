import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "@/components/SearchBar";

describe("SearchBar Component", () => {
  it("fires onChange callback when typing query", () => {
    const handleChange = jest.fn();
    render(
      <SearchBar
        value=""
        placeholder="Search applicants..."
        onChange={handleChange}
      />,
    );

    const input = screen.getByPlaceholderText("Search applicants...");
    fireEvent.change(input, { target: { value: "Canada" } });

    expect(handleChange).toHaveBeenCalledWith("Canada");
  });
});

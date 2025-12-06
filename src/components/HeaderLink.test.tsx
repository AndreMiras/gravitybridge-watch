import { render, screen } from "@testing-library/react";
import HeaderLink from "./HeaderLink";

describe("HeaderLink", () => {
  it("renders link with correct href", () => {
    render(<HeaderLink url="https://example.com" text="Example" />);

    const link = screen.getByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("renders link with correct text", () => {
    render(<HeaderLink url="/test" text="Test Link" />);

    expect(screen.getByText("Test Link")).toBeInTheDocument();
  });

  it("applies styling classes", () => {
    render(<HeaderLink url="/styled" text="Styled" />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("text-violet-500");
  });

  it("renders internal links correctly", () => {
    render(<HeaderLink url="/metrics" text="/metrics" />);

    const link = screen.getByRole("link", { name: "/metrics" });
    expect(link).toHaveAttribute("href", "/metrics");
  });
});

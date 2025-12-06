import { render, screen } from "@testing-library/react";
import Header from "./Header";

// Mock next/link to render as a simple anchor
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("Header", () => {
  it("renders the main heading", () => {
    render(<Header />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Gravity Bridge Orchestrator Watcher",
    );
  });

  it("renders navigation links", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Grafana" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "/metrics" })).toBeInTheDocument();
  });

  it("renders link to GitHub repo", () => {
    render(<Header />);

    const aboutLink = screen.getByRole("link", { name: "About" });
    expect(aboutLink).toHaveAttribute(
      "href",
      "https://github.com/AndreMiras/gravitybridge-watch",
    );
  });

  it("renders link to Grafana", () => {
    render(<Header />);

    const grafanaLink = screen.getByRole("link", { name: "Grafana" });
    expect(grafanaLink).toHaveAttribute(
      "href",
      "https://grafana.gravitybridge.watch",
    );
  });

  it("renders API endpoint links", () => {
    render(<Header />);

    expect(
      screen.getByRole("link", { name: "/get-last-observed-eth-nonce" }),
    ).toHaveAttribute("href", "/api/get-last-observed-eth-nonce/");

    expect(
      screen.getByRole("link", { name: "/get-validator-info-map" }),
    ).toHaveAttribute("href", "/api/get-validator-info-map/");
  });

  it("has navigation element", () => {
    render(<Header />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MatchStatusBadge from "./MatchStatusBadge";

describe("MatchStatusBadge", () => {
  it("should render with correct text", () => {
    render(<MatchStatusBadge />);

    expect(screen.getByText("Matches Created")).toBeInTheDocument();
  });

  it("should have role status for accessibility", () => {
    render(<MatchStatusBadge />);

    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
  });

  it("should have descriptive aria-label", () => {
    render(<MatchStatusBadge />);

    const badge = screen.getByLabelText("Matches have been created for this draw");
    expect(badge).toBeInTheDocument();
  });

  it("should render CheckCircle2 icon", () => {
    const { container } = render(<MatchStatusBadge />);

    // The icon should be rendered (lucide icons render as SVG)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("should have appropriate styling classes", () => {
    const { container } = render(<MatchStatusBadge />);

    const badge = container.querySelector(".bg-green-100");
    expect(badge).toBeInTheDocument();
  });
});

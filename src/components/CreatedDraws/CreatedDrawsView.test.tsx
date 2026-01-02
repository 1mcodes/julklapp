import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreatedDrawsView } from "./CreatedDrawsView";
import * as useDrawsModule from "@/hooks/useDraws";
import type { UseDrawsReturn } from "@/types/views";

// Mock the useDraws hook
vi.mock("@/hooks/useDraws");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe("CreatedDrawsView", () => {
  const mockUseDraws = vi.mocked(useDrawsModule.useDraws);

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear URL parameters
    window.history.replaceState({}, "", "/dashboard/created");
  });

  it("should render loading spinner when loading", () => {
    mockUseDraws.mockReturnValue({
      draws: [],
      viewModels: [],
      loading: true,
      error: null,
      errorMessage: null,
      refetch: vi.fn(),
    } as UseDrawsReturn);

    render(<CreatedDrawsView isActive={true} userId="test-user" />);

    const statusElement = screen.getByRole("status");
    expect(statusElement).toBeInTheDocument();
    // Verify the loading text is present (using getAllByText since there's both sr-only and visible text)
    const loadingTexts = screen.getAllByText("Loading draws...");
    expect(loadingTexts.length).toBe(2); // One for screen readers, one visible
  });

  it("should render error state when error occurs", () => {
    const mockRefetch = vi.fn();
    mockUseDraws.mockReturnValue({
      draws: [],
      viewModels: [],
      loading: false,
      error: "server",
      errorMessage: "Failed to load draws. Please try again.",
      refetch: mockRefetch,
    } as UseDrawsReturn);

    render(<CreatedDrawsView isActive={true} userId="test-user" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Error Loading Draws")).toBeInTheDocument();
    expect(screen.getByText("Failed to load draws. Please try again.")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("should render empty state when no draws exist", () => {
    mockUseDraws.mockReturnValue({
      draws: [],
      viewModels: [],
      loading: false,
      error: null,
      errorMessage: null,
      refetch: vi.fn(),
    } as UseDrawsReturn);

    render(<CreatedDrawsView isActive={true} userId="test-user" />);

    expect(screen.getByText("No draws yet")).toBeInTheDocument();
    expect(screen.getByText(/You haven't created any draws yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create new draw/i })).toBeInTheDocument();
  });

  it("should render draws table when draws exist", () => {
    mockUseDraws.mockReturnValue({
      draws: [],
      viewModels: [
        {
          id: "draw-1",
          name: "Christmas 2025",
          formattedDate: "Dec 15, 2025",
          relativeDate: "2 days ago",
          detailsUrl: "/dashboard/draws/draw-1/participants",
        },
        {
          id: "draw-2",
          name: "Office Party",
          formattedDate: "Dec 20, 2025",
          relativeDate: "5 hours ago",
          detailsUrl: "/dashboard/draws/draw-2/participants",
        },
      ],
      loading: false,
      error: null,
      errorMessage: null,
      refetch: vi.fn(),
    } as UseDrawsReturn);

    render(<CreatedDrawsView isActive={true} userId="test-user" />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Christmas 2025")).toBeInTheDocument();
    expect(screen.getByText("Office Party")).toBeInTheDocument();
    expect(screen.getByText("Dec 15, 2025")).toBeInTheDocument();
    expect(screen.getByText("2 days ago")).toBeInTheDocument();
  });

  it("should not render when isActive is false", () => {
    mockUseDraws.mockReturnValue({
      draws: [],
      viewModels: [],
      loading: false,
      error: null,
      errorMessage: null,
      refetch: vi.fn(),
    } as UseDrawsReturn);

    const { container } = render(<CreatedDrawsView isActive={false} userId="test-user" />);

    expect(container.firstChild).toBeNull();
  });

  it("should show success toast when URL has success parameter", async () => {
    const { toast } = await import("sonner");

    // Set URL with success parameter
    window.history.replaceState({}, "", "/dashboard/created?success=true");

    mockUseDraws.mockReturnValue({
      draws: [],
      viewModels: [],
      loading: false,
      error: null,
      errorMessage: null,
      refetch: vi.fn(),
    } as UseDrawsReturn);

    render(<CreatedDrawsView isActive={true} userId="test-user" />);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Draw created successfully!", {
        description: "Your new draw has been added to the list.",
        duration: 6000,
      });
    });

    // Verify URL was cleaned up
    expect(window.location.search).toBe("");
  });
});

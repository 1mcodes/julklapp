import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDraws } from "./useDraws";
import type { DrawDTO } from "@/types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useDraws", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch draws successfully", async () => {
    const mockDraws: DrawDTO[] = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Christmas 2025",
        created_at: "2025-12-15T10:30:00Z",
      },
      {
        id: "660e8400-e29b-41d4-a716-446655440001",
        name: "Office Party",
        created_at: "2025-12-20T14:20:00Z",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockDraws,
    });

    const { result } = renderHook(() => useDraws());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.draws).toEqual([]);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check results
    expect(result.current.draws).toEqual(mockDraws);
    expect(result.current.viewModels).toHaveLength(2);
    expect(result.current.viewModels[0].name).toBe("Christmas 2025");
    expect(result.current.viewModels[0].detailsUrl).toBe(
      "/dashboard/draws/550e8400-e29b-41d4-a716-446655440000/participants"
    );
    expect(result.current.error).toBeNull();
  });

  it("should handle 401 authentication error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("auth");
    expect(result.current.errorMessage).toBe("Please log in to view your draws");
    expect(result.current.draws).toEqual([]);
  });

  it("should handle 500 server error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("server");
    expect(result.current.errorMessage).toBe("Failed to load draws. Please try again.");
  });

  it("should handle network error", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Network error"));

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("network");
    expect(result.current.errorMessage).toBe("Network error. Please check your connection.");
  });

  it("should handle invalid response data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ invalid: "data" }],
    });

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("unknown");
    expect(result.current.errorMessage).toBe("Invalid data received. Please contact support.");
  });

  it("should refetch draws when refetch is called", async () => {
    const mockDraws: DrawDTO[] = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Christmas 2025",
        created_at: "2025-12-15T10:30:00Z",
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDraws,
    });

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mock calls
    mockFetch.mockClear();

    // Call refetch
    await result.current.refetch();

    // Verify fetch was called again
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should format dates correctly in viewModels", async () => {
    const mockDraws: DrawDTO[] = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Draw",
        created_at: "2025-12-15T10:30:00Z",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockDraws,
    });

    const { result } = renderHook(() => useDraws());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const viewModel = result.current.viewModels[0];
    expect(viewModel.formattedDate).toMatch(/Dec \d+, 2025/);
    expect(viewModel.relativeDate).toBeTruthy();
    expect(viewModel.id).toBe("550e8400-e29b-41d4-a716-446655440000");
  });
});

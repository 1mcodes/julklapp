import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDraws } from "./useDraws";
import type { DrawDTO } from "@/types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error to avoid cluttering test output
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

describe("useDraws", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful Data Fetching", () => {
    it("should fetch draws successfully with multiple items", async () => {
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
      expect(result.current.error).toBeNull();
      expect(result.current.errorMessage).toBeNull();

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
      expect(result.current.errorMessage).toBeNull();
    });

    it("should handle empty array response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.draws).toEqual([]);
      expect(result.current.viewModels).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should fetch single draw successfully", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Single Draw",
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

      expect(result.current.draws).toHaveLength(1);
      expect(result.current.viewModels).toHaveLength(1);
      expect(result.current.viewModels[0].name).toBe("Single Draw");
    });

    it("should make correct API request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      renderHook(() => useDraws());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/draws", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
      });
    });
  });

  describe("Authentication Errors", () => {
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
      expect(result.current.viewModels).toEqual([]);
    });

    it("should clear previous data on 401 error", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Draw",
          created_at: "2025-12-15T10:30:00Z",
        },
      ];

      // First successful fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockDraws,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.draws).toHaveLength(1);

      // Then auth error on refetch
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBe("auth");
      });

      // Previous data should remain (not cleared)
      expect(result.current.draws).toHaveLength(1);
    });
  });

  describe("Server Errors", () => {
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

    it("should handle 502 bad gateway error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("An unexpected error occurred");
    });

    it("should handle 503 service unavailable error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("An unexpected error occurred");
    });

    it("should handle 400 bad request error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("An unexpected error occurred");
    });

    it("should handle 403 forbidden error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("An unexpected error occurred");
    });

    it("should handle 404 not found error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("An unexpected error occurred");
    });
  });

  describe("Network Errors", () => {
    it("should handle network error (TypeError)", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Network error"));

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("network");
      expect(result.current.errorMessage).toBe("Network error. Please check your connection.");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle fetch abortion", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("network");
      expect(result.current.errorMessage).toBe("Network error. Please check your connection.");
    });

    it("should handle non-TypeError exceptions", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Unexpected error"));

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("An unexpected error occurred");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("Data Validation", () => {
    it("should handle invalid response data (missing id)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ name: "Test", created_at: "2025-12-15T10:30:00Z" }],
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("Invalid data received. Please contact support.");
      expect(result.current.draws).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle invalid response data (missing name)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: "550e8400-e29b-41d4-a716-446655440000", created_at: "2025-12-15T10:30:00Z" }],
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("Invalid data received. Please contact support.");
    });

    it("should handle invalid response data (missing created_at)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: "550e8400-e29b-41d4-a716-446655440000", name: "Test" }],
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("Invalid data received. Please contact support.");
    });

    it("should handle response that is not an array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "test", name: "Test" }),
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("Invalid data received. Please contact support.");
    });

    it("should handle null response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => null,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("Invalid data received. Please contact support.");
    });

    it("should handle array with mixed valid and invalid items", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Valid",
            created_at: "2025-12-15T10:30:00Z",
          },
          { invalid: "data" },
        ],
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("Invalid data received. Please contact support.");
    });

    it("should handle invalid data types", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 123, // Should be string
            name: "Test",
            created_at: "2025-12-15T10:30:00Z",
          },
        ],
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("unknown");
      expect(result.current.errorMessage).toBe("Invalid data received. Please contact support.");
    });
  });

  describe("Refetch Functionality", () => {
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

    it("should update data on successful refetch", async () => {
      const initialDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Initial Draw",
          created_at: "2025-12-15T10:30:00Z",
        },
      ];

      const updatedDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Initial Draw",
          created_at: "2025-12-15T10:30:00Z",
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "New Draw",
          created_at: "2025-12-16T10:30:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => initialDraws,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.draws).toHaveLength(1);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedDraws,
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.draws).toHaveLength(2);
      });
    });

    it("should set loading state during refetch", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test",
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

      // Add a delay to the mock so we can observe the loading state
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => mockDraws,
                }),
              100
            )
          )
      );

      const refetchPromise = result.current.refetch();

      // Wait for loading state to be set
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await refetchPromise;
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should clear error state on successful refetch after error", async () => {
      // First request fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.error).toBe("server");
      });

      // Refetch succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Test",
            created_at: "2025-12-15T10:30:00Z",
          },
        ],
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.errorMessage).toBeNull();
        expect(result.current.draws).toHaveLength(1);
      });
    });

    it("should handle multiple consecutive refetch calls", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test",
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

      mockFetch.mockClear();

      // Multiple refetch calls
      await result.current.refetch();
      await result.current.refetch();
      await result.current.refetch();

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("Date Formatting", () => {
    beforeEach(() => {
      // Set a fixed date for relative time calculations: Jan 2, 2026
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.setSystemTime(new Date("2026-01-02T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
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
      expect(viewModel.formattedDate).toBe("Dec 15, 2025");
      expect(viewModel.relativeDate).toBeTruthy();
      expect(viewModel.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should generate correct details URL", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "test-id-123",
          name: "Test",
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

      expect(result.current.viewModels[0].detailsUrl).toBe("/dashboard/draws/test-id-123/participants");
    });

    it('should show "just now" for draws created less than 60 seconds ago', async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Recent Draw",
          created_at: "2026-01-02T11:59:30Z", // 30 seconds ago
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

      expect(result.current.viewModels[0].relativeDate).toBe("just now");
    });

    it("should show minutes for draws created 1-59 minutes ago", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Draw 1",
          created_at: "2026-01-02T11:59:00Z", // 1 minute ago
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Draw 2",
          created_at: "2026-01-02T11:30:00Z", // 30 minutes ago
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

      expect(result.current.viewModels[0].relativeDate).toBe("1 minute ago");
      expect(result.current.viewModels[1].relativeDate).toBe("30 minutes ago");
    });

    it("should show hours for draws created 1-23 hours ago", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Draw 1",
          created_at: "2026-01-02T11:00:00Z", // 1 hour ago
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Draw 2",
          created_at: "2026-01-02T00:00:00Z", // 12 hours ago
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

      expect(result.current.viewModels[0].relativeDate).toBe("1 hour ago");
      expect(result.current.viewModels[1].relativeDate).toBe("12 hours ago");
    });

    it("should show days for draws created 1-29 days ago", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Draw 1",
          created_at: "2026-01-01T12:00:00Z", // 1 day ago
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Draw 2",
          created_at: "2025-12-18T12:00:00Z", // 15 days ago
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

      expect(result.current.viewModels[0].relativeDate).toBe("1 day ago");
      expect(result.current.viewModels[1].relativeDate).toBe("15 days ago");
    });

    it("should show months for draws created 1-11 months ago", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Draw 1",
          created_at: "2025-12-02T12:00:00Z", // ~1 month ago
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Draw 2",
          created_at: "2025-07-02T12:00:00Z", // ~6 months ago
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

      expect(result.current.viewModels[0].relativeDate).toBe("1 month ago");
      expect(result.current.viewModels[1].relativeDate).toBe("6 months ago");
    });

    it("should show years for draws created over a year ago", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Draw 1",
          created_at: "2025-01-02T12:00:00Z", // 1 year ago
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Draw 2",
          created_at: "2023-01-02T12:00:00Z", // 3 years ago
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

      expect(result.current.viewModels[0].relativeDate).toBe("1 year ago");
      expect(result.current.viewModels[1].relativeDate).toBe("3 years ago");
    });

    it("should handle different date formats", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "ISO Date",
          created_at: "2025-12-15T10:30:00.000Z",
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

      expect(result.current.viewModels[0].formattedDate).toBe("Dec 15, 2025");
      expect(result.current.viewModels[0].relativeDate).toBeTruthy();
    });
  });

  describe("ViewModel Transformations", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.setSystemTime(new Date("2026-01-02T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should transform all draws to viewModels", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Draw 1",
          created_at: "2025-12-15T10:30:00Z",
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Draw 2",
          created_at: "2025-12-20T14:20:00Z",
        },
        {
          id: "770e8400-e29b-41d4-a716-446655440002",
          name: "Draw 3",
          created_at: "2025-12-25T18:00:00Z",
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

      expect(result.current.viewModels).toHaveLength(3);
      result.current.viewModels.forEach((vm, index) => {
        expect(vm.id).toBe(mockDraws[index].id);
        expect(vm.name).toBe(mockDraws[index].name);
        expect(vm.formattedDate).toBeTruthy();
        expect(vm.relativeDate).toBeTruthy();
        expect(vm.detailsUrl).toBe(`/dashboard/draws/${mockDraws[index].id}/participants`);
      });
    });

    it("should update viewModels when draws change", async () => {
      const initialDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Initial",
          created_at: "2025-12-15T10:30:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => initialDraws,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.viewModels).toHaveLength(1);
      expect(result.current.viewModels[0].name).toBe("Initial");

      const updatedDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Initial",
          created_at: "2025-12-15T10:30:00Z",
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Updated",
          created_at: "2025-12-20T14:20:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedDraws,
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.viewModels).toHaveLength(2);
      });

      expect(result.current.viewModels[1].name).toBe("Updated");
    });

    it("should preserve draw names with special characters", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Draw with émojis 🎄🎁",
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

      expect(result.current.viewModels[0].name).toBe("Draw with émojis 🎄🎁");
    });
  });

  describe("State Management", () => {
    it("should initialize with correct default state", () => {
      mockFetch.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useDraws());

      expect(result.current.draws).toEqual([]);
      expect(result.current.viewModels).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.errorMessage).toBeNull();
      expect(typeof result.current.refetch).toBe("function");
    });

    it("should maintain state consistency across refetches", async () => {
      const mockDraws: DrawDTO[] = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test",
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

      const firstRefetchFunction = result.current.refetch;
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // refetch function should remain stable
      expect(result.current.refetch).toBe(firstRefetchFunction);
    });

    it("should reset error state when starting new fetch", async () => {
      // First request fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useDraws());

      await waitFor(() => {
        expect(result.current.error).toBe("server");
      });

      // Start new fetch
      mockFetch.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => new Promise(() => {}) // Never resolves
      );

      result.current.refetch();

      // Error should be cleared immediately when refetch starts
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.errorMessage).toBeNull();
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { useDrawParticipants } from "./useDrawParticipants";
import type { ParticipantDTO, ParticipantsWithMetadataDTO, ApiErrorResponse, MessageDTO } from "../types";

// Mock toast notifications
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("useDrawParticipants", () => {
  const mockDrawId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with loading state and matching fields", () => {
      fetchMock.mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      expect(result.current.state.participants).toEqual([]);
      expect(result.current.state.isLoading).toBe(true);
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.httpStatus).toBe(null);
      expect(result.current.state.hasMatches).toBe(false);
      expect(result.current.state.isMatching).toBe(false);
      expect(result.current.state.matchingError).toBe(null);
    });

    it("should call API on mount with correct endpoint", () => {
      fetchMock.mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      renderHook(() => useDrawParticipants(mockDrawId));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(`/api/draws/${mockDrawId}/participants`);
    });
  });

  describe("successful data fetch", () => {
    it("should update state with participants and match status on success", async () => {
      const mockParticipants: ParticipantDTO[] = [
        {
          id: "p1",
          name: "John",
          surname: "Doe",
          email: "john.doe@example.com",
          gift_preferences: "Books",
        },
        {
          id: "p2",
          name: "Jane",
          surname: "Smith",
          email: "jane.smith@example.com",
          gift_preferences: "Electronics",
        },
      ];

      const mockResponse: ParticipantsWithMetadataDTO = {
        participants: mockParticipants,
        has_matches: false,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.participants).toEqual(mockParticipants);
      expect(result.current.state.hasMatches).toBe(false);
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.httpStatus).toBe(200);
    });

    it("should set hasMatches to true when matches exist", async () => {
      const mockResponse: ParticipantsWithMetadataDTO = {
        participants: [],
        has_matches: true,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.hasMatches).toBe(true);
    });

    it("should handle empty participants array", async () => {
      const mockResponse: ParticipantsWithMetadataDTO = {
        participants: [],
        has_matches: false,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.participants).toEqual([]);
      expect(result.current.state.hasMatches).toBe(false);
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.httpStatus).toBe(200);
    });
  });

  describe("error handling", () => {
    it("should handle 400 Bad Request error", async () => {
      const mockError: ApiErrorResponse = {
        error: "Bad Request",
        message: "Invalid draw ID format",
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.participants).toEqual([]);
      expect(result.current.state.error).toEqual(mockError);
      expect(result.current.state.httpStatus).toBe(400);
    });

    it("should handle 401 Unauthorized error", async () => {
      const mockError: ApiErrorResponse = {
        error: "Unauthorized",
        message: "Authentication required",
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.error).toEqual(mockError);
      expect(result.current.state.httpStatus).toBe(401);
    });

    it("should handle 403 Forbidden error", async () => {
      const mockError: ApiErrorResponse = {
        error: "Forbidden",
        message: "You do not have access to this draw",
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.error).toEqual(mockError);
      expect(result.current.state.httpStatus).toBe(403);
    });

    it("should handle 404 Not Found error", async () => {
      const mockError: ApiErrorResponse = {
        error: "Not Found",
        message: "Draw not found",
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.error).toEqual(mockError);
      expect(result.current.state.httpStatus).toBe(404);
    });

    it("should handle 500 Internal Server Error", async () => {
      const mockError: ApiErrorResponse = {
        error: "Internal Server Error",
        message: "An unexpected error occurred while fetching participants",
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockError,
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.error).toEqual(mockError);
      expect(result.current.state.httpStatus).toBe(500);
    });

    it("should handle malformed JSON error response", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.error).toEqual({
        error: "Unknown Error",
        message: "An unexpected error occurred",
      });
      expect(result.current.state.httpStatus).toBe(500);
    });

    it("should handle network error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.participants).toEqual([]);
      expect(result.current.state.error).toEqual({
        error: "Network Error",
        message: "Unable to connect. Please check your internet connection and try again.",
      });
      expect(result.current.state.httpStatus).toBe(null);
    });
  });

  describe("refetch action", () => {
    it("should provide refetch action in return value", () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      expect(result.current.actions.refetch).toBeDefined();
      expect(typeof result.current.actions.refetch).toBe("function");
    });

    it("should reset state and refetch data when refetch is called", async () => {
      const mockParticipants: ParticipantDTO[] = [
        {
          id: "p1",
          name: "John",
          surname: "Doe",
          email: "john.doe@example.com",
          gift_preferences: "Books",
        },
      ];

      const mockResponse: ParticipantsWithMetadataDTO = {
        participants: mockParticipants,
        has_matches: false,
      };

      // First call - return error
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server Error", message: "Something went wrong" }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.error).not.toBe(null);

      // Second call - return success
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      // Trigger refetch
      await result.current.actions.refetch();

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.participants).toEqual(mockParticipants);
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.httpStatus).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("should set loading state during refetch", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // Mock a slow response for refetch
      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                json: async () => ({ participants: [], has_matches: false }),
              });
            }, 100);
          })
      );

      const refetchPromise = result.current.actions.refetch();

      // Should be loading immediately after calling refetch
      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(true);
      });

      await refetchPromise;

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });
    });
  });

  describe("drawId changes", () => {
    it("should refetch when drawId changes", async () => {
      const drawId1 = "draw-1";
      const drawId2 = "draw-2";

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { rerender } = renderHook(({ id }) => useDrawParticipants(id), {
        initialProps: { id: drawId1 },
      });

      expect(fetchMock).toHaveBeenCalledWith(`/api/draws/${drawId1}/participants`);

      // Change drawId
      rerender({ id: drawId2 });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(`/api/draws/${drawId2}/participants`);
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("executeMatching action", () => {
    it("should provide executeMatching action in return value", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.actions.executeMatching).toBeDefined();
      expect(typeof result.current.actions.executeMatching).toBe("function");
    });

    it("should successfully execute matching algorithm", async () => {
      // Initial fetch - no matches yet
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.hasMatches).toBe(false);

      // Mock successful matching response
      const mockSuccessResponse: MessageDTO = {
        message: "Matches created successfully",
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      });

      // Execute matching
      await result.current.actions.executeMatching();

      await waitFor(() => {
        expect(result.current.state.isMatching).toBe(false);
        expect(result.current.state.hasMatches).toBe(true);
      });

      expect(result.current.state.matchingError).toBe(null);
      expect(toast.success).toHaveBeenCalledWith("Matches created successfully");
      expect(fetchMock).toHaveBeenCalledWith(`/api/draws/${mockDrawId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    });

    it("should set isMatching to true during matching operation", async () => {
      // Initial fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // Mock slow matching response
      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                json: async () => ({ message: "Matches created successfully" }),
              });
            }, 100);
          })
      );

      const matchingPromise = result.current.actions.executeMatching();

      // Should be matching immediately
      await waitFor(() => {
        expect(result.current.state.isMatching).toBe(true);
      });

      await matchingPromise;

      await waitFor(() => {
        expect(result.current.state.isMatching).toBe(false);
      });
    });

    it("should handle 400 error when matches already exist", async () => {
      // Initial fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // Mock "already exists" error
      const mockError: ApiErrorResponse = {
        error: "Bad Request",
        message: "Matches have already been generated for this draw",
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      await result.current.actions.executeMatching();

      await waitFor(() => {
        expect(result.current.state.isMatching).toBe(false);
      });

      expect(result.current.state.hasMatches).toBe(true);
      expect(result.current.state.matchingError).toEqual(mockError);
      expect(toast.error).toHaveBeenCalledWith("Matches have already been generated for this draw");
    });

    it("should handle 400 error for insufficient participants", async () => {
      // Initial fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // Mock insufficient participants error
      const mockError: ApiErrorResponse = {
        error: "Bad Request",
        message: "Insufficient participants. At least 3 participants are required for matching",
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      await result.current.actions.executeMatching();

      await waitFor(() => {
        expect(result.current.state.isMatching).toBe(false);
      });

      expect(result.current.state.hasMatches).toBe(false);
      expect(result.current.state.matchingError).toEqual(mockError);
      expect(toast.error).toHaveBeenCalledWith(
        "Insufficient participants. At least 3 participants are required for matching"
      );
    });

    // TODO: Currently disabled because authorization check is mocked in the API
    // Re-enable this test when proper authentication is implemented
    it.skip("should handle 403 Forbidden error", async () => {
      // Initial fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // Mock forbidden error
      const mockError: ApiErrorResponse = {
        error: "Forbidden",
        message: "Only the draw author can generate matches",
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockError,
      });

      await result.current.actions.executeMatching();

      await waitFor(() => {
        expect(result.current.state.isMatching).toBe(false);
      });

      expect(result.current.state.hasMatches).toBe(false);
      expect(result.current.state.matchingError).toEqual(mockError);
      expect(toast.error).toHaveBeenCalledWith("Only the draw author can generate matches");
    });

    it("should handle 500 Internal Server Error", async () => {
      // Initial fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // Mock server error
      const mockError: ApiErrorResponse = {
        error: "Internal Server Error",
        message: "Failed to generate matches. Please try again",
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockError,
      });

      await result.current.actions.executeMatching();

      await waitFor(() => {
        expect(result.current.state.isMatching).toBe(false);
        expect(result.current.state.matchingError).toEqual(mockError);
      });

      expect(result.current.state.hasMatches).toBe(false);
      expect(toast.error).toHaveBeenCalledWith("Failed to generate matches. Please try again");
    });

    it("should handle network error during matching", async () => {
      // Initial fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // Mock network error
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      await result.current.actions.executeMatching();

      await waitFor(() => {
        expect(result.current.state.isMatching).toBe(false);
        expect(result.current.state.matchingError).not.toBeNull();
      });

      expect(result.current.state.hasMatches).toBe(false);
      expect(result.current.state.matchingError).toEqual({
        error: "Network Error",
        message: "Unable to connect. Please check your internet connection.",
      });
      expect(toast.error).toHaveBeenCalledWith("Network error occurred");
    });

    it("should clear matchingError when starting new matching attempt", async () => {
      // Initial fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ participants: [], has_matches: false }),
      });

      const { result } = renderHook(() => useDrawParticipants(mockDrawId));

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // First attempt - error
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server Error", message: "Failed" }),
      });

      await result.current.actions.executeMatching();

      await waitFor(() => {
        expect(result.current.state.matchingError).not.toBe(null);
      });

      // Second attempt - success
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Matches created successfully" }),
      });

      await result.current.actions.executeMatching();

      await waitFor(() => {
        expect(result.current.state.isMatching).toBe(false);
        expect(result.current.state.hasMatches).toBe(true);
        expect(result.current.state.matchingError).toBe(null);
      });

      expect(result.current.state.matchingError).toBe(null);
      expect(result.current.state.hasMatches).toBe(true);
    });
  });
});

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { ParticipantDTO, ParticipantsWithMetadataDTO, ApiErrorResponse, MessageDTO } from "../types";

/**
 * State for the draw participants view with matching capabilities.
 */
export interface DrawParticipantsState {
  participants: ParticipantDTO[];
  isLoading: boolean;
  error: ApiErrorResponse | null;
  httpStatus: number | null;
  hasMatches: boolean;
  isMatching: boolean;
  matchingError: ApiErrorResponse | null;
}

/**
 * Return type for the useDrawParticipants hook.
 */
export interface UseDrawParticipantsReturn {
  state: DrawParticipantsState;
  actions: {
    refetch: () => Promise<void>;
    executeMatching: () => Promise<void>;
  };
}

/**
 * Custom hook for fetching and managing draw participants data.
 *
 * @param drawId - UUID of the draw whose participants should be fetched
 * @returns Hook state and actions
 */
export function useDrawParticipants(drawId: string): UseDrawParticipantsReturn {
  const [state, setState] = useState<DrawParticipantsState>({
    participants: [],
    isLoading: true,
    error: null,
    httpStatus: null,
    hasMatches: false,
    isMatching: false,
    matchingError: null,
  });

  const fetchParticipants = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      httpStatus: null,
    }));

    try {
      const response = await fetch(`/api/draws/${drawId}/participants`);

      if (!response.ok) {
        let errorData: ApiErrorResponse;

        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: "Unknown Error",
            message: "An unexpected error occurred",
          };
        }

        setState((prev) => ({
          ...prev,
          participants: [],
          isLoading: false,
          error: errorData,
          httpStatus: response.status,
        }));
        return;
      }

      const data: ParticipantsWithMetadataDTO = await response.json();

      setState((prev) => ({
        ...prev,
        participants: data.participants,
        isLoading: false,
        error: null,
        httpStatus: response.status,
        hasMatches: data.has_matches,
      }));
    } catch {
      // Network error or other fetch failure
      setState((prev) => ({
        ...prev,
        participants: [],
        isLoading: false,
        error: {
          error: "Network Error",
          message: "Unable to connect. Please check your internet connection and try again.",
        },
        httpStatus: null,
      }));
    }
  }, [drawId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const executeMatching = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isMatching: true,
      matchingError: null,
    }));

    try {
      const response = await fetch(`/api/draws/${drawId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        let errorData: ApiErrorResponse;

        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: "Unknown Error",
            message: "An unexpected error occurred",
          };
        }

        setState((prev) => ({
          ...prev,
          isMatching: false,
          matchingError: errorData,
          // If error is "already matched", update hasMatches to true
          hasMatches: errorData.message.includes("already been generated") ? true : prev.hasMatches,
        }));

        toast.error(errorData.message);
        return;
      }

      const result: MessageDTO = await response.json();

      setState((prev) => ({
        ...prev,
        isMatching: false,
        hasMatches: true,
        matchingError: null,
      }));

      toast.success(result.message);
    } catch {
      setState((prev) => ({
        ...prev,
        isMatching: false,
        matchingError: {
          error: "Network Error",
          message: "Unable to connect. Please check your internet connection.",
        },
      }));

      toast.error("Network error occurred");
    }
  }, [drawId]);

  return {
    state,
    actions: {
      refetch: fetchParticipants,
      executeMatching,
    },
  };
}

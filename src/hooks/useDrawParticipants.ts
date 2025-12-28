import { useState, useEffect, useCallback } from "react";
import type { ParticipantDTO, ApiErrorResponse } from "../types";

/**
 * State for the draw participants view.
 */
export interface DrawParticipantsState {
  participants: ParticipantDTO[];
  isLoading: boolean;
  error: ApiErrorResponse | null;
  httpStatus: number | null;
}

/**
 * Return type for the useDrawParticipants hook.
 */
export interface UseDrawParticipantsReturn {
  state: DrawParticipantsState;
  actions: {
    refetch: () => Promise<void>;
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

        setState({
          participants: [],
          isLoading: false,
          error: errorData,
          httpStatus: response.status,
        });
        return;
      }

      const participants: ParticipantDTO[] = await response.json();

      setState({
        participants,
        isLoading: false,
        error: null,
        httpStatus: response.status,
      });
    } catch (error) {
      // Network error or other fetch failure
      setState({
        participants: [],
        isLoading: false,
        error: {
          error: "Network Error",
          message: "Unable to connect. Please check your internet connection and try again.",
        },
        httpStatus: null,
      });
    }
  }, [drawId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  return {
    state,
    actions: {
      refetch: fetchParticipants,
    },
  };
}

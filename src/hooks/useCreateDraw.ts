import { useState, useCallback } from "react";
import type { CreateDrawInput } from "../lib/schemas/draw.schema";
import type { DrawDTO } from "../types";

export interface UseCreateDrawReturn {
  createDraw: (data: CreateDrawInput) => Promise<DrawDTO>;
  loading: boolean;
  error: string | null;
  resetError: () => void;
}

/**
 * Custom hook for managing draw creation API calls
 * Handles the API call, error states, and response validation
 */
export function useCreateDraw(): UseCreateDrawReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates if the response matches the DrawDTO structure
   */
  const isValidDrawDTO = (obj: unknown): obj is DrawDTO => {
    return (
      typeof obj === "object" &&
      obj !== null &&
      typeof obj.id === "string" &&
      typeof obj.name === "string" &&
      typeof obj.created_at === "string"
    );
  };

  /**
   * Resets the error state
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Creates a new draw via API
   */
  const createDraw = useCallback(
    async (data: CreateDrawInput): Promise<DrawDTO> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/draws", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        // Handle authentication error
        if (response.status === 401) {
          setError("Authentication required. Please log in.");
          throw new Error("Authentication required");
        }

        // Handle validation errors (400)
        if (response.status === 400) {
          const errorData = await response.json();
          const errorMessage = errorData.message || "Validation failed";
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        // Handle server errors (500)
        if (response.status === 500) {
          setError("Server error. Please try again.");
          throw new Error("Server error");
        }

        // Handle other non-OK responses
        if (!response.ok) {
          setError("An unexpected error occurred");
          throw new Error("Unexpected error");
        }

        // Parse and validate response
        const result = await response.json();

        // Validate response structure
        if (!isValidDrawDTO(result)) {
          console.error("Invalid API response:", result);
          setError("Invalid response received. Please contact support.");
          throw new Error("Invalid response structure");
        }

        // Successfully created draw
        return result;
      } catch (err) {
        // Handle network errors
        if (err instanceof TypeError && err.message.includes("fetch")) {
          setError("Network error. Please check your connection.");
        } else if (!error) {
          // Only set generic error if not already set by specific error handlers
          setError("An unexpected error occurred");
        }

        console.error("Error creating draw:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [error]
  );

  return {
    createDraw,
    loading,
    error,
    resetError,
  };
}

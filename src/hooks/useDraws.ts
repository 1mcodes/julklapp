import { useState, useEffect, useMemo, useCallback } from "react";
import type { DrawDTO } from "@/types";
import type { UseDrawsReturn, ErrorType, DrawRowViewModel } from "@/types/views";

/**
 * Transforms a DrawDTO to a DrawRowViewModel with formatted dates
 * @param draw - The draw data from the API
 * @returns Processed draw data with formatted dates and pre-computed URL
 */
function transformDrawToViewModel(draw: DrawDTO): DrawRowViewModel {
  const createdDate = new Date(draw.created_at);

  // Format absolute date (e.g., "Dec 29, 2025")
  const formattedDate = createdDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Calculate relative date (e.g., "2 days ago")
  const relativeDate = getRelativeTimeString(createdDate);

  // Pre-compute URL for navigation
  const detailsUrl = `/dashboard/draws/${draw.id}/participants`;

  return {
    id: draw.id,
    name: draw.name,
    formattedDate,
    relativeDate,
    detailsUrl,
  };
}

/**
 * Generates a human-readable relative time string
 * @param date - The date to format
 * @returns A relative time string (e.g., "2 days ago", "just now")
 */
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return "just now";
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  }
  return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
}

/**
 * Validates if the response matches the DrawDTO[] structure
 * @param obj - The object to validate
 * @returns True if the object is a valid DrawDTO
 */
function isValidDrawDTO(obj: any): obj is DrawDTO {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.created_at === "string"
  );
}

/**
 * Custom hook for managing draws data fetching and state
 * Handles API calls, error states, and data transformation for the Created Draws view
 * @returns Object containing draws data, loading state, error state, and refetch function
 */
export function useDraws(): UseDrawsReturn {
  const [draws, setDraws] = useState<DrawDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Fetches draws from the API
   */
  const fetchDraws = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setErrorMessage(null);

      const response = await fetch("/api/draws", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Handle authentication error
      if (response.status === 401) {
        setError("auth");
        setErrorMessage("Please log in to view your draws");
        return;
      }

      // Handle server error
      if (response.status === 500) {
        setError("server");
        setErrorMessage("Failed to load draws. Please try again.");
        return;
      }

      // Handle other non-OK responses
      if (!response.ok) {
        setError("unknown");
        setErrorMessage("An unexpected error occurred");
        return;
      }

      // Parse and validate response
      const data = await response.json();

      // Validate response structure
      if (!Array.isArray(data) || !data.every(isValidDrawDTO)) {
        console.error("Invalid API response:", data);
        setError("unknown");
        setErrorMessage("Invalid data received. Please contact support.");
        return;
      }

      // Successfully fetched draws
      setDraws(data);
    } catch (err) {
      // Handle network errors
      if (err instanceof TypeError) {
        setError("network");
        setErrorMessage("Network error. Please check your connection.");
      } else {
        setError("unknown");
        setErrorMessage("An unexpected error occurred");
      }
      console.error("Error fetching draws:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetch draws (for retry functionality)
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchDraws();
  }, [fetchDraws]);

  // Fetch draws on mount
  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  // Transform draws to view models
  const viewModels = useMemo(() => draws.map(transformDrawToViewModel), [draws]);

  return {
    draws,
    viewModels,
    loading,
    error,
    errorMessage,
    refetch,
  };
}

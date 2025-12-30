import { Button } from "@/components/ui/button";
import type { ErrorType } from "@/types/views";

interface ErrorStateProps {
  /** Type of error to display appropriate message */
  errorType: ErrorType;
  /** Optional custom error message */
  errorMessage?: string;
  /** Callback function to retry fetch */
  onRetry: () => void;
}

/**
 * Returns user-friendly error message based on error type
 * @param errorType - The type of error (auth, server, network, unknown)
 * @param customMessage - Optional custom error message to override defaults
 * @returns User-friendly error message string
 */
function getErrorMessage(errorType: ErrorType, customMessage?: string): string {
  if (customMessage) {
    return customMessage;
  }

  switch (errorType) {
    case "auth":
      return "Please log in to view your draws";
    case "server":
      return "Failed to load draws. Please try again.";
    case "network":
      return "Network error. Please check your connection.";
    case "unknown":
    default:
      return "An unexpected error occurred";
  }
}

/**
 * Error display component shown when data fetching fails
 * Displays appropriate error message and provides retry functionality
 * @param props - Component props
 * @param props.errorType - Type of error to display appropriate message
 * @param props.errorMessage - Optional custom error message
 * @param props.onRetry - Callback function to retry the failed operation
 */
export function ErrorState({ errorType, errorMessage, onRetry }: ErrorStateProps) {
  const displayMessage = getErrorMessage(errorType, errorMessage);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4" role="alert">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">Error Loading Draws</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">{displayMessage}</p>
      <Button onClick={onRetry} variant="default">
        Retry
      </Button>
    </div>
  );
}

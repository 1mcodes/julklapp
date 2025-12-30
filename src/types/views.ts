/**
 * View-specific type definitions for frontend components
 */

/**
 * View state for UI components
 */
export type ViewState = "loading" | "error" | "empty" | "success";

/**
 * Error categorization for appropriate messaging
 */
export type ErrorType = "auth" | "server" | "network" | "unknown";

/**
 * Processed draw data for table display
 */
export interface DrawRowViewModel {
  /** Draw UUID */
  id: string;
  /** Draw name */
  name: string;
  /** Human-readable date (e.g., "Dec 29, 2025") */
  formattedDate: string;
  /** Relative time (e.g., "2 days ago") */
  relativeDate: string;
  /** Pre-computed URL for navigation */
  detailsUrl: string;
}

/**
 * Hook return type for data management
 */
export interface UseDrawsReturn {
  /** Raw draw data from API */
  draws: import("../types").DrawDTO[];
  /** Processed data for display */
  viewModels: DrawRowViewModel[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: ErrorType | null;
  /** Detailed error message */
  errorMessage: string | null;
  /** Manual refetch function */
  refetch: () => Promise<void>;
}

/**
 * Scroll shadow state for table container
 */
export interface ScrollState {
  /** Show left edge shadow */
  hasLeftShadow: boolean;
  /** Show right edge shadow */
  hasRightShadow: boolean;
}

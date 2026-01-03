import { useCallback, useEffect } from "react";
import { useDraws } from "@/hooks/useDraws";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorState } from "./ErrorState";
import { EmptyDrawsState } from "./EmptyDrawsState";
import { DrawsTableContainer } from "./DrawsTableContainer";
import { DrawsTable } from "./DrawsTable";
import { toast } from "sonner";

interface CreatedDrawsViewProps {
  /** Whether the tab is currently active (for lazy loading) */
  isActive: boolean;
}

/**
 * Main container component for the Created Draws view
 * Manages data fetching, loading states, error handling, and conditional rendering
 * Displays a table of user-created draws with options to view details or create new draws
 * @param props - Component props
 * @param props.isActive - Whether the tab is currently active (for lazy loading)
 */
export function CreatedDrawsView({ isActive }: CreatedDrawsViewProps) {
  const { viewModels, loading, error, errorMessage, refetch } = useDraws();

  /**
   * Check for success flag from URL and show success toast
   */
  useEffect(() => {
    if (!isActive) return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      toast.success("Draw created successfully!", {
        description: "Your new draw has been added to the list.",
        duration: 6000,
      });

      // Clean up URL without reloading the page
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [isActive]);

  /**
   * Navigation handler for details button
   */
  const handleViewDetails = useCallback((drawId: string) => {
    window.location.href = `/dashboard/draws/${drawId}/participants`;
  }, []);

  /**
   * Handler for create draw action from empty state
   */
  const handleCreateDraw = useCallback(() => {
    window.location.href = "/dashboard/create";
  }, []);

  // Don't render if tab is not active (lazy loading)
  if (!isActive) {
    return null;
  }

  return (
    <div role="tabpanel" aria-label="Created draws" className="w-full">
      {loading && <LoadingSpinner />}

      {!loading && error && <ErrorState errorType={error} errorMessage={errorMessage ?? undefined} onRetry={refetch} />}

      {!loading && !error && viewModels.length === 0 && <EmptyDrawsState onCreateDraw={handleCreateDraw} />}

      {!loading && !error && viewModels.length > 0 && (
        <DrawsTableContainer>
          <DrawsTable draws={viewModels} onViewDetails={handleViewDetails} />
        </DrawsTableContainer>
      )}
    </div>
  );
}

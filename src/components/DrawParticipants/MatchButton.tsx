import React from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Props for MatchButton component.
 */
interface MatchButtonProps {
  onClick: () => Promise<void>;
  isLoading: boolean;
  isMatching: boolean;
}

/**
 * Action button that triggers the matching algorithm.
 * Shows loading spinner when operation is in progress.
 */
const MatchButton: React.FC<MatchButtonProps> = ({ onClick, isLoading, isMatching }) => {
  const isDisabled = isLoading || isMatching;

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className="gap-2"
      aria-label={isMatching ? "Running matching algorithm" : "Run matching algorithm"}
    >
      {isMatching ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Running...</span>
        </>
      ) : (
        <>
          <Play className="h-4 w-4" aria-hidden="true" />
          <span>Run Matching Algorithm</span>
        </>
      )}
    </Button>
  );
};

export default MatchButton;

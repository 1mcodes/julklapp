import { Button } from "@/components/ui/button";

interface EmptyDrawsStateProps {
  /** Callback to navigate to create draw view */
  onCreateDraw: () => void;
}

/**
 * Empty state component displayed when user has not created any draws yet
 * Encourages first-time action with a clear call-to-action button
 * @param props - Component props
 * @param props.onCreateDraw - Callback to navigate to create draw view
 */
export function EmptyDrawsState({ onCreateDraw }: EmptyDrawsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold mb-2">No draws yet</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        You haven't created any draws yet. Create your first Secret Santa draw to get started.
      </p>
      <Button onClick={onCreateDraw} variant="default" size="lg">
        Create New Draw
      </Button>
    </div>
  );
}

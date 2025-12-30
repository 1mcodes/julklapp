interface LoadingSpinnerProps {
  /** Optional loading message (default: "Loading draws...") */
  message?: string;
}

/**
 * Simple spinner component displayed during data loading
 * Provides visual feedback with an animated spinner and accessible loading message
 * @param props - Component props
 * @param props.message - Optional custom loading message
 */
export function LoadingSpinner({ message = "Loading draws..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16" role="status">
      <div
        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">{message}</span>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

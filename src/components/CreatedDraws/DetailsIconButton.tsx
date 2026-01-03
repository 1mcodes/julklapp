import { Button } from "@/components/ui/button";

interface DetailsIconButtonProps {
  /** Draw identifier for navigation - used in onClick handler */
  drawId: string;
  /** Draw name for accessible label */
  drawName: string;
  /** Click handler */
  onClick: (_drawId: string) => void;
}

/**
 * Icon-only button that navigates to the draw's participant details page
 * Uses an eye icon with proper ARIA labeling for accessibility
 * @param props - Component props
 * @param props.drawId - Draw identifier for navigation
 * @param props.drawName - Draw name for accessible label
 * @param props.onClick - Click handler callback
 */
export function DetailsIconButton({ drawId, drawName, onClick }: DetailsIconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onClick(drawId)}
      aria-label={`View details for ${drawName}`}
      className="h-9 w-9 p-0"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    </Button>
  );
}

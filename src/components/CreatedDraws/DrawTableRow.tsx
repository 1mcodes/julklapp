import { memo } from "react";
import type { DrawRowViewModel } from "@/types/views";
import { DetailsIconButton } from "./DetailsIconButton";

interface DrawTableRowProps {
  /** Draw data for display */
  draw: DrawRowViewModel;
  /** Callback for details button */
  onViewDetails: (drawId: string) => void;
}

/**
 * Individual table row representing a single draw
 * Memoized to prevent unnecessary re-renders
 */
export const DrawTableRow = memo(function DrawTableRow({ draw, onViewDetails }: DrawTableRowProps) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4 align-middle font-medium">{draw.name}</td>
      <td className="p-4 align-middle">
        <div className="flex flex-col">
          <span className="text-sm">{draw.formattedDate}</span>
          <span className="text-xs text-muted-foreground">{draw.relativeDate}</span>
        </div>
      </td>
      <td className="p-4 align-middle text-right">
        <DetailsIconButton drawId={draw.id} drawName={draw.name} onClick={onViewDetails} />
      </td>
    </tr>
  );
});

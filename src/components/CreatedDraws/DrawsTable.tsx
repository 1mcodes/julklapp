import type { DrawRowViewModel } from "@/types/views";
import { DrawTableRow } from "./DrawTableRow";

interface DrawsTableProps {
  /** List of draws to render */
  draws: DrawRowViewModel[];
  /** Callback for details button click */
  onViewDetails: (drawId: string) => void;
}

/**
 * Semantic HTML table component that displays draw information
 * Renders a structured, accessible table with draw names, creation dates, and action buttons
 * @param props - Component props
 * @param props.draws - List of draw view models to render
 * @param props.onViewDetails - Callback for details button click
 */
export function DrawsTable({ draws, onViewDetails }: DrawsTableProps) {
  return (
    <table className="w-full caption-bottom text-sm">
      <caption className="sr-only">Your created draws</caption>
      <thead className="border-b">
        <tr>
          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Draw Name</th>
          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
        </tr>
      </thead>
      <tbody>
        {draws.map((draw) => (
          <DrawTableRow key={draw.id} draw={draw} onViewDetails={onViewDetails} />
        ))}
      </tbody>
    </table>
  );
}

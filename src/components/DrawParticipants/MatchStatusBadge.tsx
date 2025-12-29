import React from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Badge component that displays when matches have been successfully created.
 * Provides visual feedback about the draw's matching status.
 */
const MatchStatusBadge: React.FC = () => {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800"
      role="status"
      aria-label="Matches have been created for this draw"
    >
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      <span>Matches Created</span>
    </div>
  );
};

export default MatchStatusBadge;

import React from "react";
import { Loader2 } from "lucide-react";
import { useDrawParticipants } from "../../hooks/useDrawParticipants";
import { Breadcrumb } from "./Breadcrumb";

/**
 * Props for DrawParticipantsView component.
 */
interface DrawParticipantsViewProps {
  drawId: string;
  drawName?: string;
}

/**
 * Main container component for the Draw Participants view.
 * Orchestrates data fetching, loading/error states, and renders appropriate UI.
 */
const DrawParticipantsView: React.FC<DrawParticipantsViewProps> = ({ drawId, drawName }) => {
  const { state, actions } = useDrawParticipants(drawId);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Created Draws", href: "/dashboard/created" },
    { label: drawName || "Participants" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      <div>
        <h1 className="text-3xl font-bold text-gray-900">{drawName || "Draw Participants"}</h1>
        <p className="mt-2 text-gray-600">View all participants in this draw.</p>
      </div>

      {/* Loading State */}
      {state.isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" aria-hidden="true" />
          <span className="sr-only">Loading participants...</span>
        </div>
      )}

      {/* Error State */}
      {!state.isLoading && state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-800">Error loading participants</p>
          <p className="mt-1 text-sm text-red-700">{state.error.message}</p>
          {(state.httpStatus === 500 || state.httpStatus === null) && (
            <button
              onClick={actions.refetch}
              className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Success State - Participants Table */}
      {!state.isLoading && !state.error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Surname
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {state.participants.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No participants found for this draw.
                  </td>
                </tr>
              ) : (
                state.participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{participant.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{participant.surname}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{participant.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DrawParticipantsView;

import React, { useEffect, useRef } from "react";
import { useDrawForm } from "../../hooks/useDrawForm";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DrawForm: React.FC = () => {
  const { state, actions } = useDrawForm();
  const drawNameRef = useRef<HTMLInputElement>(null);

  // Auto-focus on draw name input when component mounts
  useEffect(() => {
    if (drawNameRef.current) {
      drawNameRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await actions.submitForm();

    if (result.success && result.draw) {
      // Show success toast
      toast.success(`Draw "${result.draw.name}" created successfully!`, {
        description: "You can now share the draw link with participants.",
      });

      // Navigate to the participants page for the newly created draw
      setTimeout(() => {
        window.location.href = `/dashboard/draws/${result.draw.id}/participants`;
      }, 1500);
    }
  };

  const canAddParticipant = state.participants.length < 32;
  const canRemoveParticipant = state.participants.length > 3;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Draw Name Section */}
      <div className="space-y-2">
        <label htmlFor="draw-name" className="text-sm font-medium text-gray-700">
          Draw Name *
        </label>
        <Input
          ref={drawNameRef}
          id="draw-name"
          type="text"
          value={state.name}
          onChange={(e) => actions.setName(e.target.value)}
          placeholder="Enter draw name (e.g., Christmas 2024)"
          className={state.nameError ? "border-red-500" : ""}
          disabled={state.isSubmitting}
          aria-required="true"
          aria-invalid={!!state.nameError}
          aria-describedby={state.nameError ? "draw-name-error" : undefined}
          data-test-id="draw-name-input"
        />
        {state.nameError && (
          <p id="draw-name-error" className="text-sm text-red-600" role="alert">
            {state.nameError}
          </p>
        )}
      </div>

      {/* Participants Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Participants</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={actions.addParticipant}
            disabled={!canAddParticipant || state.isSubmitting}
            className="flex items-center gap-2"
            aria-label={canAddParticipant ? "Add another participant" : "Maximum participants reached (32)"}
            data-test-id="add-participant-button"
          >
            <Plus className="h-4 w-4" />
            Add Participant
          </Button>
        </div>

        {/* Screen reader status for participant count */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {state.participants.length} participants added
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {state.participants.map((participant, index) => (
            <ParticipantFieldGroup
              key={participant.id}
              participant={participant}
              index={index}
              canRemove={canRemoveParticipant}
              onChange={(field, value) => actions.updateParticipantField(index, field, value)}
              onRemove={() => actions.removeParticipant(index)}
              disabled={state.isSubmitting}
            />
          ))}
        </div>

        {state.participants.length < 3 && (
          <p className="text-sm text-amber-600">You need at least 3 participants to create a draw.</p>
        )}
      </div>

      {/* Form Error with ARIA live region */}
      <div aria-live="polite" aria-atomic="true">
        {state.formError && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-800">{state.formError}</p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={state.isSubmitting || !state.name.trim() || state.participants.length < 3}
          className="flex items-center gap-2"
          aria-describedby={state.isSubmitting ? "submit-status" : undefined}
          data-test-id="create-draw-button"
        >
          {state.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {state.isSubmitting ? "Creating Draw..." : "Create Draw"}
        </Button>

        {/* Screen reader status for form submission */}
        {state.isSubmitting && (
          <div id="submit-status" className="sr-only" aria-live="assertive">
            Creating draw, please wait...
          </div>
        )}
      </div>
    </form>
  );
};

interface ParticipantFieldGroupProps {
  participant: ReturnType<typeof useDrawForm>["state"]["participants"][0];
  index: number;
  canRemove: boolean;
  onChange: (
    field: keyof Omit<ReturnType<typeof useDrawForm>["state"]["participants"][0], "id">,
    value: string
  ) => void;
  onRemove: () => void;
  disabled: boolean;
}

const ParticipantFieldGroup: React.FC<ParticipantFieldGroupProps> = ({
  participant,
  index,
  canRemove,
  onChange,
  onRemove,
  disabled,
}) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Participant {index + 1}</h3>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            aria-label={`Remove participant ${index + 1}`}
            data-test-id={`remove-participant-${index}-button`}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove participant {index + 1}</span>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <label htmlFor={`name-${index}`} className="text-sm font-medium text-gray-700">
            First Name *
          </label>
          <Input
            id={`name-${index}`}
            type="text"
            value={participant.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Enter first name"
            className={participant.errors?.name ? "border-red-500" : ""}
            disabled={disabled}
            aria-required="true"
            aria-invalid={!!participant.errors?.name}
            aria-describedby={participant.errors?.name ? `name-error-${index}` : undefined}
            data-test-id={`participant-${index}-first-name`}
          />
          {participant.errors?.name && (
            <p id={`name-error-${index}`} className="text-sm text-red-600" role="alert">
              {participant.errors.name}
            </p>
          )}
        </div>

        {/* Surname */}
        <div className="space-y-1">
          <label htmlFor={`surname-${index}`} className="text-sm font-medium text-gray-700">
            Last Name *
          </label>
          <Input
            id={`surname-${index}`}
            type="text"
            value={participant.surname}
            onChange={(e) => onChange("surname", e.target.value)}
            placeholder="Enter last name"
            className={participant.errors?.surname ? "border-red-500" : ""}
            disabled={disabled}
            aria-required="true"
            aria-invalid={!!participant.errors?.surname}
            aria-describedby={participant.errors?.surname ? `surname-error-${index}` : undefined}
            data-test-id={`participant-${index}-last-name`}
          />
          {participant.errors?.surname && (
            <p id={`surname-error-${index}`} className="text-sm text-red-600" role="alert">
              {participant.errors.surname}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor={`email-${index}`} className="text-sm font-medium text-gray-700">
            Email *
          </label>
          <Input
            id={`email-${index}`}
            type="email"
            value={participant.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="Enter email address"
            className={participant.errors?.email ? "border-red-500" : ""}
            disabled={disabled}
            aria-required="true"
            aria-invalid={!!participant.errors?.email}
            aria-describedby={participant.errors?.email ? `email-error-${index}` : undefined}
            data-test-id={`participant-${index}-email`}
          />
          {participant.errors?.email && (
            <p id={`email-error-${index}`} className="text-sm text-red-600" role="alert">
              {participant.errors.email}
            </p>
          )}
        </div>

        {/* Gift Preferences */}
        <div className="space-y-1">
          <label htmlFor={`giftPreferences-${index}`} className="text-sm font-medium text-gray-700">
            Gift Preferences
          </label>
          <textarea
            id={`giftPreferences-${index}`}
            value={participant.giftPreferences}
            onChange={(e) => onChange("giftPreferences", e.target.value)}
            placeholder="Optional gift preferences or wishlist items..."
            className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              participant.errors?.giftPreferences ? "border-red-500" : ""
            }`}
            disabled={disabled}
            rows={3}
            maxLength={10000}
            aria-invalid={!!participant.errors?.giftPreferences}
            aria-describedby={
              participant.errors?.giftPreferences ? `giftPreferences-error-${index}` : `giftPreferences-help-${index}`
            }
            data-test-id={`participant-${index}-gift-preferences`}
          />
          {participant.errors?.giftPreferences && (
            <p id={`giftPreferences-error-${index}`} className="text-sm text-red-600" role="alert">
              {participant.errors.giftPreferences}
            </p>
          )}
          <p id={`giftPreferences-help-${index}`} className="text-xs text-gray-500">
            {participant.giftPreferences.length}/10000 characters
          </p>
        </div>
      </div>
    </div>
  );
};

export default DrawForm;

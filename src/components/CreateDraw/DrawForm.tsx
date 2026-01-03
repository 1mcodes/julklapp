import React, { useEffect } from "react";
import { useDrawFormRHF } from "../../hooks/useDrawFormRHF";
import { useCreateDraw } from "../../hooks/useCreateDraw";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DrawDTO } from "../../types";

const DrawForm: React.FC = () => {
  const { form, fields, actions, constraints } = useDrawFormRHF();
  const { createDraw, loading: isSubmitting, error: apiError } = useCreateDraw();
  const [successDraw, setSuccessDraw] = React.useState<DrawDTO | null>(null);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const draw = await createDraw(data);

      // Show success toast
      toast.success(`Draw "${draw.name}" created successfully!`, {
        description: "You can now share the draw link with participants.",
      });

      // Set success state for navigation
      setSuccessDraw(draw);
    } catch {
      // Error is already handled by the useCreateDraw hook
      // and displayed in the form
    }
  });

  // Handle navigation after successful draw creation
  useEffect(() => {
    if (successDraw) {
      const timer = setTimeout(() => {
        window.location.href = `/dashboard/draws/${successDraw.id}/participants`;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successDraw]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Draw Name Section */}
      <div className="space-y-2">
        <label htmlFor="draw-name" className="text-sm font-medium text-gray-700">
          Draw Name *
        </label>
        <Input
          id="draw-name"
          type="text"
          {...form.register("name")}
          placeholder="Enter draw name (e.g., Christmas 2024)"
          className={form.formState.errors.name ? "border-red-500" : ""}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!!form.formState.errors.name}
          aria-describedby={form.formState.errors.name ? "draw-name-error" : undefined}
          data-test-id="draw-name-input"
        />
        {form.formState.errors.name && (
          <p id="draw-name-error" className="text-sm text-red-600" role="alert">
            {form.formState.errors.name.message}
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
            disabled={!constraints.canAddParticipant || isSubmitting}
            className="flex items-center gap-2"
            aria-label={constraints.canAddParticipant ? "Add another participant" : "Maximum participants reached (32)"}
            data-test-id="add-participant-button"
          >
            <Plus className="h-4 w-4" />
            Add Participant
          </Button>
        </div>

        {/* Screen reader status for participant count */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {constraints.currentParticipants} participants added
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {fields.map((field, index) => (
            <ParticipantFieldGroup
              key={field.id}
              index={index}
              canRemove={constraints.canRemoveParticipant}
              onRemove={() => actions.removeParticipant(index)}
              disabled={isSubmitting}
              form={form}
            />
          ))}
        </div>

        {constraints.currentParticipants < 3 && (
          <p className="text-sm text-amber-600">You need at least 3 participants to create a draw.</p>
        )}
      </div>

      {/* Form Error with ARIA live region */}
      <div aria-live="polite" aria-atomic="true">
        {apiError && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-800">{apiError}</p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !form.watch("name")?.trim() || constraints.currentParticipants < 3}
          className="flex items-center gap-2"
          aria-describedby={isSubmitting ? "submit-status" : undefined}
          data-test-id="create-draw-button"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? "Creating Draw..." : "Create Draw"}
        </Button>

        {/* Screen reader status for form submission */}
        {isSubmitting && (
          <div id="submit-status" className="sr-only" aria-live="assertive">
            Creating draw, please wait...
          </div>
        )}
      </div>
    </form>
  );
};

interface ParticipantFieldGroupProps {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  disabled: boolean;
  form: ReturnType<typeof useDrawFormRHF>["form"];
}

const ParticipantFieldGroup: React.FC<ParticipantFieldGroupProps> = ({
  index,
  canRemove,
  onRemove,
  disabled,
  form,
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
            {...form.register(`participants.${index}.name`)}
            placeholder="Enter first name"
            className={form.formState.errors.participants?.[index]?.name ? "border-red-500" : ""}
            disabled={disabled}
            aria-required="true"
            aria-invalid={!!form.formState.errors.participants?.[index]?.name}
            aria-describedby={form.formState.errors.participants?.[index]?.name ? `name-error-${index}` : undefined}
            data-test-id={`participant-${index}-first-name`}
          />
          {form.formState.errors.participants?.[index]?.name && (
            <p id={`name-error-${index}`} className="text-sm text-red-600" role="alert">
              {form.formState.errors.participants[index].name.message}
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
            {...form.register(`participants.${index}.surname`)}
            placeholder="Enter last name"
            className={form.formState.errors.participants?.[index]?.surname ? "border-red-500" : ""}
            disabled={disabled}
            aria-required="true"
            aria-invalid={!!form.formState.errors.participants?.[index]?.surname}
            aria-describedby={
              form.formState.errors.participants?.[index]?.surname ? `surname-error-${index}` : undefined
            }
            data-test-id={`participant-${index}-last-name`}
          />
          {form.formState.errors.participants?.[index]?.surname && (
            <p id={`surname-error-${index}`} className="text-sm text-red-600" role="alert">
              {form.formState.errors.participants[index].surname.message}
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
            {...form.register(`participants.${index}.email`)}
            placeholder="Enter email address"
            className={form.formState.errors.participants?.[index]?.email ? "border-red-500" : ""}
            disabled={disabled}
            aria-required="true"
            aria-invalid={!!form.formState.errors.participants?.[index]?.email}
            aria-describedby={form.formState.errors.participants?.[index]?.email ? `email-error-${index}` : undefined}
            data-test-id={`participant-${index}-email`}
          />
          {form.formState.errors.participants?.[index]?.email && (
            <p id={`email-error-${index}`} className="text-sm text-red-600" role="alert">
              {form.formState.errors.participants[index].email.message}
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
            {...form.register(`participants.${index}.gift_preferences`)}
            placeholder="Optional gift preferences or wishlist items..."
            className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              form.formState.errors.participants?.[index]?.gift_preferences ? "border-red-500" : ""
            }`}
            disabled={disabled}
            rows={3}
            maxLength={10000}
            aria-invalid={!!form.formState.errors.participants?.[index]?.gift_preferences}
            aria-describedby={
              form.formState.errors.participants?.[index]?.gift_preferences
                ? `giftPreferences-error-${index}`
                : `giftPreferences-help-${index}`
            }
            data-test-id={`participant-${index}-gift-preferences`}
          />
          {form.formState.errors.participants?.[index]?.gift_preferences && (
            <p id={`giftPreferences-error-${index}`} className="text-sm text-red-600" role="alert">
              {form.formState.errors.participants[index].gift_preferences.message}
            </p>
          )}
          <p id={`giftPreferences-help-${index}`} className="text-xs text-gray-500">
            {form.watch(`participants.${index}.gift_preferences`)?.length || 0}/10000 characters
          </p>
        </div>
      </div>
    </div>
  );
};

export default DrawForm;

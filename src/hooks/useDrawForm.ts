import { useState, useCallback } from "react";
import type { CreateDrawCommand, DrawDTO } from "../types";

// View Model interfaces
export interface ParticipantVM {
  id: string;
  name: string;
  surname: string;
  email: string;
  giftPreferences: string;
  errors?: Record<keyof Omit<ParticipantVM, "id">, string>;
  touched?: boolean;
}

export interface DrawFormVM {
  name: string;
  nameError?: string;
  participants: ParticipantVM[];
  formError?: string;
  isSubmitting: boolean;
}

// Validation rules
const VALIDATION_RULES = {
  name: { required: true, minLength: 1 },
  surname: { required: true, minLength: 1 },
  email: { required: true, pattern: /^\S+@\S+\.\S+$/ },
  giftPreferences: { required: false, maxLength: 10000 },
} as const;

const MIN_PARTICIPANTS = 3;
const MAX_PARTICIPANTS = 32;

// Utility functions
function validateField(value: string, fieldName: keyof typeof VALIDATION_RULES): string | undefined {
  const rules = VALIDATION_RULES[fieldName];

  if (rules.required && (!value || value.trim().length === 0)) {
    return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
  }

  if (rules.minLength && value.length < rules.minLength) {
    return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rules.minLength} character${rules.minLength > 1 ? "s" : ""}`;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be no more than ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    if (fieldName === "email") {
      return "Please enter a valid email address";
    }
    return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} format is invalid`;
  }

  return undefined;
}

function validateParticipants(participants: ParticipantVM[]): ParticipantVM[] {
  return participants.map((participant) => {
    // Only validate participants that have been touched
    if (!participant.touched) {
      return participant;
    }

    const errors: Record<string, string> = {};

    const nameError = validateField(participant.name, "name");
    if (nameError) errors.name = nameError;

    const surnameError = validateField(participant.surname, "surname");
    if (surnameError) errors.surname = surnameError;

    const emailError = validateField(participant.email, "email");
    if (emailError) errors.email = emailError;

    const giftPreferencesError = validateField(participant.giftPreferences, "giftPreferences");
    if (giftPreferencesError) errors.giftPreferences = giftPreferencesError;

    return {
      ...participant,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  });
}

function createEmptyParticipant(): ParticipantVM {
  return {
    id: crypto.randomUUID(),
    name: "",
    surname: "",
    email: "",
    giftPreferences: "",
    touched: false,
  };
}

function hasValidationErrors(participants: ParticipantVM[]): boolean {
  return participants.some((participant) => participant.errors && Object.keys(participant.errors).length > 0);
}

export function useDrawForm() {
  const [state, setState] = useState<DrawFormVM>({
    name: "",
    participants: [createEmptyParticipant(), createEmptyParticipant(), createEmptyParticipant()], // Start with 3 participants
  });

  const setName = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      name,
      nameError: undefined, // Clear error on change
      formError: undefined, // Clear form error
    }));
  }, []);

  const addParticipant = useCallback(() => {
    setState((prev) => {
      if (prev.participants.length >= MAX_PARTICIPANTS) {
        return prev; // Don't add if at max
      }
      return {
        ...prev,
        participants: [...prev.participants, createEmptyParticipant()],
        formError: undefined, // Clear form error
      };
    });
  }, []);

  const removeParticipant = useCallback((index: number) => {
    setState((prev) => {
      if (prev.participants.length <= MIN_PARTICIPANTS) {
        return prev; // Don't remove if at min
      }
      const newParticipants = prev.participants.filter((_, i) => i !== index);
      return {
        ...prev,
        participants: newParticipants,
        formError: undefined, // Clear form error
      };
    });
  }, []);

  const updateParticipantField = useCallback((index: number, field: keyof Omit<ParticipantVM, "id">, value: string) => {
    setState((prev) => {
      const newParticipants = [...prev.participants];
      newParticipants[index] = {
        ...newParticipants[index],
        [field]: value,
        touched: true, // Mark as touched when user interacts
        errors: {
          ...newParticipants[index].errors,
          [field]: undefined, // Clear field error on change
        },
      };
      return {
        ...prev,
        participants: newParticipants,
        formError: undefined, // Clear form error
      };
    });
  }, []);

  const submitForm = useCallback(async (): Promise<{ success: boolean; draw?: DrawDTO; errors?: unknown }> => {
    // Validate name
    const nameError = validateField(state.name, "name");

    // Validate all participants on submit (regardless of touched state)
    const allParticipantsForValidation = state.participants.map((p) => ({ ...p, touched: true }));
    const validatedParticipants = validateParticipants(allParticipantsForValidation);

    setState((prev) => ({
      ...prev,
      nameError,
      participants: validatedParticipants,
    }));

    if (nameError || hasValidationErrors(validatedParticipants)) {
      return { success: false };
    }

    setState((prev) => ({ ...prev, isSubmitting: true, formError: undefined }));

    try {
      // Prepare the command
      const command: CreateDrawCommand = {
        name: state.name,
        participants: validatedParticipants.map((p) => ({
          name: p.name,
          surname: p.surname,
          email: p.email,
          gift_preferences: p.giftPreferences,
        })),
      };

      // Make API call
      const response = await fetch("/api/draws", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (response.ok) {
        const draw: DrawDTO = await response.json();
        setState((prev) => ({ ...prev, isSubmitting: false }));
        return { success: true, draw };
      } else {
        // Handle validation errors
        const errorData = await response.json();
        if (response.status === 400 && errorData.details) {
          // Map field errors
          const fieldErrors: Record<string, string> = {};
          const participantErrors: ParticipantVM[] = validatedParticipants.map((p) => ({ ...p, errors: {} }));

          errorData.details.forEach((detail: { field: string; message: string }) => {
            if (detail.field === "name") {
              fieldErrors.name = detail.message;
            } else if (detail.field.startsWith("participants[")) {
              // Parse participant index and field
              const match = detail.field.match(/^participants\[(\d+)\]\.(\w+)$/);
              if (match) {
                const [, indexStr, field] = match;
                const index = parseInt(indexStr, 10);
                if (participantErrors[index]) {
                  participantErrors[index].errors = {
                    ...participantErrors[index].errors,
                    [field]: detail.message,
                  };
                }
              }
            }
          });

          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            nameError: fieldErrors.name,
            participants: participantErrors,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            formError: errorData.message || "An unexpected error occurred",
          }));
        }
        return { success: false, errors: errorData };
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        formError: "Network error. Please check your connection and try again.",
      }));
      return { success: false, errors: error };
    }
  }, [state.name, state.participants]);

  return {
    state,
    actions: {
      setName,
      addParticipant,
      removeParticipant,
      updateParticipantField,
      submitForm,
    },
  };
}

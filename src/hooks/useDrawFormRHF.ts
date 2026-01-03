import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDrawSchema, type CreateDrawInput } from "../lib/schemas/draw.schema";

const MIN_PARTICIPANTS = 3;
const MAX_PARTICIPANTS = 32;

/**
 * Empty participant template for adding new participants
 */
const emptyParticipant: CreateDrawInput["participants"][0] = {
  name: "",
  surname: "",
  email: "",
  gift_preferences: "",
};

/**
 * Custom hook for managing draw form with React Hook Form
 * Replaces the complex manual state management with declarative form handling
 */
export function useDrawFormRHF() {
  const form = useForm<CreateDrawInput>({
    resolver: zodResolver(createDrawSchema),
    defaultValues: {
      name: "",
      participants: [emptyParticipant, emptyParticipant, emptyParticipant],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "participants",
  });

  /**
   * Add a new participant to the form
   */
  const addParticipant = () => {
    if (fields.length < MAX_PARTICIPANTS) {
      append(emptyParticipant);
    }
  };

  /**
   * Remove a participant from the form
   */
  const removeParticipant = (index: number) => {
    if (fields.length > MIN_PARTICIPANTS) {
      remove(index);
    }
  };

  /**
   * Check if participants can be added
   */
  const canAddParticipant = fields.length < MAX_PARTICIPANTS;

  /**
   * Check if participants can be removed
   */
  const canRemoveParticipant = fields.length > MIN_PARTICIPANTS;

  return {
    form,
    fields,
    actions: {
      addParticipant,
      removeParticipant,
    },
    constraints: {
      canAddParticipant,
      canRemoveParticipant,
      minParticipants: MIN_PARTICIPANTS,
      maxParticipants: MAX_PARTICIPANTS,
      currentParticipants: fields.length,
    },
  };
}

import { z } from "zod";

/**
 * Schema for validating participant data when creating a draw.
 * Ensures all required fields are present and meet constraints.
 */
export const createParticipantSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  surname: z.string().trim().min(1, "Surname is required"),
  email: z.string().email("Invalid email format"),
  gift_preferences: z.string().max(10000, "Gift preferences cannot exceed 10000 characters"),
});

/**
 * Schema for validating the complete draw creation request.
 * Enforces minimum and maximum participant limits (3-32).
 */
export const createDrawSchema = z.object({
  name: z.string().trim().min(1, "Draw name is required"),
  participants: z
    .array(createParticipantSchema)
    .min(3, "At least 3 participants are required")
    .max(32, "Maximum 32 participants allowed"),
});

/**
 * Inferred type from the Zod schema for type safety.
 */
export type CreateDrawInput = z.infer<typeof createDrawSchema>;





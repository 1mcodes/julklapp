import type { Tables, TablesInsert } from "./db/database.types";

// Command Models
/**
 * Command to create a participant for a new draw. Excludes database-managed fields.
 */
export type CreateParticipantCommand = Pick<
  TablesInsert<"draw_participants">,
  "name" | "surname" | "email" | "gift_preferences"
>;

/**
 * Command to create a draw along with its participants.
 */
export interface CreateDrawCommand {
  name: TablesInsert<"draws">["name"];
  participants: CreateParticipantCommand[];
}

// DTOs
/**
 * DTO representing summary information for a draw.
 */
export type DrawDTO = Pick<Tables<"draws">, "id" | "name" | "created_at">;

/**
 * DTO representing a participant in a draw.
 */
export type ParticipantDTO = Pick<
  Tables<"draw_participants">,
  "id" | "name" | "surname" | "email" | "gift_preferences"
>;

/**
 * Generic message response DTO.
 */
export interface MessageDTO {
  message: string;
}

/**
 * DTO for recipient basic information in match summaries.
 */
export type RecipientInfoDTO = Pick<ParticipantDTO, "name" | "surname" | "email">;

/**
 * DTO for match summary returned to participants.
 */
export interface MatchSummaryDTO {
  match_id: string;
  draw_id: string;
  recipient: RecipientInfoDTO;
}

/**
 * DTO for recipient detailed information in match details.
 */
export type RecipientDetailDTO = Pick<ParticipantDTO, "id" | "name" | "surname" | "email" | "gift_preferences">;

/**
 * DTO for match detail returned to participants.
 */
export interface MatchDetailDTO {
  match_id: string;
  draw_id: string;
  recipient: RecipientDetailDTO;
}

/**
 * DTO for AI gift suggestions for a specific match.
 */
export interface AISuggestionsDTO {
  suggestions: string[];
}

/**
 * Common pagination parameters for list endpoints.
 */
export interface PaginationParams {
  page: number;
  size: number;
  sort?: string;
}

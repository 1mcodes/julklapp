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
 * Response DTO for participants endpoint with match status.
 */
export interface ParticipantsWithMetadataDTO {
  participants: ParticipantDTO[];
  has_matches: boolean;
}

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

/**
 * API error response structure returned by the backend.
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

// Auth-related types

/**
 * Authenticated user information
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

/**
 * Session information
 */
export interface SessionInfo {
  user: AuthUser | null;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

/**
 * Login request DTO
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Register request DTO
 */
export interface RegisterDTO {
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

/**
 * Forgot password request DTO
 */
export interface ForgotPasswordDTO {
  email: string;
}

/**
 * Reset password request DTO
 */
export interface ResetPasswordDTO {
  password: string;
  confirmPassword: string;
  token: string;
}

/**
 * Authentication response DTO
 */
export interface AuthResponseDTO {
  user: AuthUser;
}

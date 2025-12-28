import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateDrawCommand, DrawDTO, ParticipantDTO } from "../../types";
import { LoggerService } from "./logger.service";

/**
 * Service responsible for managing draw operations.
 */
export class DrawService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Creates a new draw with participants in a transactional manner.
   *
   * @param command - The command containing draw name and participants
   * @param authorId - The ID of the user creating the draw
   * @returns The created draw summary (DrawDTO)
   * @throws Error if database operations fail after max retries
   */
  async createDraw(command: CreateDrawCommand, authorId: string): Promise<DrawDTO> {
    // Step 1: Insert the draw record
    const { data: draw, error: drawError } = await this.supabase
      .from("draws")
      .insert({
        name: command.name,
        author_id: authorId,
      })
      .select("id, name, created_at")
      .single();

    if (drawError || !draw) {
      await LoggerService.error("Failed to create draw", drawError);
      throw new Error("Failed to create draw");
    }

    // Step 2: Prepare participant records with the draw_id
    const participantRecords = command.participants.map((participant) => ({
      draw_id: draw.id,
      name: participant.name,
      surname: participant.surname,
      email: participant.email,
      gift_preferences: participant.gift_preferences,
    }));

    // Step 3: Bulk insert participants with retry logic (max 10 attempts)
    const maxRetries = 10;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const { error: participantsError } = await this.supabase.from("draw_participants").insert(participantRecords);

      if (!participantsError) {
        // Success! Return the DrawDTO
        return {
          id: draw.id,
          name: draw.name,
          created_at: draw.created_at,
        };
      }

      lastError = new Error(`Attempt ${attempt}/${maxRetries} failed: ${participantsError.message}`);
      await LoggerService.warn("Failed to create participants", lastError.message);

      // Wait a bit before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await this.delay(Math.min(1000 * Math.pow(2, attempt - 1), 5000));
      }
    }

    // All retries failed - cleanup and throw error
    await LoggerService.error(`Failed to create participants after ${maxRetries} attempts`, {
      drawId: draw.id,
      error: lastError?.message,
    });
    await this.supabase.from("draws").delete().eq("id", draw.id);

    throw new Error(`Failed to create participants after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Helper method to delay execution for retry logic.
   *
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Checks if a draw exists by ID.
   *
   * @param drawId - The UUID of the draw
   * @returns true if draw exists, false otherwise
   */
  async drawExists(drawId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("draws").select("id").eq("id", drawId).single();

    return !error && data !== null;
  }

  /**
   * Retrieves a draw by ID if the user is the author.
   *
   * @param drawId - The UUID of the draw
   * @param userId - The authenticated user's ID
   * @returns The draw if found and user is author, null otherwise
   */
  async getDrawByIdForAuthor(drawId: string, userId: string): Promise<DrawDTO | null> {
    const { data, error } = await this.supabase
      .from("draws")
      .select("id, name, created_at, author_id")
      .eq("id", drawId)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if user is the author
    if (data.author_id !== userId) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      created_at: data.created_at,
    };
  }

  /**
   * Retrieves all participants for a given draw.
   *
   * @param drawId - The UUID of the draw
   * @returns Array of ParticipantDTO
   * @throws Error if database query fails
   */
  async getParticipantsByDrawId(drawId: string): Promise<ParticipantDTO[]> {
    const { data, error } = await this.supabase
      .from("draw_participants")
      .select("id, name, surname, email, gift_preferences")
      .eq("draw_id", drawId)
      .order("created_at", { ascending: true });

    if (error) {
      await LoggerService.error("Failed to fetch participants", { drawId, error });
      throw new Error("Failed to fetch participants");
    }

    return data ?? [];
  }
}

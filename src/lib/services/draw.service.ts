import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateDrawCommand, DrawDTO, ParticipantDTO } from "../../types";
import { createAdminClient } from "../../db/supabase.admin.client";
import { LoggerService } from "./logger.service";

/**
 * Interface for provisioned participant account details
 */
interface ProvisionedParticipant {
  email: string;
  userId: string;
  participantId: string;
}

/**
 * Service responsible for managing draw operations.
 */
export class DrawService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Creates a new draw with participants in a transactional manner.
   * Also provisions Supabase auth accounts for participants and sends invitation emails.
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

    // Step 3: Bulk insert participants using admin client
    // Using admin client for reliability and to avoid RLS complexity during draw creation
    let insertedParticipants: { id: string; email: string }[] = [];

    try {
      const adminClient = createAdminClient();
      const { data: participants, error: participantsError } = await adminClient
        .from("draw_participants")
        .insert(participantRecords)
        .select("id, email");

      if (participantsError) {
        await LoggerService.error("Failed to insert participants", participantsError);
        throw new Error(`Failed to insert participants: ${participantsError.message}`);
      }

      if (!participants || participants.length === 0) {
        throw new Error("Participant insertion succeeded but no data returned");
      }

      insertedParticipants = participants;
      await LoggerService.info(`Successfully inserted ${insertedParticipants.length} participants for draw ${draw.id}`);
    } catch (error) {
      // Cleanup - delete the draw since participant insertion failed
      await LoggerService.error("Failed to create participants, rolling back draw", {
        drawId: draw.id,
        error: error instanceof Error ? error.message : String(error),
      });
      await this.supabase.from("draws").delete().eq("id", draw.id);

      throw new Error(`Failed to create participants: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Step 4: Provision Supabase auth accounts and send invitations
    // Note: inviteUserByEmail automatically sends invitation emails
    try {
      await LoggerService.info(`Inviting ${insertedParticipants.length} participants for draw ${draw.id}`);

      const participantsToProvision = insertedParticipants.map((p) => ({
        email: p.email,
        participantId: p.id,
      }));

      await this.provisionParticipantAccounts(participantsToProvision, draw.id);
    } catch (error) {
      // Log error but don't fail the draw creation
      // The draw is already created, we just couldn't provision accounts
      await LoggerService.error("Failed to provision accounts and send invitations", {
        drawId: draw.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Step 6: Return the DrawDTO
    return {
      id: draw.id,
      name: draw.name,
      created_at: draw.created_at,
    };
  }

  /**
   * Provisions Supabase authentication accounts for participants who don't have accounts yet.
   *
   * Uses Supabase's inviteUserByEmail method to send invitation emails directly.
   * Participants will receive an email invitation and can set their own password.
   *
   * @param participants - Array of participant emails to provision
   * @param drawId - The draw ID for logging purposes
   * @returns Array of provisioned participant account details
   * @throws Error if account provisioning fails
   */
  private async provisionParticipantAccounts(
    participants: { email: string; participantId: string }[],
    drawId: string
  ): Promise<ProvisionedParticipant[]> {
    if (participants.length === 0) {
      await LoggerService.info("No participants to provision");
      return [];
    }

    try {
      const adminClient = createAdminClient();
      const provisionedAccounts: ProvisionedParticipant[] = [];

      // Process participants sequentially to avoid rate limiting issues
      for (const participant of participants) {
        try {
          // Check if user already exists
          const { data: existingUsers } = await adminClient.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(
            (u) => u.email?.toLowerCase() === participant.email.toLowerCase()
          );

          if (existingUser) {
            await LoggerService.info(`User already exists for email: ${participant.email}`, {
              userId: existingUser.id,
            });
            continue;
          }

          // Invite user by email - Supabase sends invitation email automatically
          const { data, error } = await adminClient.auth.admin.inviteUserByEmail(participant.email, {
            redirectTo: `${import.meta.env.PUBLIC_SITE_URL || "http://localhost:4321"}/set-password`,
            data: {
              role: "participant",
            },
          });

          if (error) {
            await LoggerService.error(`Failed to invite user ${participant.email}`, error);
            throw new Error(`Failed to invite user: ${error.message}`);
          }

          if (!data.user) {
            throw new Error("User invitation succeeded but no user data returned");
          }

          provisionedAccounts.push({
            email: participant.email,
            userId: data.user.id,
            participantId: participant.participantId,
          });

          await LoggerService.info(`Successfully invited user ${participant.email}`, {
            userId: data.user.id,
          });
        } catch (error) {
          await LoggerService.error(`Account provisioning failed for participant ${participant.email}`, error);
          // Continue with other participants even if one fails
        }
      }

      await LoggerService.info(`Successfully invited ${provisionedAccounts.length} participants for draw ${drawId}`);

      return provisionedAccounts;
    } catch (error) {
      await LoggerService.error("Account provisioning batch failed", error);
      throw new Error("Failed to provision participant accounts");
    }
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

  /**
   * Retrieves all draws created by a specific author.
   *
   * @param authorId - The ID of the draw author
   * @returns Array of DrawDTO sorted by created_at descending
   * @throws Error if database query fails
   */
  async getDrawsByAuthor(authorId: string): Promise<DrawDTO[]> {
    const { data, error } = await this.supabase
      .from("draws")
      .select("id, name, created_at")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false });

    if (error) {
      await LoggerService.error("Failed to fetch draws for author", {
        authorId,
        error,
      });
      throw new Error("Failed to fetch draws");
    }

    return data ?? [];
  }
}

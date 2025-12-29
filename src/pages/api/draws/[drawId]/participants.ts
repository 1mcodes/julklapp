import type { APIRoute } from "astro";

import { DrawService } from "../../../../lib/services/draw.service";
import { MatchingService } from "../../../../lib/services/matching.service";
import { LoggerService } from "../../../../lib/services/logger.service";
import { drawIdParamSchema } from "../../../../lib/schemas/draw.schema";

export const prerender = false;

/**
 * GET /api/draws/{drawId}/participants
 * Retrieves all participants for a specific draw along with match status.
 *
 * Requires authentication. Only the draw author can access this endpoint.
 *
 * Path Parameters:
 * - drawId: UUID of the draw
 *
 * Response:
 * - participants: Array of ParticipantDTO
 * - has_matches: Boolean indicating if matches exist for this draw
 *
 * Responses:
 * - 200 OK: Object with participants array and has_matches boolean
 * - 400 Bad Request: Invalid drawId format
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: User is not the draw author
 * - 404 Not Found: Draw does not exist
 * - 500 Internal Server Error: Database or unexpected errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // TODO: Implement proper authentication when ready
    // For now, using mock user ID
    const mockUserId = "00000000-0000-0000-0000-000000000000";

    // Step 1: Validate path parameter
    const validationResult = drawIdParamSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid draw ID format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { drawId } = validationResult.data;

    // Step 2: Initialize service and verify draw access
    const drawService = new DrawService(locals.supabase);
    const draw = await drawService.getDrawByIdForAuthor(drawId, mockUserId);

    if (!draw) {
      // Check if draw exists at all to differentiate 404 vs 403
      const drawExists = await drawService.drawExists(drawId);

      if (!drawExists) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Draw not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Draw exists but user is not author
      await LoggerService.warn("Forbidden access attempt to draw participants", {
        drawId,
        userId: mockUserId,
      });

      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You do not have access to this draw",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Fetch participants
    const participants = await drawService.getParticipantsByDrawId(drawId);

    // Step 4: Check if matches exist for this draw
    const matchingService = new MatchingService(locals.supabase);
    const hasMatches = await matchingService.matchesExist(drawId);

    await LoggerService.info("Draw participants retrieved", {
      drawId,
      participantCount: participants.length,
      hasMatches,
    });

    // Step 5: Return success response with participants and match status
    return new Response(
      JSON.stringify({
        participants,
        has_matches: hasMatches,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    await LoggerService.error("Error fetching draw participants", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while fetching participants",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

import type { APIRoute } from "astro";
import { z } from "zod";

import { MatchingService } from "../../../../lib/services/matching.service";
import { LoggerService } from "../../../../lib/services/logger.service";
import type { MessageDTO, ApiErrorResponse } from "../../../../types";

export const prerender = false;

/**
 * Validation schema for path parameters.
 */
const paramsSchema = z.object({
  drawId: z.string().uuid({ message: "Invalid draw ID format" }),
});

/**
 * POST /api/draws/{drawId}/match
 * Executes the Secret Santa matching algorithm for a specific draw.
 *
 * This endpoint:
 * 1. Generates random pairings where each participant gives to one other participant
 * 2. Provisions authentication accounts for participants without user accounts
 *
 * Business Rules:
 * - Minimum 3 participants required
 * - Each participant gives to exactly one other participant
 * - Each participant receives from exactly one other participant
 * - No self-assignments
 * - Operation is idempotent (rejects if matches already exist)
 *
 * Authorization:
 * - TODO: Authentication and authorization are currently MOCKED for development
 * - Will require authentication when auth is implemented
 * - Will verify that only the draw author can trigger matching
 *
 * Responses:
 * - 200 OK: Matches created successfully
 * - 400 Bad Request: Invalid input, matches exist, or insufficient participants
 * - 404 Not Found: Draw not found
 * - 500 Internal Server Error: Matching or provisioning failed
 */
export const POST: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate drawId format
    const validationResult = paramsSchema.safeParse(params);

    if (!validationResult.success) {
      const errorResponse: ApiErrorResponse = {
        error: "Bad Request",
        message: "Invalid draw ID format",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { drawId } = validationResult.data;

    // TODO: Implement proper authentication when ready
    // For now, using mock user ID
    const mockUserId = "00000000-0000-0000-0000-000000000000";

    // Step 2: Get authenticated user (MOCKED)
    // const {
    //   data: { user },
    //   error: authError,
    // } = await locals.supabase.auth.getUser();

    // if (authError || !user) {
    //   await LoggerService.info("Unauthenticated match request", { drawId });

    //   const errorResponse: ApiErrorResponse = {
    //     error: "Unauthorized",
    //     message: "Authentication required",
    //   };

    //   return new Response(JSON.stringify(errorResponse), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // Step 3: Fetch draw and verify existence
    const { data: draw, error: drawError } = await locals.supabase
      .from("draws")
      .select("id, author_id, name")
      .eq("id", drawId)
      .single();

    if (drawError || !draw) {
      await LoggerService.info("Draw not found", { drawId, userId: mockUserId });

      const errorResponse: ApiErrorResponse = {
        error: "Not Found",
        message: "Draw not found",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Verify authorization (user must be draw author) - DISABLED FOR NOW
    // if (draw.author_id !== mockUserId) {
    //   await LoggerService.warn("Unauthorized match attempt", {
    //     drawId,
    //     userId: mockUserId,
    //     authorId: draw.author_id,
    //   });

    //   const errorResponse: ApiErrorResponse = {
    //     error: "Forbidden",
    //     message: "Only the draw author can generate matches",
    //   };

    //   return new Response(JSON.stringify(errorResponse), {
    //     status: 403,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // Step 5: Check if matches already exist (idempotency)
    const matchingService = new MatchingService(locals.supabase);
    const matchesAlreadyExist = await matchingService.matchesExist(drawId);

    if (matchesAlreadyExist) {
      await LoggerService.info("Matches already exist for draw", { drawId });

      const errorResponse: ApiErrorResponse = {
        error: "Bad Request",
        message: "Matches have already been generated for this draw",
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: Generate matches (orchestrates algorithm, provisioning, and persistence)
    try {
      await matchingService.generateMatches(drawId);
    } catch (error) {
      // Handle specific validation errors (e.g., insufficient participants)
      if (error instanceof Error && error.message.includes("Insufficient participants")) {
        const errorResponse: ApiErrorResponse = {
          error: "Bad Request",
          message: error.message,
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Re-throw for general error handler
      throw error;
    }

    // Step 7: Return success response
    await LoggerService.info("Matches created successfully", {
      drawId,
      drawName: draw.name,
      userId: mockUserId,
    });

    const successResponse: MessageDTO = {
      message: "Matches created successfully",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 8: Handle unexpected errors
    await LoggerService.error("Error generating matches", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      drawId: params.drawId,
    });

    const errorResponse: ApiErrorResponse = {
      error: "Internal Server Error",
      message: "Failed to generate matches. Please try again",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

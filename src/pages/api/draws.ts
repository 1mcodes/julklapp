import type { APIRoute } from "astro";

import { DrawService } from "../../lib/services/draw.service";
import { LoggerService } from "../../lib/services/logger.service";
import { createDrawSchema } from "../../lib/schemas/draw.schema";
import type { CreateDrawCommand } from "../../types";

export const prerender = false;

/**
 * POST /api/draws
 * Creates a new draw with participants.
 *
 * Requires authentication. The authenticated user becomes the draw author.
 *
 * Request Body:
 * - name: string (non-empty)
 * - participants: array (3-32 items)
 *   - name: string (non-empty)
 *   - surname: string (non-empty)
 *   - email: string (valid email)
 *   - gift_preferences: string (max 10000 chars)
 *
 * Responses:
 * - 201 Created: Draw successfully created
 * - 400 Bad Request: Validation errors
 * - 401 Unauthorized: Missing or invalid authentication
 * - 500 Internal Server Error: Database or unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // TODO: Implement proper authentication when ready
    // For now, using mock user ID
    const mockUserId = "00000000-0000-0000-0000-000000000000";

    // Step 1: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const validationResult = createDrawSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Invalid request data",
          details: errors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Step 2: Create command and call service
    const command: CreateDrawCommand = {
      name: validationResult.data.name,
      participants: validationResult.data.participants,
    };

    const drawService = new DrawService(locals.supabase);
    const draw = await drawService.createDraw(command, mockUserId);

    await LoggerService.info("Draw created successfully", {
      drawId: draw.id,
      drawName: draw.name,
      participantCount: command.participants.length,
    });

    // Step 3: Return success response
    return new Response(JSON.stringify(draw), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Step 4: Handle unexpected errors
    await LoggerService.error("Error creating draw", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while creating the draw",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

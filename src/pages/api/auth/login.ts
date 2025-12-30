import type { APIRoute } from "astro";

import { LoggerService } from "../../../lib/services/logger.service";
import { mapAuthError } from "../../../lib/services/auth-error.service";
import { loginSchema } from "../../../lib/schemas/auth.schema";
import type { AuthResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticate user and create session.
 *
 * Request body:
 * - email: string (required)
 * - password: string (required)
 *
 * Responses:
 * - 200 OK: User authenticated successfully
 * - 400 Bad Request: Validation errors
 * - 401 Unauthorized: Invalid credentials
 * - 429 Too Many Requests: Rate limit exceeded
 * - 500 Internal Server Error: Unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 2: Validate request body
    const validationResult = loginSchema.safeParse(body);

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
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Step 3: Authenticate with Supabase
    const { data, error: authError } = await locals.supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !data.user) {
      // Map Supabase error to user-friendly message
      const statusCode = authError?.status || 401;
      const message = authError ? mapAuthError(authError) : "Authentication failed";

      await LoggerService.warn("Authentication failed", {
        error: authError?.message,
        email: email.trim().toLowerCase(),
      });

      return new Response(
        JSON.stringify({
          error: authError?.name || "Authentication Error",
          message,
        }),
        { status: statusCode, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Log successful login
    await LoggerService.info("User logged in successfully", {
      userId: data.user.id,
      email: data.user.email,
    });

    // Step 5: Return user data
    const response: AuthResponseDTO = {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected error handling
    await LoggerService.error("Unexpected error in login endpoint", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

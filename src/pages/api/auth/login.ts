import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/schemas/auth.schema";
import { mapAuthError } from "../../../lib/services/auth-error.service";

/**
 * POST /api/auth/login
 *
 * Authenticates a user and creates a session.
 * Requires email confirmation before login is allowed.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
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

    // Validate with Zod
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
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validationResult.data;

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Sign in with Supabase Auth
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const statusCode = error.status || 401;
      const message = mapAuthError(error);

      return new Response(
        JSON.stringify({
          error: error.name || "Authentication Error",
          message,
        }),
        { status: statusCode, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user and session were created successfully
    if (!data.user || !data.session) {
      return new Response(
        JSON.stringify({
          error: "Authentication Error",
          message: "Failed to create session",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Success response - cookies are automatically set by @supabase/ssr middleware
    return new Response(
      JSON.stringify({
        message: "Logged in successfully",
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: !!data.user.email_confirmed_at,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Unexpected error handling
    console.error("Unexpected error in login endpoint:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

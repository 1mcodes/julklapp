import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/schemas/auth.schema";
import { mapAuthError } from "../../../lib/services/auth-error.service";

/**
 * POST /api/auth/register
 *
 * Creates a new user account with email verification required.
 * Users must confirm their email before they can log in.
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
    const validationResult = registerSchema.safeParse(body);

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

    // Sign up with Supabase Auth
    // Session is created immediately upon successful registration
    const { data, error } = await locals.supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        // Redirect URL after email confirmation (if enabled in Supabase)
        emailRedirectTo: `${new URL(request.url).origin}/dashboard/created`,
      },
    });

    if (error) {
      const statusCode = error.status || 500;
      const message = mapAuthError(error);

      return new Response(
        JSON.stringify({
          error: error.name || "Registration Error",
          message,
        }),
        { status: statusCode, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user was created successfully
    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Registration Error",
          message: "Failed to create user account",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Success response
    // Session is created and user can access the application
    return new Response(
      JSON.stringify({
        message: "Account created successfully",
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: !!data.user.email_confirmed_at,
        },
        session: data.session ? true : false,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Unexpected error handling
    console.error("Unexpected error in registration endpoint:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

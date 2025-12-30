import type { APIRoute } from "astro";

/**
 * GET /api/auth/session
 *
 * Returns the current user session information.
 * Used for client-side authentication checks.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const {
      data: { user },
      error,
    } = await locals.supabase.auth.getUser();

    if (error || !user) {
      return new Response(
        JSON.stringify({
          user: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          emailConfirmed: !!user.email_confirmed_at,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in session endpoint:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

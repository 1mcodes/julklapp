import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Logs out the current user by ending their Supabase session
 */
export const POST: APIRoute = async ({ locals, redirect }) => {
  try {
    // Sign out the user
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return new Response(
        JSON.stringify({
          error: "logout_failed",
          message: "Failed to log out. Please try again.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Redirect to login page after successful logout
    return redirect("/login", 302);
  } catch (error) {
    console.error("Unexpected logout error:", error);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred during logout.",
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

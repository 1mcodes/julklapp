import type { APIRoute } from "astro";

/**
 * POST /api/auth/logout
 *
 * Ends the current user session and clears authentication cookies.
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Sign out the user
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
      return new Response(
        JSON.stringify({
          error: "Logout Error",
          message: "Failed to log out. Please try again.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Cookies are automatically cleared by @supabase/ssr middleware
    return new Response(
      JSON.stringify({
        message: "Logged out successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in logout endpoint:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

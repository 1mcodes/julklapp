import type { AstroGlobal } from "astro";

import type { AuthUser } from "../../types";

/**
 * Protects a route by requiring authentication.
 * Redirects to login if not authenticated.
 *
 * @param Astro - Astro global object
 * @returns Authenticated user
 */
export async function requireAuth(Astro: AstroGlobal): Promise<AuthUser> {
  const {
    data: { user },
    error,
  } = await Astro.locals.supabase.auth.getUser();

  if (error || !user) {
    const redirectUrl = Astro.url.pathname + Astro.url.search;
    return Astro.redirect(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
  }

  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name,
  };
}

/**
 * Gets current session without requiring auth (returns null if not authenticated).
 *
 * @param Astro - Astro global object
 * @returns User if authenticated, null otherwise
 */
export async function getSession(Astro: AstroGlobal): Promise<AuthUser | null> {
  const {
    data: { user },
    error,
  } = await Astro.locals.supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name,
  };
}

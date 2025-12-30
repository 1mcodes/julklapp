import type { AstroGlobal } from "astro";

/**
 * Authenticated user information
 */
export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
}

/**
 * Protects a route by requiring authentication.
 * Redirects to login if not authenticated.
 *
 * @param Astro - Astro global object
 * @returns Authenticated user or redirects to login
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
    emailConfirmed: !!user.email_confirmed_at,
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
    emailConfirmed: !!user.email_confirmed_at,
  };
}

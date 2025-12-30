import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "../db/database.types";

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/set-password"];

/**
 * API routes that don't require authentication
 */
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

/**
 * Check if the given path matches any of the allowed routes
 */
function isPublicRoute(pathname: string, allowedRoutes: string[]): boolean {
  return allowedRoutes.some((route) => {
    // Exact match
    if (pathname === route) return true;
    // Allow route with trailing slash
    if (pathname === `${route}/`) return true;
    return false;
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Create request-scoped Supabase client with cookie handlers
  context.locals.supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      get(key) {
        return context.cookies.get(key)?.value;
      },
      set(key, value, options) {
        context.cookies.set(key, value, options);
      },
      remove(key, options) {
        context.cookies.delete(key, options);
      },
    },
  });

  const pathname = context.url.pathname;

  // Check if route is public
  const isPublic = isPublicRoute(pathname, PUBLIC_ROUTES) || isPublicRoute(pathname, PUBLIC_API_ROUTES);

  // Allow public routes without authentication check
  if (isPublic) {
    return next();
  }

  // For protected routes, verify authentication
  // getSession() automatically refreshes expired sessions
  const {
    data: { session },
  } = await context.locals.supabase.auth.getSession();

  // If no session exists, redirect to login with return URL
  if (!session) {
    // For API routes, return 401 instead of redirecting
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // For page routes, redirect to login with the intended destination
    const loginUrl = new URL("/login", context.url.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return context.redirect(loginUrl.toString());
  }

  // User is authenticated, proceed with the request
  return next();
});

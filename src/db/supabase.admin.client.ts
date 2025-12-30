import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Admin Supabase client with elevated privileges for server-side operations.
 *
 * IMPORTANT: This client should ONLY be used in server-side code (API routes, middleware).
 * NEVER expose the service role key to the client-side.
 *
 * Use cases:
 * - Creating user accounts (auth.admin.createUser)
 * - Bypassing RLS policies for admin operations
 * - Bulk operations that require elevated privileges
 */
export function createAdminClient() {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type AdminSupabaseClient = ReturnType<typeof createAdminClient>;

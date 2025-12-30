import type { AuthError } from "@supabase/supabase-js";

/**
 * Maps Supabase authentication errors to user-friendly messages.
 *
 * @param error - The authentication error from Supabase
 * @returns A user-friendly error message
 */
export function mapAuthError(error: AuthError): string {
  switch (error.message) {
    case "Invalid login credentials":
      return "Invalid email or password";
    case "Email not confirmed":
      return "Please verify your email address";
    case "User already registered":
      return "An account with this email already exists";
    case "Password is too weak":
      return "Password is too weak. Please choose a stronger password";
    default:
      if (error.status === 429) {
        return "Too many attempts. Please try again later";
      }
      return "Authentication failed. Please try again";
  }
}

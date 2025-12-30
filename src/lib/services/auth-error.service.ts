import { AuthError } from "@supabase/supabase-js";

/**
 * Maps technical Supabase authentication errors to user-friendly messages.
 *
 * @param error - Supabase AuthError
 * @returns User-friendly error message
 */
export function mapAuthError(error: AuthError): string {
  // Check for specific error messages
  switch (error.message) {
    case "Invalid login credentials":
      return "Invalid email or password";
    case "Email not confirmed":
      return "Please verify your email address before logging in";
    case "User already registered":
      return "Email already in use";
    case "Password is too weak":
      return "Password is too weak. Please choose a stronger password";
    case "Signups not allowed for this instance":
      return "Registration is currently disabled";
    case "Anonymous sign-ins are disabled":
      return "Anonymous access is not allowed";
    default:
      // Check for specific status codes
      if (error.status === 429) {
        return "Too many attempts. Please try again later";
      }
      if (error.status === 422) {
        return "Invalid input. Please check your information";
      }
      if (error.status === 500 || error.status === 503) {
        return "Service temporarily unavailable. Please try again later";
      }

      // Generic fallback based on error type
      if (error.message.toLowerCase().includes("email")) {
        return "Invalid email address";
      }
      if (error.message.toLowerCase().includes("password")) {
        return "Invalid password";
      }

      // Generic error for security purposes
      return "An error occurred. Please try again";
  }
}

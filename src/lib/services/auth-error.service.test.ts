import { describe, it, expect } from "vitest";
import { AuthError } from "@supabase/supabase-js";
import { mapAuthError } from "./auth-error.service";

/**
 * Helper function to create an AuthError with specific properties
 */
function createAuthError(message: string, status?: number): AuthError {
  return {
    name: "AuthError",
    message,
    status,
  } as AuthError;
}

describe("mapAuthError", () => {
  describe("specific error messages", () => {
    it("should map 'Invalid login credentials' to user-friendly message", () => {
      const error = createAuthError("Invalid login credentials");
      const result = mapAuthError(error);
      expect(result).toBe("Invalid email or password");
    });

    it("should map 'Email not confirmed' to user-friendly message", () => {
      const error = createAuthError("Email not confirmed");
      const result = mapAuthError(error);
      expect(result).toBe("Please verify your email address before logging in");
    });

    it("should map 'User already registered' to user-friendly message", () => {
      const error = createAuthError("User already registered");
      const result = mapAuthError(error);
      expect(result).toBe("Email already in use");
    });

    it("should map 'Password is too weak' to user-friendly message", () => {
      const error = createAuthError("Password is too weak");
      const result = mapAuthError(error);
      expect(result).toBe("Password is too weak. Please choose a stronger password");
    });

    it("should map 'Signups not allowed for this instance' to user-friendly message", () => {
      const error = createAuthError("Signups not allowed for this instance");
      const result = mapAuthError(error);
      expect(result).toBe("Registration is currently disabled");
    });

    it("should map 'Anonymous sign-ins are disabled' to user-friendly message", () => {
      const error = createAuthError("Anonymous sign-ins are disabled");
      const result = mapAuthError(error);
      expect(result).toBe("Anonymous access is not allowed");
    });
  });

  describe("status code handling", () => {
    it("should map status 429 to rate limit message", () => {
      const error = createAuthError("Too many requests", 429);
      const result = mapAuthError(error);
      expect(result).toBe("Too many attempts. Please try again later");
    });

    it("should map status 422 to validation error message", () => {
      const error = createAuthError("Unprocessable entity", 422);
      const result = mapAuthError(error);
      expect(result).toBe("Invalid input. Please check your information");
    });

    it("should map status 500 to service unavailable message", () => {
      const error = createAuthError("Internal server error", 500);
      const result = mapAuthError(error);
      expect(result).toBe("Service temporarily unavailable. Please try again later");
    });

    it("should map status 503 to service unavailable message", () => {
      const error = createAuthError("Service unavailable", 503);
      const result = mapAuthError(error);
      expect(result).toBe("Service temporarily unavailable. Please try again later");
    });

    it("should prioritize status code over generic message patterns", () => {
      const error = createAuthError("Something went wrong with email", 429);
      const result = mapAuthError(error);
      expect(result).toBe("Too many attempts. Please try again later");
    });
  });

  describe("fallback message patterns", () => {
    it("should map error containing 'email' (lowercase) to email error", () => {
      const error = createAuthError("Invalid email format");
      const result = mapAuthError(error);
      expect(result).toBe("Invalid email address");
    });

    it("should map error containing 'EMAIL' (uppercase) to email error", () => {
      const error = createAuthError("EMAIL is required");
      const result = mapAuthError(error);
      expect(result).toBe("Invalid email address");
    });

    it("should map error containing 'Email' (mixed case) to email error", () => {
      const error = createAuthError("Email address is invalid");
      const result = mapAuthError(error);
      expect(result).toBe("Invalid email address");
    });

    it("should map error containing 'password' (lowercase) to password error", () => {
      const error = createAuthError("Invalid password format");
      const result = mapAuthError(error);
      expect(result).toBe("Invalid password");
    });

    it("should map error containing 'PASSWORD' (uppercase) to password error", () => {
      const error = createAuthError("PASSWORD is required");
      const result = mapAuthError(error);
      expect(result).toBe("Invalid password");
    });

    it("should map error containing 'Password' (mixed case) to password error", () => {
      const error = createAuthError("Password must contain special characters");
      const result = mapAuthError(error);
      expect(result).toBe("Invalid password");
    });
  });

  describe("edge cases", () => {
    it("should return generic message for unknown error", () => {
      const error = createAuthError("Some unknown error");
      const result = mapAuthError(error);
      expect(result).toBe("An error occurred. Please try again");
    });

    it("should return generic message for empty error message", () => {
      const error = createAuthError("");
      const result = mapAuthError(error);
      expect(result).toBe("An error occurred. Please try again");
    });

    it("should handle error with undefined status", () => {
      const error = createAuthError("Some error", undefined);
      const result = mapAuthError(error);
      expect(result).toBe("An error occurred. Please try again");
    });

    it("should handle error with null-like message", () => {
      const error = createAuthError("null");
      const result = mapAuthError(error);
      expect(result).toBe("An error occurred. Please try again");
    });

    it("should handle error with status 0", () => {
      const error = createAuthError("Network error", 0);
      const result = mapAuthError(error);
      expect(result).toBe("An error occurred. Please try again");
    });

    it("should handle error with unrecognized status code", () => {
      const error = createAuthError("Bad request", 400);
      const result = mapAuthError(error);
      expect(result).toBe("An error occurred. Please try again");
    });

    it("should not confuse 'email' substring in unrelated message", () => {
      const error = createAuthError("Failed to send email notification", 500);
      const result = mapAuthError(error);
      // Status code should take precedence
      expect(result).toBe("Service temporarily unavailable. Please try again later");
    });

    it("should handle message with both 'email' and 'password' keywords", () => {
      const error = createAuthError("Email or password is incorrect");
      const result = mapAuthError(error);
      // First match (email) should be returned
      expect(result).toBe("Invalid email address");
    });

    it("should handle exact match before pattern matching", () => {
      const error = createAuthError("Invalid login credentials");
      const result = mapAuthError(error);
      // Should use exact match, not fall through to pattern matching
      expect(result).toBe("Invalid email or password");
    });
  });

  describe("security considerations", () => {
    it("should not expose technical error details", () => {
      const error = createAuthError("Database connection failed");
      const result = mapAuthError(error);
      expect(result).toBe("An error occurred. Please try again");
      expect(result).not.toContain("Database");
      expect(result).not.toContain("connection");
    });

    it("should not expose SQL or query errors", () => {
      const error = createAuthError("SQL error: syntax error near 'SELECT'");
      const result = mapAuthError(error);
      expect(result).toBe("An error occurred. Please try again");
      expect(result).not.toContain("SQL");
    });

    it("should not expose internal service names", () => {
      const error = createAuthError("AuthService.authenticate failed");
      const result = mapAuthError(error);
      expect(result).toBe("An error occurred. Please try again");
      expect(result).not.toContain("AuthService");
    });

    it("should provide generic message for server errors without exposing details", () => {
      const error = createAuthError("Internal server error: memory overflow", 500);
      const result = mapAuthError(error);
      expect(result).toBe("Service temporarily unavailable. Please try again later");
      expect(result).not.toContain("memory");
      expect(result).not.toContain("overflow");
    });
  });

  describe("precedence of error handling", () => {
    it("should check exact message before status code", () => {
      // Even though we have a status code, exact message match should take precedence
      const error = createAuthError("Invalid login credentials", 500);
      const result = mapAuthError(error);
      expect(result).toBe("Invalid email or password");
    });

    it("should check status code before pattern matching", () => {
      const error = createAuthError("Something with email keyword", 422);
      const result = mapAuthError(error);
      expect(result).toBe("Invalid input. Please check your information");
    });

    it("should use pattern matching only when no exact message or status code matches", () => {
      const error = createAuthError("The email you provided is invalid");
      const result = mapAuthError(error);
      expect(result).toBe("Invalid email address");
    });
  });

  describe("case sensitivity", () => {
    it("should handle exact message matches case-sensitively", () => {
      // This should NOT match "Invalid login credentials"
      const error = createAuthError("INVALID LOGIN CREDENTIALS");
      const result = mapAuthError(error);
      expect(result).not.toBe("Invalid email or password");
      expect(result).toBe("An error occurred. Please try again");
    });

    it("should handle pattern matching case-insensitively", () => {
      // Pattern matching uses toLowerCase(), so this should work
      const error = createAuthError("INVALID EMAIL FORMAT");
      const result = mapAuthError(error);
      expect(result).toBe("Invalid email address");
    });
  });

  describe("whitespace handling", () => {
    it("should not match message with leading whitespace", () => {
      const error = createAuthError("  Invalid login credentials");
      const result = mapAuthError(error);
      expect(result).not.toBe("Invalid email or password");
      expect(result).toBe("An error occurred. Please try again");
    });

    it("should not match message with trailing whitespace", () => {
      const error = createAuthError("Invalid login credentials  ");
      const result = mapAuthError(error);
      expect(result).not.toBe("Invalid email or password");
      expect(result).toBe("An error occurred. Please try again");
    });

    it("should match pattern with whitespace in the message", () => {
      const error = createAuthError("   invalid email format   ");
      const result = mapAuthError(error);
      expect(result).toBe("Invalid email address");
    });
  });
});

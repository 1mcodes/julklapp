import { describe, it, expect } from "vitest";

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setPasswordSchema,
} from "./auth.schema";

describe("loginSchema", () => {
  it("should validate valid login credentials", () => {
    const validLogin = {
      email: "user@example.com",
      password: "password123",
    };

    const result = loginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalidLogin = {
      email: "not-an-email",
      password: "password123",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid email format");
    }
  });

  it("should reject email that is too long", () => {
    const invalidLogin = {
      email: `${"a".repeat(250)}@example.com`,
      password: "password123",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Email is too long");
    }
  });

  it("should reject password that is too short", () => {
    const invalidLogin = {
      email: "user@example.com",
      password: "12345",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Password must be at least 6 characters");
    }
  });

  it("should reject password that is too long", () => {
    const invalidLogin = {
      email: "user@example.com",
      password: "a".repeat(73),
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Password is too long");
    }
  });

  it("should accept password with exactly 6 characters", () => {
    const validLogin = {
      email: "user@example.com",
      password: "123456",
    };

    const result = loginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it("should accept password with exactly 72 characters", () => {
    const validLogin = {
      email: "user@example.com",
      password: "a".repeat(72),
    };

    const result = loginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it("should reject missing email", () => {
    const invalidLogin = {
      password: "password123",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });

  it("should reject missing password", () => {
    const invalidLogin = {
      email: "user@example.com",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const invalidLogin = {
      email: "",
      password: "password123",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const invalidLogin = {
      email: "user@example.com",
      password: "",
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("should validate valid registration data", () => {
    const validRegistration = {
      email: "newuser@example.com",
      password: "password123",
      confirmPassword: "password123",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(validRegistration);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalidRegistration = {
      email: "invalid-email",
      password: "password123",
      confirmPassword: "password123",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid email format");
    }
  });

  it("should reject email that is too long", () => {
    const invalidRegistration = {
      email: `${"a".repeat(250)}@example.com`,
      password: "password123",
      confirmPassword: "password123",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Email is too long");
    }
  });

  it("should reject password that is too short", () => {
    const invalidRegistration = {
      email: "newuser@example.com",
      password: "12345",
      confirmPassword: "12345",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Password must be at least 6 characters");
    }
  });

  it("should reject password that is too long", () => {
    const invalidRegistration = {
      email: "newuser@example.com",
      password: "a".repeat(73),
      confirmPassword: "a".repeat(73),
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Password is too long");
    }
  });

  it("should reject when passwords don't match", () => {
    const invalidRegistration = {
      email: "newuser@example.com",
      password: "password123",
      confirmPassword: "differentpassword",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmPasswordError = result.error.errors.find(
        (err) => err.path[0] === "confirmPassword"
      );
      expect(confirmPasswordError?.message).toBe("Passwords don't match");
    }
  });

  it("should reject when agreedToTerms is false", () => {
    const invalidRegistration = {
      email: "newuser@example.com",
      password: "password123",
      confirmPassword: "password123",
      agreedToTerms: false,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("You must agree to the terms of service");
    }
  });

  it("should reject when agreedToTerms is missing", () => {
    const invalidRegistration = {
      email: "newuser@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
  });

  it("should accept password with exactly 6 characters", () => {
    const validRegistration = {
      email: "newuser@example.com",
      password: "123456",
      confirmPassword: "123456",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(validRegistration);
    expect(result.success).toBe(true);
  });

  it("should accept password with exactly 72 characters", () => {
    const validRegistration = {
      email: "newuser@example.com",
      password: "a".repeat(72),
      confirmPassword: "a".repeat(72),
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(validRegistration);
    expect(result.success).toBe(true);
  });

  it("should reject missing email", () => {
    const invalidRegistration = {
      password: "password123",
      confirmPassword: "password123",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
  });

  it("should reject missing password", () => {
    const invalidRegistration = {
      email: "newuser@example.com",
      confirmPassword: "password123",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
  });

  it("should reject missing confirmPassword", () => {
    const invalidRegistration = {
      email: "newuser@example.com",
      password: "password123",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const invalidRegistration = {
      email: "",
      password: "password123",
      confirmPassword: "password123",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const invalidRegistration = {
      email: "newuser@example.com",
      password: "",
      confirmPassword: "",
      agreedToTerms: true,
    };

    const result = registerSchema.safeParse(invalidRegistration);
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("should validate valid email", () => {
    const validForgotPassword = {
      email: "user@example.com",
    };

    const result = forgotPasswordSchema.safeParse(validForgotPassword);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalidForgotPassword = {
      email: "not-an-email",
    };

    const result = forgotPasswordSchema.safeParse(invalidForgotPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid email format");
    }
  });

  it("should reject email that is too long", () => {
    const invalidForgotPassword = {
      email: `${"a".repeat(250)}@example.com`,
    };

    const result = forgotPasswordSchema.safeParse(invalidForgotPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Email is too long");
    }
  });

  it("should reject missing email", () => {
    const invalidForgotPassword = {};

    const result = forgotPasswordSchema.safeParse(invalidForgotPassword);
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const invalidForgotPassword = {
      email: "",
    };

    const result = forgotPasswordSchema.safeParse(invalidForgotPassword);
    expect(result.success).toBe(false);
  });

  it("should accept email with exactly 255 characters", () => {
    // Create email that's exactly 255 characters
    // Format: localpart@domain.com
    const localPartLength = 255 - "@example.com".length;
    const validForgotPassword = {
      email: `${"a".repeat(localPartLength)}@example.com`,
    };

    const result = forgotPasswordSchema.safeParse(validForgotPassword);
    expect(result.success).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("should validate valid reset password data", () => {
    const validResetPassword = {
      password: "newpassword123",
      confirmPassword: "newpassword123",
      token: "valid-reset-token",
    };

    const result = resetPasswordSchema.safeParse(validResetPassword);
    expect(result.success).toBe(true);
  });

  it("should reject password that is too short", () => {
    const invalidResetPassword = {
      password: "12345",
      confirmPassword: "12345",
      token: "valid-reset-token",
    };

    const result = resetPasswordSchema.safeParse(invalidResetPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Password must be at least 6 characters");
    }
  });

  it("should reject password that is too long", () => {
    const invalidResetPassword = {
      password: "a".repeat(73),
      confirmPassword: "a".repeat(73),
      token: "valid-reset-token",
    };

    const result = resetPasswordSchema.safeParse(invalidResetPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Password is too long");
    }
  });

  it("should reject when passwords don't match", () => {
    const invalidResetPassword = {
      password: "newpassword123",
      confirmPassword: "differentpassword",
      token: "valid-reset-token",
    };

    const result = resetPasswordSchema.safeParse(invalidResetPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmPasswordError = result.error.errors.find(
        (err) => err.path[0] === "confirmPassword"
      );
      expect(confirmPasswordError?.message).toBe("Passwords don't match");
    }
  });

  it("should reject missing token", () => {
    const invalidResetPassword = {
      password: "newpassword123",
      confirmPassword: "newpassword123",
    };

    const result = resetPasswordSchema.safeParse(invalidResetPassword);
    expect(result.success).toBe(false);
  });

  it("should reject empty token", () => {
    const invalidResetPassword = {
      password: "newpassword123",
      confirmPassword: "newpassword123",
      token: "",
    };

    const result = resetPasswordSchema.safeParse(invalidResetPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Reset token is required");
    }
  });

  it("should accept password with exactly 6 characters", () => {
    const validResetPassword = {
      password: "123456",
      confirmPassword: "123456",
      token: "valid-reset-token",
    };

    const result = resetPasswordSchema.safeParse(validResetPassword);
    expect(result.success).toBe(true);
  });

  it("should accept password with exactly 72 characters", () => {
    const validResetPassword = {
      password: "a".repeat(72),
      confirmPassword: "a".repeat(72),
      token: "valid-reset-token",
    };

    const result = resetPasswordSchema.safeParse(validResetPassword);
    expect(result.success).toBe(true);
  });

  it("should reject missing password", () => {
    const invalidResetPassword = {
      confirmPassword: "newpassword123",
      token: "valid-reset-token",
    };

    const result = resetPasswordSchema.safeParse(invalidResetPassword);
    expect(result.success).toBe(false);
  });

  it("should reject missing confirmPassword", () => {
    const invalidResetPassword = {
      password: "newpassword123",
      token: "valid-reset-token",
    };

    const result = resetPasswordSchema.safeParse(invalidResetPassword);
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const invalidResetPassword = {
      password: "",
      confirmPassword: "",
      token: "valid-reset-token",
    };

    const result = resetPasswordSchema.safeParse(invalidResetPassword);
    expect(result.success).toBe(false);
  });
});

describe("setPasswordSchema", () => {
  it("should validate valid set password data", () => {
    const validSetPassword = {
      password: "newpassword123",
      confirmPassword: "newpassword123",
    };

    const result = setPasswordSchema.safeParse(validSetPassword);
    expect(result.success).toBe(true);
  });

  it("should reject password that is too short", () => {
    const invalidSetPassword = {
      password: "12345",
      confirmPassword: "12345",
    };

    const result = setPasswordSchema.safeParse(invalidSetPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Password must be at least 6 characters");
    }
  });

  it("should reject password that is too long", () => {
    const invalidSetPassword = {
      password: "a".repeat(73),
      confirmPassword: "a".repeat(73),
    };

    const result = setPasswordSchema.safeParse(invalidSetPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Password is too long");
    }
  });

  it("should reject when passwords don't match", () => {
    const invalidSetPassword = {
      password: "newpassword123",
      confirmPassword: "differentpassword",
    };

    const result = setPasswordSchema.safeParse(invalidSetPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmPasswordError = result.error.errors.find(
        (err) => err.path[0] === "confirmPassword"
      );
      expect(confirmPasswordError?.message).toBe("Passwords don't match");
    }
  });

  it("should accept password with exactly 6 characters", () => {
    const validSetPassword = {
      password: "123456",
      confirmPassword: "123456",
    };

    const result = setPasswordSchema.safeParse(validSetPassword);
    expect(result.success).toBe(true);
  });

  it("should accept password with exactly 72 characters", () => {
    const validSetPassword = {
      password: "a".repeat(72),
      confirmPassword: "a".repeat(72),
    };

    const result = setPasswordSchema.safeParse(validSetPassword);
    expect(result.success).toBe(true);
  });

  it("should reject missing password", () => {
    const invalidSetPassword = {
      confirmPassword: "newpassword123",
    };

    const result = setPasswordSchema.safeParse(invalidSetPassword);
    expect(result.success).toBe(false);
  });

  it("should reject missing confirmPassword", () => {
    const invalidSetPassword = {
      password: "newpassword123",
    };

    const result = setPasswordSchema.safeParse(invalidSetPassword);
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const invalidSetPassword = {
      password: "",
      confirmPassword: "",
    };

    const result = setPasswordSchema.safeParse(invalidSetPassword);
    expect(result.success).toBe(false);
  });

  it("should reject when only confirmPassword is empty", () => {
    const invalidSetPassword = {
      password: "newpassword123",
      confirmPassword: "",
    };

    const result = setPasswordSchema.safeParse(invalidSetPassword);
    expect(result.success).toBe(false);
  });
});



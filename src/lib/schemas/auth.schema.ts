import { z } from "zod";

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email is too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
});

/**
 * Registration request validation schema
 */
export const registerSchema = z
  .object({
    email: z.string().email("Invalid email format").max(255, "Email is too long"),
    password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
    confirmPassword: z.string(),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms of service",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Forgot password request validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email is too long"),
});

/**
 * Reset password request validation schema
 */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
    confirmPassword: z.string(),
    token: z.string().min(1, "Reset token is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Set password request validation schema (for auto-provisioned participants)
 */
export const setPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginDTO = z.infer<typeof loginSchema>;
export type RegisterDTO = z.infer<typeof registerSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
export type SetPasswordDTO = z.infer<typeof setPasswordSchema>;

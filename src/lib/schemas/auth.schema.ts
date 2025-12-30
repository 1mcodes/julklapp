import { z } from "zod";

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Registration validation schema
 */
export const registerSchema = z
  .object({
    email: z.string().email("Invalid email format").max(255),
    password: z.string().min(6).max(72),
    confirmPassword: z.string(),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6).max(72),
    confirmPassword: z.string(),
    token: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

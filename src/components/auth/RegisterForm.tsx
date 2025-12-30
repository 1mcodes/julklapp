import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    form?: string;
  }>({});
  const emailRef = useRef<HTMLInputElement>(null);

  // Auto-focus on email input when component mounts
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-zA-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Medium", color: "bg-yellow-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  };

  const passwordRequirements = {
    minLength: password.length >= 6,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const validateForm = (): boolean => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the terms of service";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Call registration API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          agreedToTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific errors
        if (data.details) {
          // Map field-level validation errors
          const fieldErrors: { email?: string; password?: string; confirmPassword?: string; terms?: string } = {};
          data.details.forEach((err: { field: string; message: string }) => {
            if (err.field === "email") fieldErrors.email = err.message;
            if (err.field === "password") fieldErrors.password = err.message;
            if (err.field === "confirmPassword") fieldErrors.confirmPassword = err.message;
            if (err.field === "agreedToTerms") fieldErrors.terms = err.message;
          });
          setErrors(fieldErrors);
        }
        throw new Error(data.message || "Registration failed");
      }

      // Show success message
      toast.success(data.message || "Account created successfully!");

      // Redirect to dashboard after short delay
      setTimeout(() => {
        window.location.href = "/dashboard/created";
      }, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      toast.error(errorMessage);

      // Only set form error if we don't have field-level errors
      if (!errors.email && !errors.password && !errors.confirmPassword && !errors.terms) {
        setErrors({ form: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email *
        </label>
        <Input
          ref={emailRef}
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: undefined });
          }}
          onBlur={() => {
            if (email && !validateEmail(email)) {
              setErrors({ ...errors, email: "Invalid email format" });
            }
          }}
          placeholder="Enter your email"
          className={errors.email ? "border-red-500" : ""}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-600" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password *
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors({ ...errors, password: undefined });
          }}
          placeholder="Enter your password"
          className={errors.password ? "border-red-500" : ""}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error password-requirements" : "password-requirements"}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-red-600" role="alert">
            {errors.password}
          </p>
        )}

        {/* Password Strength Indicator */}
        {password && passwordStrength && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">{passwordStrength.label}</span>
            </div>
          </div>
        )}

        {/* Password Requirements */}
        <div id="password-requirements" className="space-y-1">
          <p className="text-xs text-gray-600">Password must contain:</p>
          <ul className="space-y-1">
            <li className="flex items-center gap-2 text-xs">
              {passwordRequirements.minLength ? (
                <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
              ) : (
                <X className="h-3 w-3 text-gray-400" aria-hidden="true" />
              )}
              <span className={passwordRequirements.minLength ? "text-green-700" : "text-gray-600"}>
                At least 6 characters
              </span>
            </li>
            <li className="flex items-center gap-2 text-xs">
              {passwordRequirements.hasLetter ? (
                <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
              ) : (
                <X className="h-3 w-3 text-gray-400" aria-hidden="true" />
              )}
              <span className={passwordRequirements.hasLetter ? "text-green-700" : "text-gray-600"}>
                At least one letter
              </span>
            </li>
            <li className="flex items-center gap-2 text-xs">
              {passwordRequirements.hasNumber ? (
                <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
              ) : (
                <X className="h-3 w-3 text-gray-400" aria-hidden="true" />
              )}
              <span className={passwordRequirements.hasNumber ? "text-green-700" : "text-gray-600"}>
                At least one number
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
          Confirm Password *
        </label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
          }}
          onBlur={() => {
            if (confirmPassword && password !== confirmPassword) {
              setErrors({ ...errors, confirmPassword: "Passwords don't match" });
            }
          }}
          placeholder="Confirm your password"
          className={errors.confirmPassword ? "border-red-500" : ""}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
        />
        {errors.confirmPassword && (
          <p id="confirm-password-error" className="text-sm text-red-600" role="alert">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Terms of Service Checkbox */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => {
              setAgreedToTerms(e.target.checked);
              if (errors.terms) setErrors({ ...errors, terms: undefined });
            }}
            disabled={isSubmitting}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-required="true"
            aria-invalid={!!errors.terms}
            aria-describedby={errors.terms ? "terms-error" : undefined}
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the{" "}
            <a href="/terms" className="text-blue-600 hover:text-blue-700 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>
        {errors.terms && (
          <p id="terms-error" className="text-sm text-red-600" role="alert">
            {errors.terms}
          </p>
        )}
      </div>

      {/* Form Error with ARIA live region */}
      <div aria-live="polite" aria-atomic="true">
        {errors.form && (
          <div className="rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-800">{errors.form}</p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2"
        aria-describedby={isSubmitting ? "submit-status" : undefined}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </Button>

      {/* Screen reader status for form submission */}
      {isSubmitting && (
        <div id="submit-status" className="sr-only" aria-live="assertive">
          Creating account, please wait...
        </div>
      )}

      {/* Login Link */}
      <div className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
          Log in
        </a>
      </div>
    </form>
  );
};

export default RegisterForm;

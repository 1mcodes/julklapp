import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; form?: string }>({});
  const emailRef = useRef<HTMLInputElement>(null);

  // Auto-focus on email input when component mounts
  useEffect(() => {
    if (emailRef.current && !isSuccess) {
      emailRef.current.focus();
    }
  }, [isSuccess]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
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
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: email.trim().toLowerCase() }),
      // });

      // const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.message || 'Failed to send reset link');
      // }

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSuccess(true);
      toast.success("Password reset link sent!");
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Failed to send reset link. Please try again.",
      });
      toast.error("Failed to send reset link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-green-50 p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">Check Your Email</h3>
          <p className="text-sm text-green-800">
            If an account exists with that email, you&apos;ll receive a password reset link shortly.
          </p>
        </div>

        <Button type="button" onClick={() => (window.location.href = "/login")} className="w-full" variant="outline">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Instructional Text */}
      <p className="text-sm text-gray-600">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

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
        {isSubmitting ? "Sending..." : "Send Reset Link"}
      </Button>

      {/* Screen reader status for form submission */}
      {isSubmitting && (
        <div id="submit-status" className="sr-only" aria-live="assertive">
          Sending reset link, please wait...
        </div>
      )}

      {/* Back to Login Link */}
      <div className="text-center text-sm text-gray-600">
        <a href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
          Back to Login
        </a>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;

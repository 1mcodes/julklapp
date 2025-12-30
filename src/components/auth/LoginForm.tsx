import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LoginFormProps {
  redirectUrl?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ redirectUrl = "/dashboard/created" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
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

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

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
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      // });

      // const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.message || 'Login failed');
      // }

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Logged in successfully!");

      // TODO: Handle requiresPasswordSetup flag
      // if (data.requiresPasswordSetup) {
      //   window.location.href = '/set-password';
      // } else {
      //   window.location.href = redirectUrl;
      // }

      // For now, just redirect
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Invalid email or password",
      });
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-red-600" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      {/* Forgot Password Link */}
      <div className="flex justify-end">
        <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
          Forgot password?
        </a>
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
        {isSubmitting ? "Logging in..." : "Log In"}
      </Button>

      {/* Screen reader status for form submission */}
      {isSubmitting && (
        <div id="submit-status" className="sr-only" aria-live="assertive">
          Logging in, please wait...
        </div>
      )}

      {/* Registration Link */}
      <div className="text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <a href="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
          Register
        </a>
      </div>
    </form>
  );
};

export default LoginForm;

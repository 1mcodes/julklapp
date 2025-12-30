import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface SetPasswordFormProps {
  userName?: string;
}

const SetPasswordForm: React.FC<SetPasswordFormProps> = ({ userName }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const passwordRef = useRef<HTMLInputElement>(null);

  // Auto-focus on password input when component mounts
  useEffect(() => {
    if (passwordRef.current) {
      passwordRef.current.focus();
    }
  }, []);

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
      password?: string;
      confirmPassword?: string;
    } = {};

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
      // const response = await fetch('/api/auth/set-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ password, confirmPassword }),
      // });

      // const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.message || 'Failed to set password');
      // }

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Password set successfully!");

      // Redirect to participated draws
      setTimeout(() => {
        window.location.href = "/dashboard/participated";
      }, 500);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Failed to set password. Please try again.",
      });
      toast.error("Failed to set password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome{userName ? `, ${userName}` : ""}!
        </h2>
        <p className="text-sm text-gray-600">
          Please set your password to continue and access your Secret Santa match.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password *
          </label>
          <Input
            ref={passwordRef}
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
          {isSubmitting ? "Setting Password..." : "Set Password"}
        </Button>

        {/* Screen reader status for form submission */}
        {isSubmitting && (
          <div id="submit-status" className="sr-only" aria-live="assertive">
            Setting password, please wait...
          </div>
        )}
      </form>
    </div>
  );
};

export default SetPasswordForm;


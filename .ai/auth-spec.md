# Authentication Architecture Specification - JulklApp

## Executive Summary

This specification defines the authentication architecture for JulklApp, covering user registration, login, logout, and password recovery for both draw authors and participants. The implementation leverages Supabase Auth integrated with Astro's server-side rendering capabilities, ensuring secure session management, proper cookie handling, and seamless user experience while maintaining compatibility with existing application functionality.

## Terminology

To avoid confusion throughout this document, the following terms are defined:

- **Draw Creation**: The initial step where an author creates a draw record and enters participant details (name, surname, email, gift preferences). No matching or provisioning happens at this stage.
- **Performing the Draw/Match**: The execution of the matching algorithm via `POST /api/draws/{drawId}/match`. This is when pairings are generated, participants are provisioned, and matches are saved.
- **Completed Draw**: A draw where the matching algorithm has been successfully executed, participants have been provisioned, and matches exist.
- **Participant Provisioning**: The creation of Supabase authentication accounts for participants who don't already have user accounts. This happens during matching execution, not draw creation.
- **Draw Author**: The user who creates and manages a draw. Has role='author' in user metadata.
- **Draw Participant**: A user who is assigned to give a gift in a draw. Has role='participant' in user metadata.

---

## 1. USER INTERFACE ARCHITECTURE

### 1.1 New Authentication Pages

#### 1.1.1 Login Page (`/login`)

**Purpose**: Unified authentication entry point for both draw authors and participants.

**Location**: `src/pages/login.astro`

**Visual Design**:

- Centered card layout with gradient background (consistent with Welcome page aesthetic)
- Application name at the top (JulklApp)
- Email and password input fields
- "Remember me" checkbox (optional)
- Primary CTA button: "Log In"
- Secondary link: "Don't have an account? Register"
- Tertiary link: "Forgot password?"
- Toast notifications for success/error states

**Astro Page Responsibilities**:

- Server-side session check: redirect authenticated users to `/dashboard/created`
- Accept `redirect` query parameter to return users after auth (e.g., `/login?redirect=/dashboard/draws/123`)
- Handle POST form submission server-side for progressive enhancement
- Render client-side React form for enhanced UX with real-time validation
- Manage authentication flow with Supabase Auth
- Set secure HTTP-only cookies for session management
- Handle CSRF protection via form tokens

**Client Component**: `LoginForm` (React)

- **Props**: `redirectUrl?: string`
- **State**: `{ email, password, isSubmitting, errors }`
- **Validation**:
  - Email: required, valid email format
  - Password: required, min 6 characters
- **Error Messages**:
  - "Invalid email or password" (401)
  - "Account not found" (404)
  - "Too many attempts. Please try again later." (429)
  - "Service temporarily unavailable" (503)
- **Interactions**:
  - Form submission with client-side validation
  - Disable form during submission
  - Display field-level and form-level errors
  - Success: redirect to `redirectUrl` or `/dashboard/created`
  - Auto-focus on email field on mount

**Key Scenarios**:

1. **First-time author login**: Redirect to `/dashboard/created`
2. **Participant login**: Check if password is set; if not, redirect to `/set-password`; otherwise redirect to `/dashboard/created`
3. **Invalid credentials**: Display error message with retry option
4. **Locked account**: Display error with contact support message
5. **Unauthenticated API access**: Redirect to `/login?redirect={currentPath}`

---

#### 1.1.2 Registration Page (`/register`)

**Purpose**: Allow new draw authors to create accounts.

**Location**: `src/pages/register.astro`

**Visual Design**:

- Similar layout to login page for consistency
- Fields: Email, Password, Confirm Password
- Password strength indicator
- Terms of service checkbox
- Primary CTA: "Create Account"
- Secondary link: "Already have an account? Log in"

**Astro Page Responsibilities**:

- Server-side session check: redirect authenticated users
- Handle POST submission with Supabase Auth signup
- Send email verification (optional for MVP)
- Create user record with role='author'
- Set session cookies
- Redirect to `/dashboard/created` with success toast

**Client Component**: `RegisterForm` (React)

- **Props**: None
- **State**: `{ email, password, confirmPassword, agreedToTerms, isSubmitting, errors }`
- **Validation**:
  - Email: required, valid format, not already registered
  - Password: required, min 6 chars, meets strength requirements
  - Confirm Password: must match password
  - Terms: must be checked
- **Error Messages**:
  - "Email already in use"
  - "Password too weak"
  - "Passwords don't match"
  - "You must agree to the terms"
  - "Registration failed. Please try again."
- **Password Requirements Display**:
  - Min 6 characters ✓/✗
  - At least one letter ✓/✗
  - At least one number ✓/✗

---

#### 1.1.3 Forgot Password Page (`/forgot-password`)

**Purpose**: Initiate password reset for users who forgot their credentials.

**Location**: `src/pages/forgot-password.astro`

**Visual Design**:

- Simple single-field form
- Instructional text: "Enter your email address and we'll send you a link to reset your password"
- Email input field
- Primary CTA: "Send Reset Link"
- Secondary link: "Back to Login"

**Astro Page Responsibilities**:

- Handle POST submission
- Call Supabase Auth password reset with redirect to `/reset-password`
- Always show success message (security: don't reveal if email exists)
- Rate limit: max 3 requests per hour per IP

**Client Component**: `ForgotPasswordForm` (React)

- **Props**: None
- **State**: `{ email, isSubmitting, isSuccess, errors }`
- **Validation**: Email required and valid format
- **Success State**:
  - Display: "If an account exists with that email, you'll receive a password reset link shortly"
  - Show "Back to Login" button
- **Error Messages**: Generic error for API failures

---

#### 1.1.4 Reset Password Page (`/reset-password`)

**Purpose**: Allow users to set a new password via email link.

**Location**: `src/pages/reset-password.astro`

**Visual Design**:

- Password and Confirm Password fields
- Password strength indicator
- Primary CTA: "Reset Password"
- Error state for expired/invalid tokens

**Astro Page Responsibilities**:

- Extract and validate reset token from URL hash (`#access_token=...`)
- If token invalid/expired: show error and link to `/forgot-password`
- Handle POST submission to update password
- Clear session and redirect to `/login` with success message

**Client Component**: `ResetPasswordForm` (React)

- **Props**: `{ token: string }`
- **State**: `{ password, confirmPassword, isSubmitting, errors }`
- **Validation**: Same as registration password validation
- **Error Messages**:
  - "Link expired. Request a new one."
  - "Invalid reset link"
  - "Passwords don't match"
  - "Password too weak"

---

#### 1.1.5 Set Password Page (`/set-password`)

**Purpose**: Force participants to set password on first login (auto-provisioned accounts).

**Location**: `src/pages/set-password.astro`

**Visual Design**:

- Welcoming message: "Welcome! Please set your password to continue"
- Display participant name
- Password and Confirm Password fields
- Password strength indicator
- Primary CTA: "Set Password"

**Astro Page Responsibilities**:

- Require authenticated session
- Check if user already has password set; if yes, redirect to `/dashboard/participated`
- Handle POST submission to update password
- Redirect to `/dashboard/participated` on success

**Client Component**: `SetPasswordForm` (React)

- Similar to `ResetPasswordForm` but with different context

---

### 1.2 Updates to Existing Pages

#### 1.2.1 Welcome Page (`/`)

**Changes**:

- Add authentication check at the top
- If authenticated: redirect to `/dashboard/created`
- Add visible CTA buttons:
  - "Get Started" → `/register`
  - "Log In" → `/login`

**Implementation**:

```astro
---
// src/pages/index.astro
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect("/dashboard/created");
}
---
```

---

#### 1.2.2 Dashboard Pages

**All Dashboard Routes** (`/dashboard/*`):

- Add authentication middleware check
- Extract user from session
- Verify user role (author vs participant)
- Redirect unauthenticated users to `/login?redirect={currentPath}`

**Dashboard Layout** (`src/layouts/dashboard/DashboardLayout.astro`):

- **Add User Menu Component** (top-right corner):
  - Display user email or name
  - Dropdown menu:
    - "Account Settings" (future)
    - "Log Out"
  - Logout: POST to `/api/auth/logout` then redirect to `/`

**Created Draws Page** (`/dashboard/created`):

- Remove `mockUserId` constant
- Extract `userId` from authenticated session
- Pass real `userId` to `CreatedDrawsView` component
- Add auth check with redirect

**Create Draw Page** (`/dashboard/create`):

- Add auth check
- Pass authenticated user ID to API

**Participated Draws Page** (`/dashboard/participated`):

- New page for participants to view their matches
- Auth check with participant role verification
- Display list of draws user is participating in

---

### 1.3 Component Architecture

#### 1.3.1 Separation of Responsibilities

**Astro Pages** (`.astro` files):

- Server-side rendering
- Session validation via `Astro.locals.supabase.auth.getSession()`
- Route protection and redirects
- Initial data fetching
- Progressive enhancement fallback (handle native form POST)

**React Components** (`.tsx` files):

- Client-side interactivity
- Real-time form validation
- State management
- XHR submissions with better UX
- Optimistic updates
- Error recovery UI

**Example Pattern**:

```astro
---
// src/pages/login.astro
import Layout from "../layouts/Layout.astro";
import { LoginForm } from "../components/auth/LoginForm";

export const prerender = false;

// Server-side auth check
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect("/dashboard/created");
}

// Handle progressive enhancement (native form POST)
if (Astro.request.method === "POST") {
  const formData = await Astro.request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  // Validation and auth logic...
}

const redirectUrl = Astro.url.searchParams.get("redirect") || "/dashboard/created";
---

<Layout title="Log In">
  <LoginForm client:load redirectUrl={redirectUrl} />
</Layout>
```

---

### 1.4 Validation and Error Handling

#### 1.4.1 Client-Side Validation

**Timing**: On blur and on submit

**Email Validation**:

- Required
- Valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Max length: 255 characters

**Password Validation**:

- Required
- Min length: 6 characters
- Max length: 72 characters (bcrypt limit)
- Optional strength requirements:
  - At least one letter
  - At least one number

**Real-Time Feedback**:

- Field-level error messages below inputs
- Red border on invalid fields
- Green checkmark on valid fields
- Password strength meter (weak/medium/strong)

#### 1.4.2 Server-Side Validation

**Always revalidate on server** even if client validation passed.

**Zod Schemas** (`src/lib/schemas/auth.schema.ts`):

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

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

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
});

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
```

#### 1.4.3 Error Messages

**Standard Error Response Format** (aligned with existing `ApiErrorResponse`):

```typescript
{
  error: string;    // Error type: "Validation Error", "Unauthorized", etc.
  message: string;  // Human-readable message
  details?: any;    // Optional field-specific errors
}
```

**HTTP Status Codes**:

- 200 OK: Success
- 400 Bad Request: Validation errors
- 401 Unauthorized: Invalid credentials
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource not found
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Unexpected errors

**User-Facing Error Messages**:

- Keep them generic for security (don't reveal if email exists)
- Provide actionable next steps
- Log detailed errors server-side for debugging

---

### 1.5 Key User Scenarios

#### Scenario 1: New Author Registration and First Draw

1. User visits `/` → clicks "Get Started"
2. Lands on `/register` → fills form → submits
3. Account created, auto-logged in, redirected to `/dashboard/created`
4. Sees empty state with "Create Your First Draw" CTA
5. Clicks → navigates to `/dashboard/create`
6. Fills draw form → submits → draw created with participants
7. Redirected to `/dashboard/draws/{drawId}/participants` (per US-013)
8. Author reviews participants, clicks "Perform Draw" button
9. Matching algorithm executes → participants are provisioned → matches are saved
10. Invitation emails sent to newly provisioned participants
11. Success message displayed to author

#### Scenario 2: Participant First Login

1. Draw author creates draw with participant email `participant@example.com`
2. Author performs the matching (executes matching algorithm)
3. System auto-provisions participant account with random password during matching
4. Email sent to participant with:
   - Login link: `/login?email=participant@example.com`
   - Temporary password (displayed in email for first-time login)
   - Welcome message and draw information
5. Participant clicks link → lands on `/login` → enters email (pre-filled) and temporary password (from email)
6. System detects no password set → redirects to `/set-password`
7. Participant sets new password → redirected to `/dashboard/participated`
8. Views assigned match and gift suggestions

#### Scenario 3: Author Forgets Password

1. User visits `/login` → clicks "Forgot password?"
2. Lands on `/forgot-password` → enters email → submits
3. Success message displayed
4. Email received with reset link: `/reset-password#access_token=...`
5. User clicks link → lands on `/reset-password` → enters new password → submits
6. Redirected to `/login` with success toast → logs in with new password

#### Scenario 4: Protected Route Access Without Auth

1. Unauthenticated user tries to visit `/dashboard/created`
2. Middleware detects no session → redirects to `/login?redirect=/dashboard/created`
3. User logs in → redirected back to `/dashboard/created`

---

## 2. BACKEND LOGIC

### 2.1 API Endpoints

#### 2.1.1 Authentication Endpoints

All endpoints under `/api/auth/*` with `export const prerender = false`.

---

##### POST `/api/auth/register`

**Purpose**: Create new author account.

**Location**: `src/pages/api/auth/register.ts`

**Request Body**:

```typescript
{
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}
```

**Validation**: Use `registerSchema`

**Process**:

1. Validate request body
2. Check rate limit (max 5 registrations per hour per IP)
3. Call `supabase.auth.signUp({ email, password })`
4. If successful, Supabase creates user in `auth.users` table
5. User metadata can include role: `{ role: 'author' }`
6. Set session cookies
7. Return user object

**Response**:

- **201 Created**: User created and authenticated
  ```typescript
  {
    user: {
      id: string;
      email: string;
      role: "author";
    }
  }
  ```
- **400 Bad Request**: Validation errors
- **409 Conflict**: Email already in use
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected error

**Notes**:

- Email verification optional for MVP (can be enabled later)
- Supabase handles password hashing automatically

---

##### POST `/api/auth/login`

**Purpose**: Authenticate user and create session.

**Location**: `src/pages/api/auth/login.ts`

**Request Body**:

```typescript
{
  email: string;
  password: string;
}
```

**Validation**: Use `loginSchema`

**Process**:

1. Validate request body
2. Call `supabase.auth.signInWithPassword({ email, password })`
3. If successful, set session cookies
4. Return user object and session info

**Response**:

- **200 OK**: Authenticated
  ```typescript
  {
    user: {
      id: string;
      email: string;
      role: 'author' | 'participant';
    },
    requiresPasswordSetup: boolean;  // true for auto-provisioned participants
  }
  ```
- **401 Unauthorized**: Invalid credentials
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected error

**Notes**:

- Check if user is participant without password set
- Return `requiresPasswordSetup: true` if applicable

---

##### POST `/api/auth/logout`

**Purpose**: End user session.

**Location**: `src/pages/api/auth/logout.ts`

**Request Body**: None

**Process**:

1. Call `supabase.auth.signOut()`
2. Clear session cookies
3. Return success

**Response**:

- **200 OK**: Logged out
  ```typescript
  {
    message: "Logged out successfully";
  }
  ```

---

##### POST `/api/auth/forgot-password`

**Purpose**: Send password reset email.

**Location**: `src/pages/api/auth/forgot-password.ts`

**Request Body**:

```typescript
{
  email: string;
}
```

**Validation**: Use `forgotPasswordSchema`

**Process**:

1. Validate request body
2. Check rate limit (max 3 requests per hour per IP)
3. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: '{SITE_URL}/reset-password' })`
4. Always return success (security: don't reveal if email exists)

**Response**:

- **200 OK**: Request processed
  ```typescript
  {
    message: "If an account exists with that email, you'll receive a password reset link shortly";
  }
  ```
- **429 Too Many Requests**: Rate limit exceeded

---

##### POST `/api/auth/reset-password`

**Purpose**: Update password with reset token.

**Location**: `src/pages/api/auth/reset-password.ts`

**Request Body**:

```typescript
{
  password: string;
  confirmPassword: string;
  token: string; // from URL hash
}
```

**Validation**: Use `resetPasswordSchema`

**Process**:

1. Validate request body
2. Verify token with `supabase.auth.verifyOtp({ token_hash: token, type: 'recovery' })`
3. If valid, call `supabase.auth.updateUser({ password })`
4. Sign out user (force re-login)
5. Return success

**Response**:

- **200 OK**: Password updated
  ```typescript
  {
    message: "Password updated successfully";
  }
  ```
- **400 Bad Request**: Invalid or expired token
- **500 Internal Server Error**: Unexpected error

---

##### POST `/api/auth/set-password`

**Purpose**: Set password for auto-provisioned participant accounts.

**Location**: `src/pages/api/auth/set-password.ts`

**Request Body**:

```typescript
{
  password: string;
  confirmPassword: string;
}
```

**Validation**: Use password validation from `resetPasswordSchema`

**Process**:

1. Verify user is authenticated
2. Check user has participant role
3. Validate request body
4. Call `supabase.auth.updateUser({ password })`
5. Update `draw_participants` table to mark password as set (optional flag)
6. Return success

**Response**:

- **200 OK**: Password set
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not a participant

---

##### GET `/api/auth/session`

**Purpose**: Get current session info (for client-side checks).

**Location**: `src/pages/api/auth/session.ts`

**Request**: None

**Process**:

1. Call `supabase.auth.getSession()`
2. If session exists, return user info
3. If not, return null

**Response**:

- **200 OK**: Session info
  ```typescript
  {
    user: {
      id: string;
      email: string;
      role: 'author' | 'participant';
    } | null
  }
  ```

---

#### 2.1.2 Updates to Existing Endpoints

**All existing API endpoints** (`/api/draws`, `/api/draws/[drawId]/*`):

**Changes Required**:

1. Uncomment authentication checks (currently marked with `// TODO`)
2. Replace `mockUserId` with `auth.uid()` from session
3. Add error response for missing/invalid authentication

**Example Pattern** (apply to all endpoints):

```typescript
// Before (mocked)
const mockUserId = "00000000-0000-0000-0000-000000000000";

// After (real auth)
const {
  data: { user },
  error: authError,
} = await locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

const userId = user.id;
```

**Files to Update**:

- `src/pages/api/draws.ts` (GET and POST)
- `src/pages/api/draws/[drawId]/participants.ts`
- `src/pages/api/draws/[drawId]/perform-draw.ts`
- Any other protected API endpoints

---

### 2.2 Middleware Updates

#### 2.2.1 Current Middleware

**File**: `src/middleware/index.ts`

**Current Implementation**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

**Issues**:

- Uses shared `supabaseClient` instance (not request-specific)
- Doesn't handle session cookies
- Doesn't create request-scoped client

---

#### 2.2.2 Updated Middleware

**Purpose**: Create request-scoped Supabase client with cookie handling.

**Updated Implementation**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create request-scoped Supabase client
  context.locals.supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      get(key) {
        return context.cookies.get(key)?.value;
      },
      set(key, value, options) {
        context.cookies.set(key, value, options);
      },
      remove(key, options) {
        context.cookies.delete(key, options);
      },
    },
  });

  return next();
});
```

**Key Changes**:

1. Import `createServerClient` from `@supabase/ssr` instead of using shared client
2. Create new client for each request with cookie handlers
3. Client automatically manages session cookies
4. Supports both reading and writing cookies

**Benefits**:

- Proper session isolation between requests
- Automatic cookie management
- Secure HTTP-only cookies
- CSRF protection

**Required Package**:

- Install: `@supabase/ssr`
- Update `package.json` dependencies

---

### 2.3 Data Models and Types

#### 2.3.1 Auth User Metadata

**Supabase `auth.users` table** (managed by Supabase):

- `id` (uuid, primary key)
- `email` (text, unique)
- `encrypted_password` (text, managed by Supabase)
- `email_confirmed_at` (timestamp, optional)
- `raw_user_meta_data` (jsonb) - store custom fields:
  ```json
  {
    "role": "author" | "participant",
    "name": "User Name",  // optional
    "password_set": true | false  // for participants
  }
  ```

---

#### 2.3.2 Updated Database Schema

**No changes needed** to existing tables (`draws`, `draw_participants`, `matches`, `ai_suggestions`).

**Existing Relationship**:

- `draws.author_id` → `auth.users.id` (already in place)
- `draw_participants.user_id` → `auth.users.id` (nullable, set after auto-provisioning)

---

#### 2.3.3 TypeScript Types

**File**: `src/types.ts` (additions)

```typescript
// Auth-related types

/**
 * User role enum matching database type
 */
export type UserRole = "author" | "participant";

/**
 * Authenticated user information
 */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  password_set?: boolean;
}

/**
 * Session information
 */
export interface SessionInfo {
  user: AuthUser | null;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

/**
 * Login request DTO
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Register request DTO
 */
export interface RegisterDTO {
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

/**
 * Forgot password request DTO
 */
export interface ForgotPasswordDTO {
  email: string;
}

/**
 * Reset password request DTO
 */
export interface ResetPasswordDTO {
  password: string;
  confirmPassword: string;
  token: string;
}

/**
 * Authentication response DTO
 */
export interface AuthResponseDTO {
  user: AuthUser;
  requiresPasswordSetup?: boolean;
}
```

**Update**: `src/env.d.ts`

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Astro.locals with typed Supabase client
declare namespace App {
  interface Locals {
    supabase: import("@supabase/supabase-js").SupabaseClient<import("./db/database.types").Database>;
  }
}
```

---

### 2.4 Input Validation Mechanism

**Strategy**: Defense in depth with client-side and server-side validation.

#### 2.4.1 Client-Side Validation

**Purpose**: Improve UX with immediate feedback.

**Implementation**:

- Use native HTML5 validation attributes (`required`, `type="email"`, `minlength`, `maxlength`)
- Enhance with custom React validation logic
- Display inline error messages
- Prevent submission if validation fails

**Timing**:

- On field blur
- On form submit attempt
- Real-time for password strength

---

#### 2.4.2 Server-Side Validation

**Purpose**: Security and data integrity.

**Implementation**: Use Zod schemas (already established pattern in codebase).

**Location**: `src/lib/schemas/auth.schema.ts`

**Pattern** (apply to all auth endpoints):

```typescript
import { loginSchema } from "../../lib/schemas/auth.schema";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate with Zod
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Invalid request data",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Proceed with business logic...
  } catch (error) {
    // Error handling...
  }
};
```

---

#### 2.4.3 Sanitization

**Input Sanitization**:

- Email: Trim whitespace, lowercase
- Password: No trimming (preserve intentional spaces)
- Names: Trim whitespace

**Output Encoding**:

- Use React's built-in XSS protection (escapes by default)
- Never use `dangerouslySetInnerHTML` for user input
- API responses are JSON (automatically safe)

---

### 2.5 Exception Handling

#### 2.5.1 API Error Handling Pattern

**Standard Pattern** (apply to all auth endpoints):

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Request parsing
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validation
    const validationResult = schema.safeParse(body);
    if (!validationResult.success) {
      // Return validation errors (detailed above)
    }

    // Business logic with error handling
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email: validationResult.data.email,
      password: validationResult.data.password,
    });

    if (error) {
      // Map Supabase error to user-friendly message
      const statusCode = error.status || 500;
      const message = mapAuthError(error);

      await LoggerService.warn("Authentication failed", {
        error: error.message,
        email: validationResult.data.email,
      });

      return new Response(
        JSON.stringify({
          error: error.name || "Authentication Error",
          message,
        }),
        { status: statusCode, headers: { "Content-Type": "application/json" } }
      );
    }

    // Success response
    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Unexpected error handling
    await LoggerService.error("Unexpected error in auth endpoint", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

---

#### 2.5.2 Error Mapping Service

**Purpose**: Map technical Supabase errors to user-friendly messages.

**Location**: `src/lib/services/auth-error.service.ts`

```typescript
import { AuthError } from "@supabase/supabase-js";

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
```

---

#### 2.5.3 Logging Strategy

**Use Existing `LoggerService`**:

- Log all authentication attempts (success and failure)
- Include: timestamp, email, IP address (if available), error details
- Don't log passwords or tokens
- Use appropriate log levels: `info`, `warn`, `error`

**Examples**:

```typescript
await LoggerService.info("User logged in successfully", { userId, email });
await LoggerService.warn("Failed login attempt", { email, reason: "invalid_credentials" });
await LoggerService.error("Unexpected error during registration", { error, stack });
```

---

### 2.6 Server-Side Rendering Updates

#### 2.6.1 SSR Configuration

**Already Configured** in `astro.config.mjs`:

```javascript
export default defineConfig({
  output: "server", // SSR enabled
  adapter: node({ mode: "standalone" }),
  // ...
});
```

**No changes needed** - SSR is already enabled.

---

#### 2.6.2 Protected Routes Pattern

**All dashboard pages need auth check**. Create reusable helper.

**Helper Function**: `src/lib/utils/auth.utils.ts`

```typescript
import type { AstroGlobal } from "astro";
import type { AuthUser } from "../../types";

/**
 * Protects a route by requiring authentication.
 * Redirects to login if not authenticated.
 *
 * @param Astro - Astro global object
 * @returns Authenticated user
 */
export async function requireAuth(Astro: AstroGlobal): Promise<AuthUser> {
  const {
    data: { user },
    error,
  } = await Astro.locals.supabase.auth.getUser();

  if (error || !user) {
    const redirectUrl = Astro.url.pathname + Astro.url.search;
    return Astro.redirect(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
  }

  return {
    id: user.id,
    email: user.email!,
    role: user.user_metadata?.role || "participant",
    name: user.user_metadata?.name,
    password_set: user.user_metadata?.password_set,
  };
}

/**
 * Protects a route by requiring author role.
 *
 * @param Astro - Astro global object
 * @returns Authenticated author user
 */
export async function requireAuthor(Astro: AstroGlobal): Promise<AuthUser> {
  const user = await requireAuth(Astro);

  if (user.role !== "author") {
    return Astro.redirect("/dashboard/participated");
  }

  return user;
}

/**
 * Protects a route by requiring participant role.
 *
 * @param Astro - Astro global object
 * @returns Authenticated participant user
 */
export async function requireParticipant(Astro: AstroGlobal): Promise<AuthUser> {
  const user = await requireAuth(Astro);

  if (user.role !== "participant") {
    return Astro.redirect("/dashboard/created");
  }

  // Check if password needs to be set
  if (!user.password_set) {
    return Astro.redirect("/set-password");
  }

  return user;
}

/**
 * Gets current session without requiring auth (returns null if not authenticated).
 *
 * @param Astro - Astro global object
 * @returns User if authenticated, null otherwise
 */
export async function getSession(Astro: AstroGlobal): Promise<AuthUser | null> {
  const {
    data: { user },
    error,
  } = await Astro.locals.supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    role: user.user_metadata?.role || "participant",
    name: user.user_metadata?.name,
    password_set: user.user_metadata?.password_set,
  };
}
```

---

#### 2.6.3 Usage in Pages

**Example**: `src/pages/dashboard/created.astro`

```astro
---
import DashboardLayout from "../../layouts/dashboard/DashboardLayout.astro";
import { CreatedDrawsView } from "../../components/CreatedDraws";
import { requireAuthor } from "../../lib/utils/auth.utils";

export const prerender = false;

// Require authentication and author role
const user = await requireAuthor(Astro);
---

<DashboardLayout title="Created Draws" activeTab="created">
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Your Created Draws</h1>
      <p class="mt-2 text-muted-foreground">View and manage all your Secret Santa draws.</p>
    </div>

    <CreatedDrawsView client:load isActive={true} userId={user.id} />
  </div>
</DashboardLayout>
```

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Integration

#### 3.1.1 Architecture Overview

**Components**:

1. **Supabase Auth Service**: Managed authentication service (handles password hashing, JWT issuance, email sending)
2. **Astro Middleware**: Creates request-scoped Supabase clients with cookie handling
3. **API Endpoints**: Wrapper endpoints for auth operations (registration, login, logout, password reset)
4. **Protected Routes**: Pages and API routes that require authentication

**Flow Diagram**:

```
User Browser
    ↓ (HTTPS Request with cookies)
Astro Middleware → Creates request-scoped Supabase client
    ↓
Astro Page/API Route → Checks session via supabase.auth.getUser()
    ↓
Supabase Auth Service → Validates JWT, returns user
    ↓
Application Logic → Processes request with authenticated user context
    ↓
Response → Sets/updates session cookies (HTTP-only, Secure, SameSite)
    ↓
User Browser
```

---

#### 3.1.2 Authentication Methods

**Supported Methods**:

1. **Email/Password**: Primary method for authors and participants
2. **Password Reset**: Email-based password recovery
3. **Auto-provisioned Accounts**: System-created accounts for participants

**Not Implemented** (out of scope):

- OAuth providers (Google, GitHub, etc.)
- Magic links
- Phone/SMS authentication
- Multi-factor authentication (MFA)

---

#### 3.1.3 Supabase Configuration

**Environment Variables** (`.env`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # for server-side operations only
```

**Supabase Dashboard Settings** (`supabase/config.toml` or Dashboard):

```toml
[auth]
site_url = "https://yourdomain.com"  # or http://localhost:3000 for dev
enable_signup = true
minimum_password_length = 6

[auth.email]
enable_signup = true
enable_confirmations = false  # set true to require email verification

[auth.email.template.password_reset]
subject = "Reset Your JulklApp Password"
# Customize email template in Supabase Dashboard
```

---

#### 3.1.4 JWT Configuration

**Token Expiry**:

- Access Token: 1 hour (default, configurable in Supabase)
- Refresh Token: 30 days (default)

**Token Refresh**:

- Handled automatically by `@supabase/ssr` client
- Client checks token expiry before requests
- Auto-refreshes if expired and refresh token valid
- Updates cookies with new tokens

**JWT Claims** (auto-managed by Supabase):

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "exp": 1234567890,
  "user_metadata": {
    "role": "author",
    "name": "User Name"
  }
}
```

---

### 3.2 Cookie Management

#### 3.2.1 Cookie Strategy

**Cookies Set by Supabase**:

1. `sb-<project-ref>-auth-token`: Access token (JWT)
2. `sb-<project-ref>-auth-token-code-verifier`: PKCE verifier for OAuth
3. `sb-<project-ref>-auth-refresh-token`: Refresh token

**Cookie Attributes**:

- `HttpOnly`: Yes (prevents JavaScript access, XSS protection)
- `Secure`: Yes in production (HTTPS only)
- `SameSite`: Lax (CSRF protection, allows navigation)
- `Path`: `/`
- `Max-Age`: Matches token expiry

**Automatic Management**:

- `@supabase/ssr` handles all cookie operations
- Cookies set via Astro's `context.cookies` API
- Middleware provides cookie handlers to Supabase client

---

#### 3.2.2 Cookie Security

**Best Practices**:

1. **HTTP-Only**: Prevents client-side JavaScript from accessing tokens (mitigates XSS)
2. **Secure Flag**: Ensures cookies only sent over HTTPS in production
3. **SameSite**: Prevents CSRF attacks
4. **Short Expiry**: Access tokens expire after 1 hour
5. **Refresh Rotation**: New refresh token issued with each use (optional, configurable)

**Production Configuration**:

```typescript
// In production, ensure HTTPS is enforced
// Set in environment or server config
const isProduction = import.meta.env.PROD;

const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // true in production
  sameSite: "lax" as const,
  path: "/",
};
```

---

### 3.3 Session Handling

#### 3.3.1 Session Creation

**During Login/Registration**:

1. User submits credentials
2. API calls `supabase.auth.signInWithPassword()` or `supabase.auth.signUp()`
3. Supabase validates credentials, generates JWT
4. JWT and refresh token returned to server
5. Server sets cookies via `@supabase/ssr` client
6. Response includes user object
7. Client redirects to dashboard

**Code Example** (`/api/auth/login.ts`):

```typescript
const { data, error } = await locals.supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  return new Response(JSON.stringify({ error: mapAuthError(error) }), {
    status: 401,
  });
}

// Cookies automatically set by middleware client
return new Response(JSON.stringify({ user: data.user }), {
  status: 200,
});
```

---

#### 3.3.2 Session Validation

**On Every Protected Request**:

1. Middleware creates Supabase client with cookie handlers
2. Page/API route calls `supabase.auth.getUser()`
3. Supabase client:
   - Reads access token from cookie
   - Validates JWT signature and expiry
   - If expired, attempts refresh with refresh token
   - If refresh successful, updates cookies
   - Returns user object or error
4. Application proceeds or redirects to login

**Code Example**:

```typescript
const {
  data: { user },
  error,
} = await Astro.locals.supabase.auth.getUser();

if (error || !user) {
  return Astro.redirect("/login?redirect=" + Astro.url.pathname);
}

// User is authenticated, proceed
```

---

#### 3.3.3 Session Termination

**Logout Process**:

1. User clicks "Log Out"
2. Client sends POST to `/api/auth/logout`
3. API calls `supabase.auth.signOut()`
4. Supabase invalidates refresh token server-side
5. Cookies deleted
6. Response returned
7. Client redirects to `/`

**Code Example** (`/api/auth/logout.ts`):

```typescript
const { error } = await locals.supabase.auth.signOut();

if (error) {
  return new Response(JSON.stringify({ error: "Logout failed" }), {
    status: 500,
  });
}

// Cookies automatically cleared by client
return new Response(JSON.stringify({ message: "Logged out successfully" }), {
  status: 200,
});
```

**Session Expiry**:

- Access token expires after 1 hour
- If refresh token also expired (after 30 days), user must re-login
- No activity timeout (optional future feature)

---

### 3.4 Protected Routes Implementation

#### 3.4.1 Page Protection

**Pattern**: Use `requireAuth()` or role-specific helpers at top of page component.

**Example - Author Route**:

```astro
---
// src/pages/dashboard/create.astro
import { requireAuthor } from "../../lib/utils/auth.utils";

export const prerender = false;

const user = await requireAuthor(Astro);
---

<DashboardLayout title="Create Draw">
  <!-- Page content -->
</DashboardLayout>
```

**Example - Participant Route**:

```astro
---
// src/pages/dashboard/participated.astro
import { requireParticipant } from "../../lib/utils/auth.utils";

export const prerender = false;

const user = await requireParticipant(Astro);
---

<DashboardLayout title="Participated Draws">
  <!-- Page content -->
</DashboardLayout>
```

---

#### 3.4.2 API Protection

**Pattern**: Check auth at beginning of every protected API endpoint.

**Example**:

```typescript
// src/pages/api/draws.ts
export const GET: APIRoute = async ({ locals }) => {
  // Authenticate
  const {
    data: { user },
    error,
  } = await locals.supabase.auth.getUser();

  if (error || !user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Proceed with business logic
  const drawService = new DrawService(locals.supabase);
  const draws = await drawService.getDrawsByAuthor(user.id);

  return new Response(JSON.stringify(draws), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

---

#### 3.4.3 Role-Based Access Control

**Authorization Strategy**:

1. **Authentication**: Verify user is logged in
2. **Role Check**: Verify user has required role
3. **Resource Ownership**: Verify user owns/has access to resource

**Example - Draw Ownership Check**:

```typescript
const drawService = new DrawService(locals.supabase);
const draw = await drawService.getDrawByIdForAuthor(drawId, user.id);

if (!draw) {
  return new Response(
    JSON.stringify({
      error: "Forbidden",
      message: "You don't have permission to access this draw",
    }),
    { status: 403 }
  );
}
```

**RLS Policies** (already implemented in migrations):

- Authors can only see/modify their own draws
- Participants can only see their own match
- Enforced at database level (defense in depth)

**Draw Immutability** (per PRD US-004):

- Once a draw is created and matching is performed, it cannot be modified or deleted
- API endpoints should reject UPDATE/DELETE operations on draws with existing matches
- Frontend should hide/disable edit and delete buttons for completed draws
- This ensures consistency and prevents disruption of participant experiences

---

### 3.5 Participant Auto-Provisioning

#### 3.5.1 Process Flow

**IMPORTANT CLARIFICATION:**

- **Draw Creation**: Author creates draw record with participant details (name, surname, email, gift preferences). NO provisioning happens at this stage.
- **Performing the Draw/Match**: Author executes the matching algorithm via POST `/api/draws/{drawId}/match`. Provisioning happens during this step.
- **Completed Draw**: After matching is successfully executed and participants are provisioned.

**During Draw Matching Execution** (not draw creation):

1. Matching algorithm generates pairings
2. For each participant, system checks if email exists in `auth.users`:
   - If yes: Link `draw_participants.user_id` to existing user
   - If no: Create new user account
3. New account creation (for participants without existing accounts):
   - Generate random secure password (32 chars, alphanumeric + special)
   - Call `supabase.auth.admin.createUser()` with service role key
   - Set `email_confirmed_at` to skip verification
   - Set `user_metadata.role = 'participant'`
   - Set `user_metadata.password_set = false`
4. Link participant record to user ID
5. Save matches to database
6. Send invitation email with temporary password to newly provisioned participants

**Rationale**: Provisioning during matching (not draw creation) ensures:

- Only draws that are actually completed (matched) create user accounts
- Cleaner separation: draw creation is data entry, matching execution is the "event completion"
- Aligns with PRD US-006: "Given a completed draw, when event ends, then participant accounts exist"

---

#### 3.5.2 Implementation

**Service**: `src/lib/services/participant-provisioning.service.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Generates a secure random password
 */
function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const length = 32;
  let password = "";

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }

  return password;
}

/**
 * Provisions a participant user account
 *
 * @param email - Participant email
 * @returns User ID and temporary password
 */
export async function provisionParticipant(email: string): Promise<{
  userId: string;
  tempPassword: string;
}> {
  // Check if user exists
  const { data: existingUser } = await adminClient.from("auth.users").select("id").eq("email", email).single();

  if (existingUser) {
    return { userId: existingUser.id, tempPassword: "" };
  }

  // Create new user
  const tempPassword = generateSecurePassword();

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, // Skip email verification
    user_metadata: {
      role: "participant",
      password_set: false,
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed to provision participant: ${error?.message}`);
  }

  return { userId: data.user.id, tempPassword };
}
```

**Integration in MatchingService**:

```typescript
// In generateMatches method, after running matching algorithm:
// This is the ACTUAL implementation location - provisioning happens during matching, not draw creation

async generateMatches(drawId: string): Promise<void> {
  // Step 1: Fetch all participants
  const { data: participants } = await this.supabase
    .from("draw_participants")
    .select("id, name, surname, email, gift_preferences, user_id")
    .eq("draw_id", drawId);

  // Step 2: Validate minimum participant count
  this.validateParticipantCount(participants.length);

  // Step 3: Run matching algorithm
  const matches = this.runMatchingAlgorithm(participants);

  // Step 4: Provision accounts for participants without user_id
  const provisionedAccounts = await this.provisionAccounts(participants);

  // Step 5: Update participant records with new user_ids
  if (provisionedAccounts.length > 0) {
    await this.updateParticipantUserIds(provisionedAccounts);
  }

  // Step 6: Save matches to database
  await this.saveMatches(drawId, matches);

  // Step 7: Send invitation emails to newly provisioned participants
  if (provisionedAccounts.length > 0) {
    for (const account of provisionedAccounts) {
      await sendParticipantInvitation(
        account.email,
        account.tempPassword,
        drawId
      );
    }
  }
}
```

---

#### 3.5.3 First-Time Password Setup

**Flow**:

1. Participant receives email with temp password
2. Logs in with email and temp password
3. System detects `password_set: false` in user metadata
4. Redirects to `/set-password`
5. Participant sets new password
6. Update `user_metadata.password_set = true`
7. Redirect to `/dashboard/participated`

**Security Considerations**:

- Temp password is single-use (force change on first login via `/set-password` flow)
- Temp password expires after 7 days (configurable via Supabase settings)
- Email delivery method:
  - **Option A (Recommended for MVP)**: Email contains both login link AND temporary password
    - Simpler user experience
    - Single communication channel
    - User can copy password from email to login form
  - **Option B (More secure, future enhancement)**: Email contains only login link with magic link/OTP
    - More secure but requires additional implementation
    - Better for production with sensitive data
- For MVP: Use Option A with clear instructions in email to change password immediately after first login

---

### 3.6 Error Handling and Edge Cases

#### 3.6.1 Authentication Errors

**Scenarios**:

1. **Invalid Credentials**: Return 401 with "Invalid email or password"
2. **Account Locked**: Return 403 with "Account locked. Contact support"
3. **Email Not Verified**: Return 403 with "Please verify your email"
4. **Session Expired**: Attempt refresh; if fails, redirect to login
5. **Network Error**: Retry with exponential backoff, show error toast

---

#### 3.6.2 Race Conditions

**Scenario**: Multiple tabs with same user session.

**Solution**:

- Supabase handles token refresh atomically
- Use broadcast channel for cross-tab communication (optional)
- Logout in one tab should invalidate all tabs

---

#### 3.6.3 Token Security

**JWT Exposure**:

- Tokens stored in HTTP-only cookies (not accessible to JS)
- Never expose tokens in URL, localStorage, or console logs
- Use HTTPS in production

**Token Revocation**:

- Refresh tokens can be revoked via `supabase.auth.signOut()`
- Consider implementing token blacklist for sensitive operations (future enhancement)

---

## 4. IMPLEMENTATION CHECKLIST

### 4.1 Phase 1: Foundation (Estimated: 2-3 days)

- [ ] Install `@supabase/ssr` package
- [ ] Update middleware to use `createServerClient` with cookie handlers
- [ ] Create auth utility helpers (`requireAuth`, `requireAuthor`, `requireParticipant`)
- [ ] Create Zod validation schemas for auth operations
- [ ] Create auth error mapping service
- [ ] Update TypeScript types in `src/types.ts`
- [ ] Update `src/env.d.ts` with `App.Locals` interface

### 4.2 Phase 2: UI Components (Estimated: 3-4 days)

- [ ] Create login page (`/login`) with form component
- [ ] Create registration page (`/register`) with form component
- [ ] Create forgot password page (`/forgot-password`) with form component
- [ ] Create reset password page (`/reset-password`) with form component
- [ ] Create set password page (`/set-password`) with form component
- [ ] Add user menu component to dashboard layout
- [ ] Update welcome page with auth check and CTAs
- [ ] Style all forms with consistent design (Tailwind + Shadcn/ui)

### 4.3 Phase 3: API Endpoints (Estimated: 2-3 days)

- [ ] Create `/api/auth/register` endpoint
- [ ] Create `/api/auth/login` endpoint
- [ ] Create `/api/auth/logout` endpoint
- [ ] Create `/api/auth/forgot-password` endpoint
- [ ] Create `/api/auth/reset-password` endpoint
- [ ] Create `/api/auth/set-password` endpoint
- [ ] Create `/api/auth/session` endpoint
- [ ] Update all existing API endpoints to use real authentication (remove mock user)

### 4.4 Phase 4: Participant Provisioning (Estimated: 2-3 days)

**CRITICAL NOTE**: Provisioning happens during matching execution, NOT during draw creation.

- [ ] Create participant provisioning service (`src/lib/services/participant-provisioning.service.ts`)
- [ ] Integrate provisioning into **matching flow** (update `MatchingService.generateMatches()`)
- [ ] Implement email invitation system (use Supabase email templates or custom email service)
- [ ] Add participant invitation email template with:
  - [ ] Welcome message and draw information
  - [ ] Login link with pre-filled email
  - [ ] Temporary password for first-time login
  - [ ] Instructions to set new password
- [ ] Update matching endpoint (`/api/draws/[drawId]/match`) to trigger email sending
- [ ] Test end-to-end flow: create draw → perform match → verify emails sent → participant login

### 4.5 Phase 5: Protected Routes (Estimated: 1-2 days)

- [ ] Add auth checks to all dashboard pages
- [ ] Update `/dashboard/created` with real user ID
- [ ] Update `/dashboard/create` with auth check
- [ ] Create `/dashboard/participated` page for participants
- [ ] Test role-based access control
- [ ] Test redirect flows with `redirect` parameter

### 4.6 Phase 6: Testing and QA (Estimated: 2-3 days)

- [ ] Manual testing of all auth flows
- [ ] Test error scenarios (invalid credentials, expired tokens, etc.)
- [ ] Test participant provisioning and first-time login
- [ ] Test password reset flow
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness testing
- [ ] Security audit (OWASP checklist)
- [ ] Load testing (rate limits, concurrent users)

### 4.7 Phase 7: Documentation and Deployment (Estimated: 1 day)

- [ ] Update README with auth setup instructions
- [ ] Document environment variables
- [ ] Create migration guide for existing development databases
- [ ] Update API documentation
- [ ] Configure Supabase production settings
- [ ] Deploy to staging environment
- [ ] Deploy to production

**Total Estimated Time**: 13-19 days (approx. 3-4 weeks for 1 developer)

---

## 5. SECURITY CONSIDERATIONS

### 5.1 Authentication Security

- **Password Storage**: Supabase uses bcrypt (handled automatically)
- **Password Policy**: Minimum 6 characters (configurable)
- **Password Strength**: Encourage strong passwords with client-side meter
- **Brute Force Protection**: Supabase has built-in rate limiting
- **Session Fixation**: New session created on login (Supabase handles)
- **Session Hijacking**: HTTP-only cookies, HTTPS in production

### 5.2 CSRF Protection

- **SameSite Cookies**: Set to `Lax` (prevents CSRF for most cases)
- **CORS Configuration**: Restrict origins in production
- **State Validation**: Supabase handles PKCE for OAuth flows

### 5.3 XSS Protection

- **Input Sanitization**: Trim and validate all inputs
- **Output Encoding**: React escapes by default
- **HTTP-Only Cookies**: Tokens not accessible to JavaScript
- **Content Security Policy**: Implement CSP headers (recommended)

### 5.4 Database Security

- **Row-Level Security**: Already implemented in migrations
- **Prepared Statements**: Supabase client uses parameterized queries
- **Least Privilege**: Use anon key for client, service key only server-side
- **Connection Pooling**: Managed by Supabase

### 5.5 HTTPS and Transport Security

- **HTTPS Enforcement**: Required in production
- **HSTS Headers**: Implement Strict-Transport-Security
- **Secure Cookies**: Set `Secure` flag in production
- **Certificate Management**: Handled by hosting provider

---

## 6. FUTURE ENHANCEMENTS

### 6.1 Phase 2 Features (Post-MVP)

- **Email Verification**: Require email confirmation on registration
- **Two-Factor Authentication**: TOTP-based MFA
- **OAuth Providers**: Google, GitHub sign-in
- **Magic Links**: Passwordless login
- **Account Deletion**: Self-service account deletion
- **Password Change**: Change password while authenticated
- **Session Management**: View and revoke active sessions
- **Account Settings**: Update email, name, preferences

### 6.2 Advanced Security

- **Audit Logging**: Track all authentication events
- **Anomaly Detection**: Detect suspicious login patterns
- **IP Whitelisting**: Restrict access by IP (for authors)
- **Device Fingerprinting**: Track and verify devices
- **Password History**: Prevent password reuse

### 6.3 UX Improvements

- **Remember Me**: Extended session duration
- **Social Login**: OAuth providers
- **Biometric Auth**: WebAuthn/FIDO2 support
- **Progressive Web App**: Offline support
- **Push Notifications**: Draw updates

---

## 7. APPENDICES

### 7.1 Environment Variables Reference

```bash
# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # server-side only, keep secret

# Production overrides
SITE_URL=https://yourdomain.com
ENABLE_EMAIL_CONFIRMATIONS=true
```

### 7.2 Supabase Dashboard Configuration

**Auth Settings**:

- Site URL: Production domain
- Redirect URLs: Whitelist all valid redirect URLs
- Email Auth: Enable
- Email Confirmations: Disable for MVP, enable later
- Password Requirements: Minimum 6 characters

**Email Templates**:

- Confirmation: Customize branding
- Password Reset: Customize with JulklApp branding
- Invitation: Create custom template for participants

**RLS Policies**: Already defined in migrations, verify in dashboard

### 7.3 API Contract Summary

| Endpoint                       | Method | Auth Required | Purpose                     |
| ------------------------------ | ------ | ------------- | --------------------------- |
| `/api/auth/register`           | POST   | No            | Create author account       |
| `/api/auth/login`              | POST   | No            | Authenticate user           |
| `/api/auth/logout`             | POST   | Yes           | End session                 |
| `/api/auth/forgot-password`    | POST   | No            | Request password reset      |
| `/api/auth/reset-password`     | POST   | No            | Reset password with token   |
| `/api/auth/set-password`       | POST   | Yes           | Set password (participants) |
| `/api/auth/session`            | GET    | No            | Get current session         |
| `/api/draws`                   | GET    | Yes           | List user's draws           |
| `/api/draws`                   | POST   | Yes           | Create draw                 |
| `/api/draws/[id]/participants` | GET    | Yes           | Get draw participants       |
| `/api/draws/[id]/perform-draw` | POST   | Yes           | Execute matching            |

### 7.4 File Structure

```
src/
├── pages/
│   ├── login.astro                    # [NEW]
│   ├── register.astro                 # [NEW]
│   ├── forgot-password.astro          # [NEW]
│   ├── reset-password.astro           # [NEW]
│   ├── set-password.astro             # [NEW]
│   ├── index.astro                    # [UPDATED]
│   ├── dashboard/
│   │   ├── created.astro              # [UPDATED]
│   │   ├── create.astro               # [UPDATED]
│   │   └── participated.astro         # [NEW]
│   └── api/
│       ├── auth/
│       │   ├── register.ts            # [NEW]
│       │   ├── login.ts               # [NEW]
│       │   ├── logout.ts              # [NEW]
│       │   ├── forgot-password.ts     # [NEW]
│       │   ├── reset-password.ts      # [NEW]
│       │   ├── set-password.ts        # [NEW]
│       │   └── session.ts             # [NEW]
│       └── draws.ts                   # [UPDATED]
├── components/
│   └── auth/
│       ├── LoginForm.tsx              # [NEW]
│       ├── RegisterForm.tsx           # [NEW]
│       ├── ForgotPasswordForm.tsx     # [NEW]
│       ├── ResetPasswordForm.tsx      # [NEW]
│       ├── SetPasswordForm.tsx        # [NEW]
│       └── UserMenu.tsx               # [NEW]
├── layouts/
│   └── dashboard/
│       └── DashboardLayout.astro      # [UPDATED]
├── lib/
│   ├── schemas/
│   │   └── auth.schema.ts             # [NEW]
│   ├── services/
│   │   ├── auth-error.service.ts      # [NEW]
│   │   └── participant-provisioning.service.ts  # [NEW]
│   └── utils/
│       └── auth.utils.ts              # [NEW]
├── middleware/
│   └── index.ts                       # [UPDATED]
├── db/
│   ├── supabase.client.ts             # [EXISTING]
│   └── database.types.ts              # [EXISTING]
└── types.ts                           # [UPDATED]
```

---

## 8. ALIGNMENT WITH PRD

This section documents how this specification aligns with the Product Requirements Document and resolves any initial conflicts.

### 8.1 User Story Coverage

| User Story                                           | Status     | Implementation Notes                                                  |
| ---------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| US-001: Author registration and login                | ✅ Covered | Sections 1.1.1, 1.1.2, 2.1.1                                          |
| US-002: Create Secret Santa draw                     | ✅ Covered | Existing functionality, auth check added                              |
| US-003: Input participant details                    | ✅ Covered | Existing functionality, auth check added                              |
| US-004: Prohibit draw modifications                  | ✅ Covered | Section 3.4.3, requires frontend + API enforcement                    |
| US-005: Perform matching algorithm                   | ✅ Covered | Existing functionality, auth check added                              |
| US-006: Auto-provision participants                  | ✅ Covered | Section 3.5, **clarified timing: during matching, not draw creation** |
| US-007: Participant password setup                   | ✅ Covered | Section 1.1.5, 3.5.3                                                  |
| US-008: Participant login and view match             | ✅ Covered | Sections 1.1.1, 1.2.2                                                 |
| US-009: Generate AI gift suggestions                 | N/A        | Out of scope for auth spec                                            |
| US-010: Manual refresh AI suggestions                | N/A        | Out of scope for auth spec                                            |
| US-011: Enforce row-level security                   | ✅ Covered | Section 3.4.3                                                         |
| US-012: View created draws on default page           | ✅ Covered | Section 1.2.2                                                         |
| US-013: Redirect to draw participants after creation | ✅ Covered | Section 1.5 Scenario 1                                                |

### 8.2 Resolved Conflicts

#### 8.2.1 Participant Provisioning Timing

**Initial Conflict**: Early draft suggested provisioning during draw creation.
**Resolution**: Updated specification to align with implementation and PRD requirements:

- Provisioning happens during **matching execution** (`POST /api/draws/{drawId}/match`)
- NOT during draw creation (`POST /api/draws`)
- Rationale: Only completed draws (with matches) should create user accounts
- See Section 3.5.1 for detailed flow

#### 8.2.2 Email Invitation Timing

**Initial Conflict**: Early draft suggested sending emails during draw creation.
**Resolution**: Invitation emails are sent **after matching completes**:

- Step 7 in `MatchingService.generateMatches()`
- Only newly provisioned participants receive invitation emails
- Existing users who are added as participants don't need invitation emails
- See Section 3.5.2 for implementation details

#### 8.2.3 Terminology Clarity

**Initial Conflict**: Ambiguous use of "draw" and "draw creation"
**Resolution**: Added Terminology section with clear definitions:

- "Draw Creation" = Creating draw record with participant details
- "Performing the Draw/Match" = Executing matching algorithm
- "Completed Draw" = After matching has been performed

#### 8.2.4 Temporary Password Delivery

**Initial Conflict**: Unclear whether password is in email or separate channel.
**Resolution**: For MVP, email contains both login link AND temporary password (Section 3.5.3):

- Simpler user experience
- Single communication channel
- Future enhancement: Magic links/OTP for better security

### 8.3 PRD Functional Requirements Alignment

| Requirement                                          | Covered | Notes                                  |
| ---------------------------------------------------- | ------- | -------------------------------------- |
| FR-001: User authentication via email/password       | ✅      | Sections 1.1.1, 1.1.2                  |
| FR-002: Secure participant login with password setup | ✅      | Section 1.1.5                          |
| FR-006: Execute draw algorithm                       | ✅      | Existing, adds auth check              |
| FR-007: Auto-provision accounts after draw           | ✅      | Section 3.5, **timing clarified**      |
| FR-008: Row-level security                           | ✅      | Section 3.4.3                          |
| FR-012: Prevent draw modification after creation     | ✅      | Section 3.4.3, requires implementation |

## 9. COMPATIBILITY NOTES

### 9.1 Backward Compatibility

**Existing Features**:

- ✅ Draw creation flow unchanged
- ✅ Participant management unchanged
- ✅ Matching algorithm unchanged
- ✅ AI suggestions unchanged
- ✅ Database schema unchanged (except adding user_id to participants)
- ✅ API contracts unchanged (except adding real authentication)

**Migration Path**:

1. Development databases: Run new migrations, remove mock user policies
2. Existing mock users: Create real accounts or use service key to migrate
3. UI components: Replace mock user IDs with real authenticated user IDs

### 9.2 Breaking Changes

**None** for end-users (this is first production release).

For developers:

- Must uncomment auth checks in API endpoints
- Must remove `mockUserId` constants
- Must add `export const prerender = false` to all pages using auth

### 9.3 Database Migrations

**Required Migration**:

```sql
-- Remove mock user policies
DROP POLICY IF EXISTS mock_user_modify_draws ON draws;
DROP POLICY IF EXISTS mock_user_manage_participants ON draw_participants;
DROP POLICY IF EXISTS anon_insert_matches ON matches;
DROP POLICY IF EXISTS anon_select_matches ON matches;

-- Optional: Remove mock user
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';
```

**Location**: `supabase/migrations/20250101_remove_mock_auth.sql`

---

## 10. CONCLUSION

This specification provides a comprehensive blueprint for implementing secure, user-friendly authentication in JulklApp using Supabase Auth and Astro. The architecture leverages existing patterns in the codebase (Zod validation, service layer, API error handling) while introducing new components specifically for authentication.

Key strengths of this approach:

- **Security-first**: HTTP-only cookies, RLS policies, proper error handling
- **User experience**: Progressive enhancement, real-time validation, clear error messages
- **Maintainability**: Modular architecture, reusable helpers, consistent patterns
- **Scalability**: Supabase Auth handles heavy lifting, stateless JWT-based sessions
- **Compatibility**: Minimal changes to existing code, seamless integration

Upon implementation, JulklApp will have a production-ready authentication system that supports both draw authors and participants, with clear pathways for future enhancements such as OAuth, MFA, and advanced security features.

---

**Document Version**: 1.1  
**Last Updated**: 2025-12-30 (Aligned with PRD - see alignment report)  
**Author**: AI Development Consultant  
**Status**: Ready for Implementation  
**Changes in v1.1**:

- Clarified participant provisioning timing (during matching, not draw creation)
- Added Terminology section for clarity
- Added Section 8: Alignment with PRD
- Resolved conflicts with PRD requirements
- Updated user journey scenarios
- Clarified temporary password delivery method

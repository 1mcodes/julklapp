# UI Architecture for JulklApp

## 1. UI Structure Overview

JulklApp provides two top-level entry points:

- **/login**: unified authentication for draw authors and participants.
- **/dashboard**: a single-page dashboard built with Astro Islands. It hosts three main tab-driven sub-views—Create New Draw, Created Draws, and Participated Draws—switchable via a responsive TabNav component. Detail views extend the dashboard layout with contextual breadcrumbs.

Global UI patterns:

- Floating toasts for notifications (success and error), auto-dismiss after 6s, manual close.
- Spinners and button disabling during API calls.
- Responsive Tailwind grids and horizontal scrolling containers with edge shadows for tables.
- Breadcrumb navigation on detail pages with clickable segments (except the current segment).
- Lazy data loading per tab to reduce initial payload.
- Each Astro Island wrapped in a React ErrorBoundary with retry UI.

## 2. View List

### Login Page

- **Path**: `/login`
- **Purpose**: Authenticate authors and participants.
- **Key Information**:
  - Email input
  - Password input
  - Login button
- **Key Components**:
  - `LoginForm` (email, password, submit)
  - `ToastContainer`
- **Considerations**:
  - Inline field error messages from backend validation.
  - “Login successful” toast before redirecting to `/dashboard/participated`.
  - Focus management on initial load.
  - Password field uses `type="password"`.

### Dashboard Container

- **Path**: `/dashboard`
- **Purpose**: Hosts tab navigation and sub-views.
- **Key Information**:
  - TabNav with three tabs.
- **Key Components**:
  - `TabNav` (tabs: Create New Draw, Created Draws, Participated Draws)
  - `Breadcrumb` placeholder on root.
- **Considerations**:
  - Tabs indicate active state with accent-colored underline.
  - Keyboard accessible (arrow key navigation).

### Create New Draw

- **Path**: `/dashboard/create`
- **Purpose**: Enable authors to create a draw and add participants.
- **Key Information**:
  - Draw name
  - Dynamic list of participant entry groups (min 3, max 32)
  - For each participant: Name, Surname, Email, Gift Preferences (≤10 000 chars)
- **Key Components**:
  - `DrawForm`
  - `ParticipantFieldGroup` (add/remove controls)
  - `AddParticipantButton`, `RemoveParticipantButton`
  - `SpinnerButton` for submission
- **Considerations**:
  - Disable all inputs and show spinner on submit.
  - Inline validation errors from API.
  - Responsive two-column grid for participant fields on desktop, stacked on mobile.

### Created Draws

- **Path**: `/dashboard/created`
- **Purpose**: List draws authored by the current user.
- **Key Information**:
  - Table columns: Draw Name, Created At, Details
- **Key Components**:
  - `DrawTable`
  - `TableRow` with `DetailsButton` (icon-only)
  - `EmptyState` for no draws
- **Considerations**:
  - Horizontal scrolling with edge shadows on narrow screens.
  - Lazy load data on tab activation; show spinner.
  - Accessible table semantics (`<table>`, `<thead>`, `<tbody>`).

### Participated Draws

- **Path**: `/dashboard/participated`
- **Purpose**: List matches for the current participant.
- **Key Information**:
  - Table columns: Draw Name, Recipient Name, Details
- **Key Components**:
  - `MatchTable`
  - `TableRow` with `DetailsButton`
  - `EmptyState` if no matches
- **Considerations**:
  - Mirror Created Draws behavior for consistency.

### Draw Details (Author)

- **Path**: `/dashboard/draws/{drawId}/participants`
- **Purpose**: Show participants of a specific draw.
- **Key Information**:
  - Breadcrumb: Dashboard ▶ Created Draws ▶ {Draw Name}
  - Table: Name, Surname, Email
  - Button for executing matching algorithm
  - Info badge if draw has already matching algorithm executed successfully.
- **Key Components**:
  - `Breadcrumb`
  - `ParticipantsTable`
  - `Spinner` while loading
- **Considerations**:
  - No edit or delete actions per requirements.
  - Static rows; clickable only via Details icon on parent list.

### Match Details (Participant)

- **Path**: `/dashboard/matches/{matchId}`
- **Purpose**: Show the participant’s assigned match and gift suggestions.
- **Key Information**:
  - Breadcrumb: Dashboard ▶ Participated Draws ▶ Match Details
  - Match card: Name, Surname, Gift Preferences
  - AI suggestions list
  - “Another suggestions?” button
- **Key Components**:
  - `Breadcrumb`
  - `MatchCard`
  - `AISuggestionsList`
  - `RefreshButton`
  - `Spinner` during suggestions fetch
- **Considerations**:
  - 30 s timeout spinner; show error toast on timeout.
  - Disable Refresh button while loading.
  - Accessible labels and focus order.

### Global Error View

- **Path**: `*` (404, 500)
- **Purpose**: Display generic error or not-found.
- **Key Information**:
  - Error message
  - Button back to Dashboard or Login
- **Key Components**:
  - `ErrorMessage`
  - `PrimaryButton`
- **Considerations**:
  - Clear messaging, accessible focus trap.

## 3. User Journey Map

1. **Login**: User arrives at `/login`, submits credentials.
2. **Success Toast + Redirect**: Show “Login successful” toast, redirect to `/dashboard/participated`.
3. **Default Tab**: Participated Draws tab loads lazily; show spinner then data or empty state.
4. **View Match Details**: Click Details → `/dashboard/matches/{matchId}`, load match and suggestions.
5. **Fetch AI Suggestions**: Display existing suggestions; click “Another suggestions?” → spinner, API call, update list or error toast.
6. **Author Flow**: In Dashboard, click Created Draws tab → view list → click Create New Draw → fill form → submit → spinner → success toast → redirect to `/dashboard/draws/{drawId}` → view participant table.

## 4. Layout and Navigation Structure

- **Global Layout**: Header-less design; main content occupies full viewport.
- **Dashboard Layout**:
  - `Breadcrumb` at top
  - `TabNav` beneath breadcrumb
  - Content area below tabs
- **TabNav**:
  - Horizontal list of buttons
  - Active tab underlined in accent color
  - Responsive wrapping on narrow screens
- **Breadcrumb**:
  - Clickable segments separated by “▶”
  - Last segment is plain text

## 5. Key Components

- `LoginForm`: manages inputs, handles submission, shows inline errors.
- `ToastContainer`: renders toaster stack (max 3) with auto-dismiss and manual close.
- `TabNav`: accessible tab list with active indicator.
- `DrawForm` & `ParticipantFieldGroup`: dynamic form groups with add/remove.
- `SpinnerButton`: button with built-in spinner overlay.
- `DrawTable` / `MatchTable`: responsive tables with horizontal scroll.
- `Breadcrumb`: renders navigable path segments.
- `MatchCard` & `AISuggestionsList`: display match info and suggestions.
- `RefreshButton`: triggers AI suggestions fetch with spinner state.
- `Spinner`: global loading indicator.
- `ErrorBoundary`: wraps islands and shows retry UI.

---

This UI architecture aligns with the API endpoints for draw creation, listing, matching, and AI suggestions, covers all PRD user stories, and addresses key usability, accessibility, and error-handling considerations.

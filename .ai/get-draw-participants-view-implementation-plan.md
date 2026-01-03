# View Implementation Plan: Draw Details (Author) - Participants View

## 1. Overview

The Draw Details (Author) view displays a list of all participants for a specific draw that the authenticated author has created. This read-only view allows draw authors to review participant information including name, surname, and email. The view includes breadcrumb navigation for easy navigation back to the dashboard and created draws list.

**Key Features:**

- Display participants in a responsive table format
- Breadcrumb navigation showing the draw context
- Loading state with spinner during data fetch
- Error handling for various API error scenarios
- No edit or delete functionality (per FR-012)

## 2. View Routing

**Path:** `/dashboard/draws/[drawId]/participants`

**Dynamic Parameter:**

- `drawId` - UUID of the draw whose participants should be displayed

**Example URL:** `/dashboard/draws/550e8400-e29b-41d4-a716-446655440000/participants`

## 3. Component Structure

```
src/pages/dashboard/draws/[drawId]/participants.astro (Astro Page)
└── DashboardLayout
    └── DrawParticipantsView (React Island - client:load)
        ├── Breadcrumb
        │   └── BreadcrumbItem (multiple)
        ├── PageHeader
        ├── LoadingSpinner (conditional)
        ├── ErrorAlert (conditional)
        └── ParticipantsTable (conditional)
            └── TableRow (multiple)
```

**File Structure:**

```
src/
├── pages/
│   └── dashboard/
│       └── draws/
│           └── [drawId]/
│               └── participants.astro
├── components/
│   └── DrawParticipants/
│       ├── DrawParticipantsView.tsx
│       ├── Breadcrumb.tsx
│       └── ParticipantsTable.tsx
├── hooks/
│   └── useDrawParticipants.ts
└── types.ts (existing - no changes needed)
```

## 4. Component Details

### 4.1 DrawParticipantsView

- **Component description:** Main container component that orchestrates the entire view. It manages data fetching via a custom hook, handles loading and error states, and renders the appropriate UI based on the current state. This is the React island mounted in the Astro page.

- **Main elements:**
  - `<div>` container with responsive padding
  - `<Breadcrumb>` component for navigation
  - `<div>` page header with title and description
  - `<LoadingSpinner>` (conditional, from Lucide icons)
  - `<ErrorAlert>` (conditional, for error display)
  - `<ParticipantsTable>` (conditional, when data is loaded)

- **Handled interactions:**
  - Component mount triggers data fetch via `useDrawParticipants` hook
  - Retry button click (in error state) re-fetches data

- **Handled validation:**
  - None at this component level (validation happens in hook/API)

- **Types:**
  - `DrawParticipantsViewProps` - Component props interface
  - `ParticipantDTO[]` - Data from API
  - `DrawParticipantsState` - Hook state type

- **Props:**
  ```typescript
  interface DrawParticipantsViewProps {
    drawId: string;
    drawName?: string; // Optional, passed from Astro page if available
  }
  ```

### 4.2 Breadcrumb

- **Component description:** Navigation component displaying the hierarchical path to the current view. Allows users to navigate back to parent views. Uses accessible markup with proper ARIA attributes.

- **Main elements:**
  - `<nav>` with `aria-label="Breadcrumb"`
  - `<ol>` ordered list for semantic structure
  - `<li>` items for each breadcrumb segment
  - `<a>` links for clickable segments (Dashboard, Created Draws)
  - `<span>` for current non-clickable segment (Draw Name)
  - Separator icons (ChevronRight from Lucide)

- **Handled interactions:**
  - Click on "Dashboard" → navigates to `/dashboard`
  - Click on "Created Draws" → navigates to `/dashboard/created`
  - Current segment (Draw Name) is not clickable

- **Handled validation:** None

- **Types:**

  ```typescript
  interface BreadcrumbItem {
    label: string;
    href?: string; // undefined = current page (no link)
  }

  interface BreadcrumbProps {
    items: BreadcrumbItem[];
  }
  ```

- **Props:**
  ```typescript
  interface BreadcrumbProps {
    items: BreadcrumbItem[];
  }
  ```

### 4.3 ParticipantsTable

- **Component description:** Displays participant data in a responsive table format with proper accessibility semantics. Shows Name, Surname, and Email columns. Implements horizontal scrolling with edge shadows on narrow screens.

- **Main elements:**
  - `<div>` wrapper with overflow handling and edge shadows
  - `<table>` with proper semantic structure
  - `<thead>` with column headers (Name, Surname, Email)
  - `<tbody>` with participant rows
  - `<tr>` for each participant
  - `<td>` cells for each data field

- **Handled interactions:**
  - None (read-only table, no row interactions per requirements)

- **Handled validation:** None

- **Types:**
  - `ParticipantDTO` - Data type for each row

- **Props:**
  ```typescript
  interface ParticipantsTableProps {
    participants: ParticipantDTO[];
  }
  ```

### 4.4 ErrorAlert

- **Component description:** Displays error messages when API calls fail. Provides context about what went wrong and optionally offers a retry action.

- **Main elements:**
  - `<div>` alert container with error styling
  - Error icon (OctagonX from Lucide)
  - `<p>` error title
  - `<p>` error message description
  - `<button>` retry action (optional)

- **Handled interactions:**
  - Click on retry button triggers `onRetry` callback

- **Handled validation:** None

- **Types:**

  ```typescript
  interface ErrorAlertProps {
    title: string;
    message: string;
    onRetry?: () => void;
  }
  ```

- **Props:** See types above

## 5. Types

### 5.1 Existing Types (from `src/types.ts`)

```typescript
/**
 * DTO representing a participant in a draw.
 * Used as the response type for GET /api/draws/{drawId}/participants
 */
export type ParticipantDTO = Pick<
  Tables<"draw_participants">,
  "id" | "name" | "surname" | "email" | "gift_preferences"
>;

/**
 * DTO representing summary information for a draw.
 */
export type DrawDTO = Pick<Tables<"draws">, "id" | "name" | "created_at">;
```

### 5.2 New Types (add to `src/types.ts` or component file)

```typescript
/**
 * API error response structure returned by the backend.
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
}

/**
 * State for the draw participants view.
 */
export interface DrawParticipantsState {
  participants: ParticipantDTO[];
  drawName: string | null;
  isLoading: boolean;
  error: ApiErrorResponse | null;
}
```

### 5.3 Component Props Types

```typescript
/**
 * Props for DrawParticipantsView component.
 */
interface DrawParticipantsViewProps {
  drawId: string;
  drawName?: string;
}

/**
 * Props for Breadcrumb component.
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Props for ParticipantsTable component.
 */
interface ParticipantsTableProps {
  participants: ParticipantDTO[];
}

/**
 * Props for ErrorAlert component.
 */
interface ErrorAlertProps {
  title: string;
  message: string;
  onRetry?: () => void;
}
```

## 6. State Management

### 6.1 Custom Hook: `useDrawParticipants`

A custom hook encapsulates all data fetching logic and state management for this view.

**File:** `src/hooks/useDrawParticipants.ts`

**State Variables:**
| State Variable | Type | Initial Value | Purpose |
|---------------|------|---------------|---------|
| `participants` | `ParticipantDTO[]` | `[]` | Stores fetched participants |
| `drawName` | `string \| null` | `null` | Draw name for breadcrumb (fetched separately or passed) |
| `isLoading` | `boolean` | `true` | Indicates loading state |
| `error` | `ApiErrorResponse \| null` | `null` | Stores API error if any |

**Hook Interface:**

```typescript
interface UseDrawParticipantsReturn {
  state: DrawParticipantsState;
  actions: {
    refetch: () => Promise<void>;
  };
}

function useDrawParticipants(drawId: string): UseDrawParticipantsReturn;
```

**Hook Implementation Logic:**

1. On mount, call `fetchParticipants()` via `useEffect`
2. Set `isLoading: true` at start of fetch
3. Make API call to `/api/draws/{drawId}/participants`
4. On success: set `participants` and `isLoading: false`
5. On error: parse error response, set `error` and `isLoading: false`
6. Expose `refetch` action for retry functionality

**Note:** The draw name will need to be fetched separately or passed from the parent page. Consider adding a new endpoint or enhancing the participants endpoint to include draw metadata in the response.

## 7. API Integration

### 7.1 Endpoint Details

**Endpoint:** `GET /api/draws/{drawId}/participants`

**Request:**

- Method: GET
- Headers: `Authorization: Bearer <token>` (handled by Supabase auth)
- Path Parameter: `drawId` (UUID)

**Response Types:**

| Status | Type               | Description                    |
| ------ | ------------------ | ------------------------------ |
| 200    | `ParticipantDTO[]` | Success, array of participants |
| 400    | `ApiErrorResponse` | Invalid drawId format          |
| 401    | `ApiErrorResponse` | Not authenticated              |
| 403    | `ApiErrorResponse` | User is not draw author        |
| 404    | `ApiErrorResponse` | Draw not found                 |
| 500    | `ApiErrorResponse` | Server error                   |

**Success Response Example:**

```json
[
  {
    "id": "uuid-1",
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "gift_preferences": "Books, electronics"
  },
  {
    "id": "uuid-2",
    "name": "Jane",
    "surname": "Smith",
    "email": "jane.smith@example.com",
    "gift_preferences": "Kitchen items, art supplies"
  }
]
```

**Error Response Example:**

```json
{
  "error": "Not Found",
  "message": "Draw not found"
}
```

### 7.2 Fetch Implementation

```typescript
async function fetchParticipants(drawId: string): Promise<ParticipantDTO[]> {
  const response = await fetch(`/api/draws/${drawId}/participants`);

  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new ApiError(response.status, errorData);
  }

  return response.json();
}
```

### 7.3 Draw Name Retrieval

The current API only returns participants without draw metadata. Pass the draw name from the Astro page by fetching it server-side before rendering.

## 8. User Interactions

### 8.1 Page Load

| Step | Action                                                     | System Response                         |
| ---- | ---------------------------------------------------------- | --------------------------------------- |
| 1    | User navigates to `/dashboard/draws/{drawId}/participants` | Astro page loads                        |
| 2    | React island mounts                                        | Loading spinner displayed               |
| 3    | `useDrawParticipants` hook fetches data                    | API call made                           |
| 4a   | Success                                                    | Table renders with participant data     |
| 4b   | Error                                                      | Error alert displayed with retry option |

### 8.2 Breadcrumb Navigation

| Action                | Result                           |
| --------------------- | -------------------------------- |
| Click "Dashboard"     | Navigate to `/dashboard`         |
| Click "Created Draws" | Navigate to `/dashboard/created` |
| View current segment  | No action (non-clickable)        |

### 8.3 Error Retry

| Step | Action                  | System Response         |
| ---- | ----------------------- | ----------------------- |
| 1    | Error state displayed   | Retry button visible    |
| 2    | User clicks "Try Again" | Loading spinner shown   |
| 3    | Re-fetch API call made  | Data or error displayed |

### 8.4 Empty State

| Condition                   | Display                                    |
| --------------------------- | ------------------------------------------ |
| `participants.length === 0` | Table with message "No participants found" |

## 9. Conditions and Validation

### 9.1 URL Parameter Validation

| Condition                 | Component     | Effect               |
| ------------------------- | ------------- | -------------------- |
| `drawId` is valid UUID    | API validates | 400 error if invalid |
| `drawId` is empty/missing | Astro routing | 404 page             |

### 9.2 Authorization Validation

| Condition             | Verification            | Effect                |
| --------------------- | ----------------------- | --------------------- |
| User is authenticated | API middleware          | 401 redirect to login |
| User is draw author   | API authorization check | 403 error displayed   |

### 9.3 UI State Conditions

| State   | isLoading | error   | participants | Rendered Component              |
| ------- | --------- | ------- | ------------ | ------------------------------- |
| Loading | `true`    | `null`  | `[]`         | LoadingSpinner                  |
| Success | `false`   | `null`  | `[...]`      | ParticipantsTable               |
| Empty   | `false`   | `null`  | `[]`         | ParticipantsTable (empty state) |
| Error   | `false`   | `{...}` | `[]`         | ErrorAlert                      |

## 10. Error Handling

### 10.1 Error Scenarios

| HTTP Status | Error Type       | User Message                                | Action                           |
| ----------- | ---------------- | ------------------------------------------- | -------------------------------- |
| 400         | Bad Request      | "Invalid draw ID format"                    | Display error, no retry          |
| 401         | Unauthorized     | "Please log in to view this page"           | Redirect to `/login`             |
| 403         | Forbidden        | "You don't have access to this draw"        | Display error, link to dashboard |
| 404         | Not Found        | "Draw not found"                            | Display error, link to dashboard |
| 500         | Server Error     | "Something went wrong. Please try again."   | Display error with retry button  |
| Network     | Connection Error | "Unable to connect. Check your connection." | Display error with retry button  |

### 10.2 Error Display Implementation

```typescript
function getErrorDisplay(status: number, apiError: ApiErrorResponse) {
  switch (status) {
    case 401:
      // Redirect to login
      window.location.href = "/login";
      return null;
    case 403:
      return {
        title: "Access Denied",
        message: "You don't have permission to view this draw's participants.",
        showRetry: false,
        showDashboardLink: true,
      };
    case 404:
      return {
        title: "Draw Not Found",
        message: "The draw you're looking for doesn't exist or has been removed.",
        showRetry: false,
        showDashboardLink: true,
      };
    case 400:
      return {
        title: "Invalid Request",
        message: apiError.message,
        showRetry: false,
        showDashboardLink: true,
      };
    default:
      return {
        title: "Something Went Wrong",
        message: "We couldn't load the participants. Please try again.",
        showRetry: true,
        showDashboardLink: false,
      };
  }
}
```

### 10.3 React Error Boundary

Wrap the `DrawParticipantsView` component in an ErrorBoundary to catch unexpected React errors:

```tsx
<ErrorBoundary fallback={<ErrorFallback onRetry={refetch} />}>
  <DrawParticipantsView drawId={drawId} drawName={drawName} />
</ErrorBoundary>
```

## 11. Implementation Steps

### Step 1: Create the Astro Page

**File:** `src/pages/dashboard/draws/[drawId]/participants.astro`

1. Create the directory structure `src/pages/dashboard/draws/[drawId]/`
2. Create `participants.astro` file
3. Use `DashboardLayout` as the layout wrapper
4. Extract `drawId` from `Astro.params`
5. Optionally fetch draw details server-side for the draw name
6. Render the `DrawParticipantsView` React component with `client:load`

### Step 2: Create the Custom Hook

**File:** `src/hooks/useDrawParticipants.ts`

1. Define the `DrawParticipantsState` interface
2. Define the `UseDrawParticipantsReturn` interface
3. Implement the hook with:
   - `useState` for state management
   - `useCallback` for the fetch function
   - `useEffect` for initial data fetch
4. Handle all API response scenarios (success, various errors)
5. Export the hook

### Step 3: Create the Breadcrumb Component

**File:** `src/components/DrawParticipants/Breadcrumb.tsx`

1. Create the `BreadcrumbItem` and `BreadcrumbProps` interfaces
2. Implement accessible breadcrumb markup with `<nav>` and `<ol>`
3. Add proper ARIA attributes (`aria-label`, `aria-current`)
4. Style using Tailwind classes for responsiveness
5. Use `ChevronRight` icon from Lucide for separators

### Step 4: Create the ParticipantsTable Component

**File:** `src/components/DrawParticipants/ParticipantsTable.tsx`

1. Create the `ParticipantsTableProps` interface
2. Implement the table with semantic HTML (`<table>`, `<thead>`, `<tbody>`)
3. Add responsive wrapper with horizontal scroll and edge shadows
4. Style header and data cells with Tailwind
5. Handle empty state (no participants message)
6. Ensure accessible table semantics

### Step 5: Create the ErrorAlert Component

**File:** `src/components/DrawParticipants/ErrorAlert.tsx` (or use existing if available)

1. Create the `ErrorAlertProps` interface
2. Implement error display with icon, title, and message
3. Add optional retry button
4. Style with appropriate error colors and spacing

### Step 6: Create the Main View Component

**File:** `src/components/DrawParticipants/DrawParticipantsView.tsx`

1. Create the `DrawParticipantsViewProps` interface
2. Use the `useDrawParticipants` hook
3. Conditionally render based on state:
   - Loading state → Spinner
   - Error state → ErrorAlert
   - Success state → ParticipantsTable
4. Always render Breadcrumb and page header
5. Handle 401 redirect to login

### Step 7: Add API Error Types

**File:** `src/types.ts`

1. Add `ApiErrorResponse` interface if not already present
2. Ensure consistency with backend error format

### Step 8: Testing and Verification

1. Test happy path: authorized author views participants
2. Test error scenarios:
   - Invalid UUID in URL
   - Non-existent draw (404)
   - Unauthorized user (403)
   - Unauthenticated user (401)
   - Server error (500)
3. Test responsive design on mobile/tablet viewports
4. Verify breadcrumb navigation works correctly
5. Test keyboard accessibility (tab navigation, screen reader)
6. Test retry functionality on recoverable errors

### Step 9: Integration with Navigation

1. Update "Created Draws" table to link to this view via Details button
2. Ensure proper URL generation with `drawId`
3. Verify navigation flow from Created Draws → Draw Participants → back via breadcrumb

### Implementation Checklist

- [ ] Create Astro page at correct path
- [ ] Implement `useDrawParticipants` custom hook
- [ ] Create `Breadcrumb` component
- [ ] Create `ParticipantsTable` component
- [ ] Create `ErrorAlert` component (or reuse existing)
- [ ] Create `DrawParticipantsView` container component
- [ ] Add required type definitions
- [ ] Test all error scenarios
- [ ] Verify responsive design
- [ ] Test accessibility (keyboard, screen reader)
- [ ] Connect navigation from Created Draws list

# View Implementation Plan: Run Matching Algorithm

## 1. Overview

This view extends the existing Draw Participants view (`/dashboard/draws/{drawId}/participants`) by adding functionality to execute the Secret Santa matching algorithm. The view displays all participants in a table format and provides a prominent button to run the matching algorithm. After successful execution, it displays an informational badge indicating that matches have been created. The view handles various states including loading, error, success, and already-matched scenarios.

The matching algorithm generates one-to-one pairings where each participant gives to exactly one other participant without self-matches. The operation also provisions authentication accounts for participants who don't yet have user accounts.

## 2. View Routing

- **Path**: `/dashboard/draws/{drawId}/participants`
- **Note**: This view already exists and needs to be enhanced with matching algorithm functionality

## 3. Component Structure

```
DrawParticipantsView (Main Container)
├── Breadcrumb
├── Header Section
│   ├── Title
│   ├── Description
│   └── MatchStatusBadge (conditional)
├── MatchButton (conditional)
└── Content Section
    ├── LoadingState (Spinner)
    ├── ErrorState (Error Message + Retry)
    └── SuccessState
        └── ParticipantsTable
            ├── Table Header
            └── Table Body
                └── ParticipantRow[]
```

## 4. Component Details

### DrawParticipantsView (Enhanced)

- **Component description**: Main orchestration component that manages data fetching, matching algorithm execution, and conditional rendering based on state. It displays breadcrumb navigation, draw title, participants table, and the match execution button.

- **Main elements**:
  - `<Breadcrumb>` component for navigation
  - `<div>` container for header section with title, description, and optional `MatchStatusBadge`
  - `<Button>` component for running matching algorithm (conditionally rendered)
  - `<Spinner>` component (Loader2 icon) for loading state
  - Error display section with retry button
  - `<table>` element for participants list
  - Toast notifications via `toast()` from `sonner`

- **Handled interactions**:
  - Click "Run Matching Algorithm" button
  - Click "Try Again" button in error states
  - Toast notification close (automatic)

- **Handled validation**:
  - Verify that matches haven't already been created for this draw (check `hasMatches` state)
  - Button is disabled during loading states (`isLoading` or `isMatching`)
  - Button is hidden if matches already exist

- **Types**:
  - `DrawParticipantsViewProps`: Component props interface
  - `DrawParticipantsState`: State from custom hook (includes matching-related fields)
  - `ParticipantDTO`: Array items for table rows
  - `ApiErrorResponse`: Error response structure
  - `MessageDTO`: Success response from match endpoint

- **Props**:
  ```typescript
  interface DrawParticipantsViewProps {
    drawId: string;
    drawName?: string;
  }
  ```

### MatchStatusBadge

- **Component description**: Informational badge component that displays when matches have been successfully created for the draw. Provides visual feedback about the draw's matching status.

- **Main elements**:
  - `<div>` container with badge styling
  - Icon (CheckCircle2 from lucide-react)
  - Text label: "Matches Created"

- **Handled interactions**: None (informational only)

- **Handled validation**: None (display-only)

- **Types**:
  - No props required (stateless presentational component)

- **Props**: None

### MatchButton

- **Component description**: Action button that triggers the matching algorithm. Uses shadcn/ui Button component with primary variant. Shows loading spinner when operation is in progress.

- **Main elements**:
  - `<Button>` component (shadcn/ui)
  - Icon (Play or Loader2 from lucide-react, conditional)
  - Button text: "Run Matching Algorithm" or "Running..."

- **Handled interactions**:
  - `onClick`: Calls `actions.executeMatching()` from hook

- **Handled validation**:
  - Disabled when `isLoading || isMatching`
  - Not rendered when `hasMatches === true`

- **Types**:
  - Standard button props from shadcn/ui

- **Props**:
  ```typescript
  interface MatchButtonProps {
    onClick: () => Promise<void>;
    isLoading: boolean;
    isMatching: boolean;
  }
  ```

### ParticipantsTable (Existing)

- **Component description**: Table displaying all participants in the draw with columns for Name, Surname, and Email.

- **Main elements**:
  - `<table>` with semantic HTML structure
  - `<thead>` with column headers
  - `<tbody>` with participant rows
  - Empty state message when no participants

- **Handled interactions**: None (read-only display)

- **Handled validation**: None (display-only)

- **Types**:
  - `ParticipantDTO[]`: Array of participants

- **Props**: Receives participants array from parent state

## 5. Types

### Existing Types (from `types.ts`)

```typescript
// Already defined
export type ParticipantDTO = Pick<
  Tables<"draw_participants">,
  "id" | "name" | "surname" | "email" | "gift_preferences"
>;

export interface MessageDTO {
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}
```

### Enhanced Hook State Type

```typescript
/**
 * Enhanced state for the draw participants view with matching capabilities.
 */
export interface DrawParticipantsState {
  // Existing fields
  participants: ParticipantDTO[];
  isLoading: boolean;
  error: ApiErrorResponse | null;
  httpStatus: number | null;
  
  // New fields for matching functionality
  hasMatches: boolean;              // Indicates if matches already exist
  isMatching: boolean;              // Indicates matching operation in progress
  matchingError: ApiErrorResponse | null;  // Separate error state for matching
}
```

### Enhanced Hook Return Type

```typescript
/**
 * Return type for the enhanced useDrawParticipants hook.
 */
export interface UseDrawParticipantsReturn {
  state: DrawParticipantsState;
  actions: {
    refetch: () => Promise<void>;
    executeMatching: () => Promise<void>;  // New action
  };
}
```

### Component Props Types

```typescript
/**
 * Props for DrawParticipantsView component.
 */
export interface DrawParticipantsViewProps {
  drawId: string;
  drawName?: string;
}

/**
 * Props for MatchButton component.
 */
export interface MatchButtonProps {
  onClick: () => Promise<void>;
  isLoading: boolean;
  isMatching: boolean;
}
```

## 6. State Management

State is managed through the enhanced `useDrawParticipants` custom hook located at `src/hooks/useDrawParticipants.ts`.

### Hook State Structure

```typescript
const [state, setState] = useState<DrawParticipantsState>({
  participants: [],
  isLoading: true,
  error: null,
  httpStatus: null,
  hasMatches: false,
  isMatching: false,
  matchingError: null,
});
```

### State Flow

1. **Initial Load**:
   - `isLoading: true`
   - Fetch participants from `/api/draws/{drawId}/participants`
   - Fetch match status to check if matches exist
   - Update `participants`, `hasMatches`, and `isLoading: false`

2. **Execute Matching**:
   - Set `isMatching: true`, clear `matchingError`
   - POST to `/api/draws/{drawId}/match`
   - On success: Set `hasMatches: true`, show success toast
   - On error: Set `matchingError`, show error toast
   - Finally: Set `isMatching: false`

3. **Error Recovery**:
   - User clicks "Try Again" → calls `actions.refetch()`
   - Resets error state and re-fetches data

### Hook Actions

```typescript
const actions = {
  // Existing action - refetches participants and match status
  refetch: async () => { /* ... */ },
  
  // New action - executes matching algorithm
  executeMatching: async () => {
    setState(prev => ({ 
      ...prev, 
      isMatching: true, 
      matchingError: null 
    }));
    
    try {
      const response = await fetch(`/api/draws/${drawId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        setState(prev => ({ 
          ...prev, 
          isMatching: false, 
          matchingError: errorData 
        }));
        toast.error(errorData.message);
        return;
      }
      
      const result: MessageDTO = await response.json();
      setState(prev => ({ 
        ...prev, 
        isMatching: false, 
        hasMatches: true,
        matchingError: null 
      }));
      toast.success(result.message);
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isMatching: false,
        matchingError: {
          error: 'Network Error',
          message: 'Unable to connect. Please check your internet connection.'
        }
      }));
      toast.error('Network error occurred');
    }
  },
};
```

## 7. API Integration

### Get Participants Endpoint (Existing)

- **Method**: GET
- **Path**: `/api/draws/{drawId}/participants`
- **Request**: None (path parameter only)
- **Response Type**: `ParticipantDTO[]`
- **Success Status**: 200
- **Error Responses**:
  - 400: Invalid drawId format
  - 401: Unauthorized
  - 403: User is not the draw author
  - 404: Draw not found
  - 500: Internal server error

### Run Matching Algorithm Endpoint (New)

- **Method**: POST
- **Path**: `/api/draws/{drawId}/match`
- **Request Body**: None (empty POST)
- **Request Type**: None
- **Response Type**: `MessageDTO`
  ```typescript
  {
    message: "Matches created successfully"
  }
  ```
- **Success Status**: 200
- **Error Responses**:
  - 400: Invalid input, matches already exist, or insufficient participants
    ```typescript
    {
      error: "Bad Request",
      message: "Matches have already been generated for this draw"
    }
    // OR
    {
      error: "Bad Request", 
      message: "Insufficient participants. At least 3 participants are required for matching"
    }
    ```
  - 401: Unauthorized
    ```typescript
    {
      error: "Unauthorized",
      message: "Authentication required"
    }
    ```
  - 403: User is not the draw author
    ```typescript
    {
      error: "Forbidden",
      message: "Only the draw author can generate matches"
    }
    ```
  - 404: Draw not found
    ```typescript
    {
      error: "Not Found",
      message: "Draw not found"
    }
    ```
  - 500: Matching or provisioning failed
    ```typescript
    {
      error: "Internal Server Error",
      message: "Failed to generate matches. Please try again"
    }
    ```

### Check Match Status (Implementation Detail)

To determine if matches exist for a draw, the hook should make an additional call during initial load:

- **Method**: GET
- **Path**: `/api/draws/{drawId}/matches` (would need to be created) OR check via existing participants endpoint if it returns match status
- **Alternative**: Include `has_matches` boolean in the participants endpoint response by checking the matches table

**Recommended Approach**: Modify the existing `/api/draws/{drawId}/participants` endpoint to include match status in the response metadata:

```typescript
// Enhanced response structure (implementation detail)
interface ParticipantsWithMetadata {
  participants: ParticipantDTO[];
  has_matches: boolean;
}
```

## 8. User Interactions

### Interaction Flow

1. **Page Load**:
   - User navigates to `/dashboard/draws/{drawId}/participants`
   - Loading spinner displays while fetching participants and match status
   - Breadcrumb navigation is visible
   - Draw name displays in header

2. **View Participants (No Matches)**:
   - Participants table displays with all participant data
   - "Run Matching Algorithm" button is visible and enabled
   - No status badge is shown

3. **Click Run Matching Algorithm**:
   - User clicks the "Run Matching Algorithm" button
   - Button becomes disabled and shows "Running..." with spinner
   - POST request is made to `/api/draws/{drawId}/match`

4. **Successful Matching**:
   - Success toast appears: "Matches created successfully"
   - Toast auto-dismisses after 6 seconds
   - Button disappears
   - Status badge appears: "Matches Created" with check icon
   - UI remains functional (user can navigate away)

5. **Already Matched State**:
   - If matches already exist on page load
   - Table displays participants
   - Status badge shows "Matches Created"
   - "Run Matching Algorithm" button is not displayed

6. **Matching Error**:
   - If matching fails (e.g., 400, 403, 500 errors)
   - Error toast appears with specific error message
   - Button re-enables for retry
   - Status badge does not appear

7. **Network Error**:
   - If network request fails
   - Error toast: "Network error occurred"
   - Button re-enables for retry

8. **Insufficient Participants Error**:
   - If draw has fewer than 3 participants
   - Error toast: "Insufficient participants. At least 3 participants are required for matching"
   - Button re-enables (though clicking again will produce same error)

## 9. Conditions and Validation

### Frontend Validation Conditions

#### 1. Button Visibility
- **Condition**: `!hasMatches`
- **Component**: MatchButton
- **Effect**: Button is not rendered if matches already exist
- **Rationale**: Prevent duplicate matching operations

#### 2. Button Disabled State
- **Condition**: `isLoading || isMatching`
- **Component**: MatchButton
- **Effect**: Button is disabled and shows loading spinner
- **Rationale**: Prevent duplicate requests during ongoing operations

#### 3. Status Badge Visibility
- **Condition**: `hasMatches && !isLoading`
- **Component**: MatchStatusBadge
- **Effect**: Badge displays when matches exist and data is loaded
- **Rationale**: Provide clear visual feedback about matching status

#### 4. Participants Table Visibility
- **Condition**: `!isLoading && !error && participants.length > 0`
- **Component**: ParticipantsTable
- **Effect**: Table displays with participant data
- **Rationale**: Only show table when data is successfully loaded

#### 5. Empty State Visibility
- **Condition**: `!isLoading && !error && participants.length === 0`
- **Component**: EmptyState message in table
- **Effect**: Shows "No participants found" message
- **Rationale**: Handle edge case of draw with no participants

#### 6. Loading State
- **Condition**: `isLoading`
- **Component**: Spinner (Loader2)
- **Effect**: Spinner displays, other content hidden
- **Rationale**: Provide feedback during data fetching

#### 7. Error State with Retry
- **Condition**: `!isLoading && error && (httpStatus === 500 || httpStatus === null)`
- **Component**: Error message with "Try Again" button
- **Effect**: Displays error with retry option
- **Rationale**: Allow recovery from transient errors

#### 8. Error State without Retry
- **Condition**: `!isLoading && error && httpStatus !== 500 && httpStatus !== null`
- **Component**: Error message only (no retry button)
- **Effect**: Displays error without retry option
- **Rationale**: Don't offer retry for client errors (400, 403, 404)

### API-Level Validation (Verified at Backend)

These are enforced by the API and will return specific error responses:

1. **Authentication Required** (401)
   - User must be logged in
   - Handled by: Astro middleware

2. **Authorization Check** (403)
   - Only draw author can execute matching
   - Verified by: Comparing `draw.author_id` with `user.id`

3. **Draw Exists** (404)
   - Draw must exist in database
   - Verified by: Database query

4. **Idempotency Check** (400)
   - Matches don't already exist for this draw
   - Verified by: Checking matches table for existing draw_id

5. **Minimum Participants** (400)
   - At least 3 participants required
   - Verified by: Count validation in MatchingService

6. **Valid UUID Format** (400)
   - drawId must be valid UUID
   - Verified by: Zod schema validation

## 10. Error Handling

### Error Categories and Handling Strategy

#### 1. Network Errors
- **Scenario**: Failed to connect to API (no internet, server down)
- **Detection**: `catch` block in fetch call
- **User Feedback**: Toast notification: "Network error occurred"
- **Recovery**: Button remains enabled for retry
- **State Update**: `matchingError` set with network error message

#### 2. Validation Errors (400)
- **Scenario A - Already Matched**: Matches already exist for the draw
  - **User Feedback**: Toast: "Matches have already been generated for this draw"
  - **Recovery**: Update local state to `hasMatches: true`, hide button
  - **UI Change**: Show status badge

- **Scenario B - Insufficient Participants**: Fewer than 3 participants
  - **User Feedback**: Toast: "Insufficient participants. At least 3 participants are required for matching"
  - **Recovery**: Button remains enabled but note should be added to UI
  - **Suggestion**: Show warning before button if participant count < 3

#### 3. Authorization Errors (401, 403)
- **Scenario**: User is not authenticated or not the draw author
- **User Feedback**: Toast with specific error message from API
- **Recovery**: No retry option (redirect to login or dashboard may be appropriate)
- **State Update**: Set `matchingError` but keep current UI state

#### 4. Not Found Error (404)
- **Scenario**: Draw doesn't exist (rare - would usually fail at page load)
- **User Feedback**: Toast: "Draw not found"
- **Recovery**: Redirect to dashboard recommended
- **Implementation**: Check on button click and redirect if needed

#### 5. Server Errors (500)
- **Scenario**: Matching algorithm failed, account provisioning failed, database error
- **User Feedback**: Toast: "Failed to generate matches. Please try again"
- **Recovery**: Button remains enabled for retry
- **Logging**: Error is logged on backend for investigation

#### 6. Initial Load Errors
- **Scenario**: Failed to fetch participants on page load
- **User Feedback**: Error message in place of table
- **Recovery**: "Try Again" button that calls `actions.refetch()`
- **Special Case**: If 403/404, don't show retry (client error)

### Error Display Patterns

#### Toast Notifications (sonner)
```typescript
// Success
toast.success("Matches created successfully");

// Error with details
toast.error(errorData.message);

// Network error
toast.error("Network error occurred");
```

#### Inline Error Display
```typescript
{!state.isLoading && state.error && (
  <div className="rounded-lg border border-red-200 bg-red-50 p-6">
    <p className="font-medium text-red-800">Error loading participants</p>
    <p className="mt-1 text-sm text-red-700">{state.error.message}</p>
    {(state.httpStatus === 500 || state.httpStatus === null) && (
      <button onClick={actions.refetch}>Try Again</button>
    )}
  </div>
)}
```

### Edge Cases

1. **User clicks button multiple times rapidly**:
   - **Prevention**: Button disabled during `isMatching`
   - **Outcome**: Only one request is sent

2. **User navigates away during matching**:
   - **Handling**: Request completes in background
   - **Outcome**: State updates after user leaves (no issue)

3. **Concurrent modifications (multiple tabs)**:
   - **Prevention**: API idempotency check
   - **Outcome**: Second request returns 400 "already matched"
   - **UI Recovery**: Update state to reflect matches exist

4. **Draw has exactly 3 participants**:
   - **Handling**: This is the minimum valid count
   - **Outcome**: Matching succeeds normally

5. **Draw has 2 participants**:
   - **Prevention**: Should be prevented at draw creation
   - **Outcome**: If somehow created, API returns 400 with clear message

## 11. Implementation Steps

### Step 1: Update Types
1. Open `src/hooks/useDrawParticipants.ts`
2. Enhance `DrawParticipantsState` interface to include:
   - `hasMatches: boolean`
   - `isMatching: boolean`
   - `matchingError: ApiErrorResponse | null`
3. Update `UseDrawParticipantsReturn` interface to include `executeMatching` action

### Step 2: Enhance useDrawParticipants Hook
1. Open `src/hooks/useDrawParticipants.ts`
2. Update initial state to include new fields
3. Modify `fetchParticipants` to determine match status:
   - Option A: Add a separate API call to check match status
   - Option B: Modify backend endpoint to include match status in response
   - Recommended: Option B for efficiency
4. Implement `executeMatching` action:
   - Handle POST request to `/api/draws/{drawId}/match`
   - Manage `isMatching` state
   - Handle success and error responses
   - Update `hasMatches` on success
   - Show appropriate toast notifications
5. Add `executeMatching` to returned actions

### Step 3: Create MatchStatusBadge Component
1. Create new file: `src/components/DrawParticipants/MatchStatusBadge.tsx`
2. Implement badge component:
   - Use Tailwind classes for styling (green theme)
   - Import CheckCircle2 icon from lucide-react
   - Create badge layout: icon + text
3. Export component

### Step 4: Create MatchButton Component
1. Create new file: `src/components/DrawParticipants/MatchButton.tsx`
2. Implement button component:
   - Accept `onClick`, `isLoading`, `isMatching` props
   - Use shadcn/ui Button component
   - Show Play icon when idle, Loader2 when loading
   - Change text based on state: "Run Matching Algorithm" or "Running..."
   - Apply disabled state appropriately
3. Export component

### Step 5: Update DrawParticipantsView Component
1. Open `src/components/DrawParticipants/DrawParticipantsView.tsx`
2. Import new components:
   - `MatchStatusBadge`
   - `MatchButton`
3. Import toast from sonner (already imported in project)
4. Destructure new state fields from hook:
   - `state.hasMatches`
   - `state.isMatching`
   - `state.matchingError`
5. Destructure new action:
   - `actions.executeMatching`
6. Update header section to include:
   - Conditional MatchStatusBadge when `hasMatches && !isLoading`
7. Add MatchButton before the table section:
   - Conditionally render when `!hasMatches`
   - Pass required props
8. Update component layout for better spacing

### Step 6: Enhance Participants Endpoint (Backend)
1. Open `src/pages/api/draws/[drawId]/participants.ts`
2. Add logic to check if matches exist for the draw:
   - Query matches table: `SELECT COUNT(*) FROM matches WHERE draw_id = ?`
   - Store result as `has_matches` boolean
3. Update response structure to include match status:
   ```typescript
   return new Response(JSON.stringify({
     participants,
     has_matches: matchCount > 0
   }), { ... });
   ```
4. Update response type definition if needed

Alternative (simpler): Keep response as-is and make separate lightweight check in the hook

### Step 7: Update Hook to Handle Match Status
1. In `src/hooks/useDrawParticipants.ts`
2. If using enhanced endpoint response:
   - Update response parsing to extract `has_matches`
   - Set state accordingly
3. If using separate check:
   - Add `checkMatchStatus` function that calls match check endpoint
   - Call it after successful participants fetch
   - Update state with result

### Step 8: Add Toast Provider (If Not Present)
1. Check if `src/layouts/dashboard/DashboardLayout.astro` includes `<Toaster />`
2. If not present:
   - Import Toaster from `src/components/ui/sonner`
   - Add `<Toaster />` component to layout
3. Verify toast notifications work across the view

### Step 9: Update Styling and Accessibility
1. Review spacing and layout in `DrawParticipantsView`
2. Ensure proper ARIA labels:
   - Button has descriptive text
   - Loading states have `aria-live` regions
   - Status badge has appropriate semantic HTML
3. Test keyboard navigation:
   - Tab order is logical
   - Button is focusable and activatable via Enter/Space
4. Test screen reader announcements:
   - Loading states are announced
   - Success/error toasts are announced
   - Status badge is readable

### Step 10: Write Tests
1. Create test file: `src/hooks/useDrawParticipants.test.ts` (enhance existing)
2. Add test cases for matching functionality:
   - Initial load with no matches
   - Initial load with existing matches
   - Successful matching execution
   - Error handling (400, 403, 404, 500)
   - Network error handling
   - Button state during matching
   - State updates after matching
3. Create test file: `src/components/DrawParticipants/MatchButton.test.tsx`
4. Add test cases:
   - Renders correctly
   - Calls onClick when clicked
   - Disabled during loading
   - Shows correct icon and text
5. Update component integration tests as needed


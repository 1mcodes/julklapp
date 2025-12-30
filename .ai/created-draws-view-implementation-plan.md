# View Implementation Plan: Created Draws

## 1. Overview

The Created Draws view is a core dashboard component that displays a list of all Secret Santa draws authored by the currently authenticated user. It serves as the primary interface for authors to access and manage their created draws. The view presents draw information in a responsive table format with options to navigate to detailed participant information for each draw. When no draws exist, an empty state encourages users to create their first draw.

## 2. View Routing

**Path:** `/dashboard/created`

**Access Control:** Requires authenticated user (author role)

**Parent Layout:** Dashboard container with tab navigation

## 3. Component Structure

```
CreatedDrawsView (Astro page with React island)
├── LoadingSpinner (shown during data fetch)
├── ErrorState (shown on fetch errors with retry)
├── EmptyDrawsState (shown when no draws exist)
└── DrawsTableContainer
    ├── DrawsTable
    │   ├── TableHeader
    │   └── TableBody
    │       └── DrawTableRow (multiple instances)
    │           ├── DrawNameCell
    │           ├── CreatedAtCell
    │           └── DetailsButtonCell
    │               └── DetailsIconButton
    └── TableScrollShadows (edge indicators)
```

## 4. Component Details

### CreatedDrawsView
- **Component description:** Main container component responsible for orchestrating the entire Created Draws view. It manages data fetching, loading states, error handling, and conditional rendering of child components based on the current state. Implemented as an Astro page with a React island for interactivity.
- **Main elements:**
  - `<div>` with role="tabpanel" for accessibility
  - Conditional rendering logic based on loading, error, and data states
  - Container with proper spacing and layout
- **Handled events:**
  - Mount/activation: Triggers data fetch when component becomes visible
  - Retry: Allows user to retry fetch after error
- **Handled validation:**
  - Verifies user authentication before rendering
  - Validates API response structure before displaying
- **Types:**
  - `DrawDTO[]` - Array of draw data
  - `ViewState` - Union type: 'loading' | 'error' | 'empty' | 'success'
  - `ApiErrorResponse` - Error response structure
- **Props:**
  - `isActive: boolean` - Whether the tab is currently active (for lazy loading)
  - `userId: string` - Authenticated user ID (passed from parent)

### LoadingSpinner
- **Component description:** Simple spinner component displayed during initial data fetch or refresh operations. Provides visual feedback that content is being loaded.
- **Main elements:**
  - `<div>` with spinning animation (using Tailwind CSS)
  - Accessible loading message (screen reader only)
- **Handled events:** None
- **Handled validation:** None
- **Types:** None (presentational component)
- **Props:**
  - `message?: string` - Optional loading message (default: "Loading draws...")

### ErrorState
- **Component description:** Error display component shown when data fetching fails. Presents user-friendly error messages and provides a retry action.
- **Main elements:**
  - `<div>` container with error icon
  - Error message text
  - Retry button
- **Handled events:**
  - Click on retry button: Triggers data refetch
- **Handled validation:** None
- **Types:**
  - `ErrorType` - Union: 'auth' | 'server' | 'network' | 'unknown'
- **Props:**
  - `errorType: ErrorType` - Type of error to display appropriate message
  - `errorMessage?: string` - Optional custom error message
  - `onRetry: () => void` - Callback function to retry fetch

### EmptyDrawsState
- **Component description:** Empty state component displayed when the user has not created any draws yet. Encourages first-time action with a clear call-to-action button.
- **Main elements:**
  - `<div>` container with empty state icon/illustration
  - Heading: "No draws yet"
  - Description text: "You haven't created any draws yet. Create your first Secret Santa draw to get started."
  - Primary CTA button: "Create New Draw"
- **Handled events:**
  - Click on CTA: Navigates to Create New Draw tab
- **Handled validation:** None
- **Types:** None
- **Props:**
  - `onCreateDraw: () => void` - Callback to navigate to create draw view

### DrawsTableContainer
- **Component description:** Wrapper component that provides responsive horizontal scrolling for the draws table on narrow screens. Implements edge shadows to indicate scrollable content.
- **Main elements:**
  - Outer `<div>` with `overflow-x-auto` and position relative
  - Shadow overlays (pseudo-elements or divs) on left/right edges
  - Inner table wrapper
- **Handled events:**
  - Scroll events to toggle shadow visibility
- **Handled validation:** None
- **Types:**
  - `ScrollState` - `{ hasLeftShadow: boolean, hasRightShadow: boolean }`
- **Props:**
  - `children: ReactNode` - The table component

### DrawsTable
- **Component description:** Semantic HTML table component that displays draw information in a structured, accessible format.
- **Main elements:**
  - `<table>` with proper ARIA attributes
  - `<caption>` (visually hidden): "Your created draws"
  - `<thead>` with column headers
  - `<tbody>` containing DrawTableRow components
- **Handled events:** None (delegated to child rows)
- **Handled validation:** None
- **Types:**
  - `DrawDTO[]` - Array of draws to display
- **Props:**
  - `draws: DrawDTO[]` - List of draws to render
  - `onViewDetails: (drawId: string) => void` - Callback for details button click

### DrawTableRow
- **Component description:** Individual table row representing a single draw. Displays draw name, formatted creation date, and a details action button.
- **Main elements:**
  - `<tr>` element
  - Three `<td>` cells: name, created date, details button
- **Handled events:**
  - Click on details button: Navigates to draw participants page
- **Handled validation:** None
- **Types:**
  - `DrawRowViewModel` - Processed draw data for display
- **Props:**
  - `draw: DrawDTO` - Draw data
  - `onViewDetails: (drawId: string) => void` - Callback for details button

### DetailsIconButton
- **Component description:** Icon-only button that navigates to the draw's participant details page. Uses an accessible icon with proper ARIA labeling.
- **Main elements:**
  - `<button>` with icon (e.g., eye icon or arrow)
  - `aria-label` for accessibility
  - Hover and focus states
- **Handled events:**
  - Click: Triggers navigation to details page
- **Handled validation:** None
- **Types:** None
- **Props:**
  - `drawId: string` - Draw identifier for navigation
  - `drawName: string` - Draw name for accessible label
  - `onClick: (drawId: string) => void` - Click handler

## 5. Types

### Existing Types (from types.ts)
```typescript
// DrawDTO - Response from GET /api/draws
type DrawDTO = {
  id: string;           // UUID of the draw
  name: string;         // Name of the draw
  created_at: string;   // ISO 8601 timestamp
}

// ApiErrorResponse - Error response structure
interface ApiErrorResponse {
  error: string;        // Error type/code
  message: string;      // Human-readable error message
}
```

### New ViewModel Types

```typescript
// View state management
type ViewState = 'loading' | 'error' | 'empty' | 'success';

// Error categorization for appropriate messaging
type ErrorType = 'auth' | 'server' | 'network' | 'unknown';

// Processed draw data for table display
interface DrawRowViewModel {
  id: string;                    // Draw UUID
  name: string;                  // Draw name
  formattedDate: string;         // Human-readable date (e.g., "Dec 29, 2025")
  relativeDate: string;          // Relative time (e.g., "2 days ago")
  detailsUrl: string;            // Pre-computed URL for navigation
}

// Hook return type for data management
interface UseDrawsReturn {
  draws: DrawDTO[];              // Raw draw data from API
  viewModels: DrawRowViewModel[]; // Processed data for display
  loading: boolean;              // Loading state
  error: ErrorType | null;       // Error state
  errorMessage: string | null;   // Detailed error message
  refetch: () => Promise<void>;  // Manual refetch function
}

// Scroll shadow state
interface ScrollState {
  hasLeftShadow: boolean;        // Show left edge shadow
  hasRightShadow: boolean;       // Show right edge shadow
}
```

## 6. State Management

### Primary State Hook: `useDraws`

A custom React hook that encapsulates all data fetching, state management, and business logic for the Created Draws view.

**Location:** `src/hooks/useDraws.ts`

**Implementation details:**
- Uses React's `useState` for state management
- Uses `useEffect` for data fetching on mount
- Handles authentication via Supabase client context
- Implements retry logic for failed requests
- Transforms raw API data into ViewModels with formatted dates

**State variables managed:**
```typescript
const [draws, setDraws] = useState<DrawDTO[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<ErrorType | null>(null);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

**Functions provided:**
```typescript
const fetchDraws = async (): Promise<void> => {
  // Fetch draws from /api/draws
  // Handle authentication, errors, and state updates
}

const refetch = async (): Promise<void> => {
  // Clear error and refetch data
}

// Transform DrawDTO[] to DrawRowViewModel[]
const viewModels = useMemo(() => 
  draws.map(transformDrawToViewModel),
  [draws]
);
```

**Error handling:**
- 401 Unauthorized → ErrorType: 'auth', message: "Please log in to view your draws"
- 500 Server Error → ErrorType: 'server', message: "Failed to load draws. Please try again."
- Network errors → ErrorType: 'network', message: "Network error. Please check your connection."
- Other errors → ErrorType: 'unknown', message: "An unexpected error occurred"

### Additional State (Component-Level)

**DrawsTableContainer** manages scroll shadow state:
```typescript
const [scrollState, setScrollState] = useState<ScrollState>({
  hasLeftShadow: false,
  hasRightShadow: false
});
```

Updated via scroll event listener that checks `scrollLeft` and `scrollWidth` properties.

## 7. API Integration

### Endpoint: GET /api/draws

**Request:**
- Method: GET
- URL: `/api/draws`
- Headers: Authentication handled automatically by Supabase client
- Query parameters: None (pagination not implemented in v1)

**Request Example:**
```typescript
const response = await fetch('/api/draws', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  // Supabase auth token included automatically via middleware
});
```

**Response Type: `DrawDTO[]`**

**Success Response (200):**
```typescript
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Christmas 2025",
    "created_at": "2025-12-15T10:30:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Office Party",
    "created_at": "2025-12-20T14:20:00Z"
  }
]
```

**Error Response (401):**
```typescript
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Error Response (500):**
```typescript
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve draws"
}
```

**Integration Implementation:**

```typescript
async function fetchDraws(): Promise<DrawDTO[]> {
  try {
    const response = await fetch('/api/draws');
    
    if (response.status === 401) {
      throw new Error('AUTH_ERROR');
    }
    
    if (response.status === 500) {
      throw new Error('SERVER_ERROR');
    }
    
    if (!response.ok) {
      throw new Error('UNKNOWN_ERROR');
    }
    
    const data: DrawDTO[] = await response.json();
    return data;
    
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      throw new Error('NETWORK_ERROR');
    }
    throw error;
  }
}
```

## 8. User Interactions

### Interaction 1: View Draws List (Primary Flow)
1. **Trigger:** User clicks "Created Draws" tab in dashboard
2. **Process:**
   - Component activates (isActive = true)
   - LoadingSpinner displays
   - useDraws hook initiates API call to GET /api/draws
   - API returns DrawDTO[]
   - Hook transforms data to DrawRowViewModel[]
   - DrawsTable renders with formatted data
3. **Outcome:** User sees table with draw names, formatted dates, and details buttons

### Interaction 2: View Draw Details
1. **Trigger:** User clicks DetailsIconButton on a draw row
2. **Process:**
   - onClick handler captures drawId
   - Navigation function called: `navigate(/dashboard/draws/${drawId}/participants)`
   - Browser navigates to draw participants page
3. **Outcome:** User sees participant list for selected draw

### Interaction 3: Create First Draw (Empty State)
1. **Trigger:** User sees EmptyDrawsState (no draws exist)
2. **Process:**
   - User clicks "Create New Draw" CTA button
   - onCreateDraw callback triggers
   - Tab navigation switches to "Create New Draw" tab
3. **Outcome:** User sees draw creation form

### Interaction 4: Retry After Error
1. **Trigger:** Data fetch fails, ErrorState displays
2. **Process:**
   - User clicks "Retry" button
   - onRetry callback clears error state
   - fetchDraws function called again
   - LoadingSpinner displays during retry
   - On success: DrawsTable renders; On failure: ErrorState returns
3. **Outcome:** User either sees their draws or error persists with option to retry again

### Interaction 5: Horizontal Scroll on Mobile
1. **Trigger:** User views table on narrow screen (< 640px)
2. **Process:**
   - DrawsTableContainer enables horizontal scroll
   - User swipes/scrolls horizontally
   - Scroll event updates shadow state
   - Left shadow appears when scrolled right
   - Right shadow appears when content extends beyond viewport
3. **Outcome:** User can view all table columns with visual indicators of scrollable content

## 9. Conditions and Validation

### Authentication Check (Pre-render Condition)
- **Condition:** User must be authenticated to view this page
- **Component:** CreatedDrawsView
- **Validation method:** Check Supabase auth state in Astro middleware or component mount
- **On failure:** Redirect to /login with return URL parameter
- **Implementation:**
  ```typescript
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return redirect('/login?redirect=/dashboard/created');
  }
  ```

### Data Existence Check (Rendering Condition)
- **Condition:** Determine if draws array is empty
- **Component:** CreatedDrawsView
- **Validation method:** Check `draws.length === 0` after successful fetch
- **On true:** Render EmptyDrawsState
- **On false:** Render DrawsTable

### API Response Validation (Data Integrity)
- **Condition:** Validate response structure matches DrawDTO[]
- **Component:** useDraws hook
- **Validation method:** Runtime type checking
- **On failure:** Treat as error, show ErrorState
- **Implementation:**
  ```typescript
  function isValidDrawDTO(obj: any): obj is DrawDTO {
    return (
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      typeof obj.created_at === 'string'
    );
  }
  
  const isValidResponse = Array.isArray(data) && 
                          data.every(isValidDrawDTO);
  ```

### Scroll Shadow Visibility (UI Enhancement)
- **Condition:** Show left/right shadows based on scroll position
- **Component:** DrawsTableContainer
- **Validation method:** Check scroll metrics
- **Implementation:**
  ```typescript
  const updateShadows = (e: ScrollEvent) => {
    const target = e.target as HTMLDivElement;
    const hasLeftShadow = target.scrollLeft > 0;
    const hasRightShadow = 
      target.scrollLeft < (target.scrollWidth - target.clientWidth);
    setScrollState({ hasLeftShadow, hasRightShadow });
  };
  ```

### No Validation Required
- This is a read-only view with no form inputs
- No user input validation needed
- No data modification capabilities

## 10. Error Handling

### Error Type 1: Authentication Error (401)
- **Scenario:** User is not authenticated or session expired
- **Detection:** API returns 401 status code
- **User feedback:** ErrorState displays "Please log in to view your draws"
- **Recovery action:** 
  - "Retry" button attempts refetch (may succeed if user logs in separately)
  - Alternatively, automatic redirect to /login after 3 seconds
- **Implementation:**
  ```typescript
  if (response.status === 401) {
    setError('auth');
    setErrorMessage('Please log in to view your draws');
    setTimeout(() => navigate('/login'), 3000);
  }
  ```

### Error Type 2: Server Error (500)
- **Scenario:** Database error, internal server error
- **Detection:** API returns 500 status code
- **User feedback:** ErrorState displays "Failed to load draws. Please try again."
- **Recovery action:** "Retry" button with exponential backoff
- **Logging:** Log error details to console for debugging
- **Implementation:**
  ```typescript
  if (response.status === 500) {
    setError('server');
    setErrorMessage('Failed to load draws. Please try again.');
    // Implement retry with backoff
  }
  ```

### Error Type 3: Network Error
- **Scenario:** No internet connection, request timeout
- **Detection:** Fetch throws TypeError or AbortError
- **User feedback:** ErrorState displays "Network error. Please check your connection."
- **Recovery action:** "Retry" button
- **Implementation:**
  ```typescript
  catch (error) {
    if (error instanceof TypeError) {
      setError('network');
      setErrorMessage('Network error. Please check your connection.');
    }
  }
  ```

### Error Type 4: Invalid Response Data
- **Scenario:** API returns malformed data (not matching DrawDTO[])
- **Detection:** Runtime type validation fails
- **User feedback:** ErrorState displays "Invalid data received. Please contact support."
- **Recovery action:** "Retry" button
- **Logging:** Log full response for debugging
- **Implementation:**
  ```typescript
  if (!isValidResponse) {
    console.error('Invalid API response:', data);
    setError('unknown');
    setErrorMessage('Invalid data received. Please contact support.');
  }
  ```

### Error Type 5: Empty Response (Edge Case)
- **Scenario:** API returns empty array (no draws)
- **Detection:** `draws.length === 0` after successful fetch
- **User feedback:** EmptyDrawsState (not an error, expected state)
- **Recovery action:** "Create New Draw" CTA
- **Note:** This is not an error but a valid empty state

### Error Boundary Wrapper
- **Purpose:** Catch unexpected React errors
- **Component:** ErrorBoundary wrapping CreatedDrawsView island
- **User feedback:** Generic error message with "Retry" button
- **Recovery action:** Reset error boundary state and re-render
- **Implementation:**
  ```typescript
  <ErrorBoundary fallback={<ErrorFallback />}>
    <CreatedDrawsView isActive={isActive} userId={userId} />
  </ErrorBoundary>
  ```

### Toast Notifications (Additional Feedback)
- **Success scenario:** After returning from draw creation (via US-013)
  - Show success toast: "Draw created successfully!"
  - Detection: Check URL parameter or session storage flag
  - Auto-dismiss after 6 seconds
- **Error toast:** For non-blocking errors that don't prevent view rendering
  - Example: Failed to format a single date
  - Show warning toast with specific message
  - User can still interact with view

## 11. Implementation Steps

### Step 1: Create Type Definitions
1. Create or update `/src/types/views.ts` with new ViewModel types:
   - `ViewState`
   - `ErrorType`
   - `DrawRowViewModel`
   - `UseDrawsReturn`
   - `ScrollState`
2. Ensure types are properly exported
3. Verify compatibility with existing `DrawDTO` from `/src/types.ts`

### Step 2: Implement useDraws Custom Hook
1. Create `/src/hooks/useDraws.ts`
2. Import necessary dependencies: React hooks, Supabase client, types
3. Implement state management:
   - `draws`, `loading`, `error`, `errorMessage` states
4. Implement `fetchDraws` function:
   - Make API call to GET /api/draws
   - Handle all error scenarios (401, 500, network)
   - Update state accordingly
5. Implement `refetch` function for retry logic
6. Implement date formatting helper function
7. Create `viewModels` computed value using `useMemo`
8. Return hook interface: `{ draws, viewModels, loading, error, errorMessage, refetch }`
9. Add unit tests for hook logic

### Step 3: Create Utility Components
1. Create `/src/components/LoadingSpinner.tsx`:
   - Implement spinning animation using Tailwind
   - Add accessible loading message
   - Accept optional `message` prop
2. Create `/src/components/ErrorState.tsx`:
   - Accept `errorType`, `errorMessage`, `onRetry` props
   - Implement error icon and message display
   - Add retry button with onClick handler
3. Create `/src/components/EmptyDrawsState.tsx`:
   - Design empty state illustration/icon
   - Add heading and description text
   - Implement CTA button with `onCreateDraw` callback
4. Test components in isolation (Storybook or similar)

### Step 4: Implement Table Components
1. Create `/src/components/DetailsIconButton.tsx`:
   - Implement icon button with proper ARIA labels
   - Add hover and focus styles
   - Accept `drawId`, `drawName`, `onClick` props
2. Create `/src/components/DrawTableRow.tsx`:
   - Implement table row with three cells
   - Accept `draw` and `onViewDetails` props
   - Integrate DetailsIconButton
3. Create `/src/components/DrawsTable.tsx`:
   - Implement semantic HTML table structure
   - Add table caption (visually hidden)
   - Create thead with column headers
   - Map over draws to render DrawTableRow components
   - Accept `draws` and `onViewDetails` props

### Step 5: Implement DrawsTableContainer with Scroll Shadows
1. Create `/src/components/DrawsTableContainer.tsx`
2. Implement scroll detection logic:
   - Add useRef for table container
   - Add scroll event listener in useEffect
   - Update scrollState based on scroll position
3. Implement shadow overlays:
   - Add conditional shadow divs based on scrollState
   - Style with Tailwind gradients and positioning
4. Wrap children (DrawsTable) in scrollable container
5. Clean up event listeners on unmount

### Step 6: Implement Main CreatedDrawsView Component
1. Create `/src/components/CreatedDrawsView.tsx` as a React component
2. Integrate useDraws hook
3. Implement conditional rendering logic:
   - If loading: show LoadingSpinner
   - If error: show ErrorState
   - If empty: show EmptyDrawsState
   - If success: show DrawsTableContainer with DrawsTable
4. Implement navigation handler for details button:
   - Use Astro's navigate or window.location for routing
5. Implement onCreateDraw handler for empty state:
   - Trigger tab change to "Create New Draw"
6. Add proper ARIA attributes for accessibility

### Step 7: Create Astro Page
1. Create or update `/src/pages/dashboard/created.astro`
2. Implement authentication check in frontmatter:
   - Verify user is authenticated via Supabase
   - Redirect to login if not authenticated
3. Import CreatedDrawsView component
4. Wrap component in ErrorBoundary
5. Use appropriate Astro client directive (e.g., `client:visible` or `client:load`)
6. Pass necessary props: `isActive`, `userId`

### Step 8: Integrate with Dashboard Layout
1. Update `/src/pages/dashboard/index.astro` or dashboard layout
2. Add tab navigation if not already present
3. Ensure "Created Draws" tab routes to `/dashboard/created`
4. Implement lazy loading: only render CreatedDrawsView when tab is active
5. Add tab state management (if using client-side routing)

### Step 9: Styling and Responsiveness
1. Style all components with Tailwind CSS 4:
   - Define color scheme (consistent with app theme)
   - Implement responsive grid/layout
   - Add hover, focus, active states
   - Ensure proper spacing and typography
2. Implement mobile-first responsive design:
   - Table scrolls horizontally on mobile
   - Buttons and text scale appropriately
   - Touch targets meet accessibility standards (min 44x44px)
3. Test on various screen sizes (320px to 2560px)

### Step 10: Accessibility Enhancements
1. Add proper ARIA attributes:
   - role="tabpanel" on main container
   - aria-label on icon-only buttons
   - aria-live regions for loading/error states
2. Ensure keyboard navigation:
   - All interactive elements focusable
   - Logical tab order
   - Enter/Space key triggers buttons
3. Add focus indicators (visible focus rings)
4. Test with screen reader (NVDA, JAWS, or VoiceOver)
5. Validate HTML semantics (semantic table structure)

### Step 11: Success Message Integration (US-013)
1. Implement success detection after draw creation:
   - Check URL parameter (e.g., `?success=true`)
   - Or check session storage flag
2. Display success toast notification:
   - Message: "Draw created successfully!"
   - Auto-dismiss after 6 seconds
   - Manual close button
3. Clear success flag after showing toast
4. Test redirect flow from create draw page

### Step 12: Testing
1. Write unit tests:
   - Test useDraws hook with mocked API responses
   - Test date formatting functions
   - Test error handling logic
2. Write component tests:
   - Test each component in isolation
   - Test conditional rendering in CreatedDrawsView
   - Test user interactions (button clicks, navigation)
3. Write integration tests:
   - Test full flow from mounting to data display
   - Test error scenarios and recovery
   - Test navigation to details page
4. Perform manual testing:
   - Test with various data states (empty, few draws, many draws)
   - Test on different browsers
   - Test on mobile devices
   - Test with screen readers

### Step 13: Performance Optimization
1. Implement memoization where appropriate:
   - Memoize viewModels computation
   - Memoize event handlers
2. Add loading skeletons (optional enhancement):
   - Show skeleton table during loading instead of spinner
3. Consider pagination or virtual scrolling for large datasets (future enhancement)
4. Optimize bundle size:
   - Ensure tree-shaking works properly
   - Lazy load components if needed

### Step 14: Documentation
1. Add JSDoc comments to all components and functions
2. Document component props with TypeScript interfaces
3. Update project README if necessary
4. Create Storybook stories for visual component documentation (optional)

### Step 15: Code Review and Refinement
1. Review code for consistency with project conventions
2. Ensure adherence to coding best practices from AI rules
3. Check for proper error handling throughout
4. Verify TypeScript strict mode compliance
5. Run linters and fix any issues
6. Get peer review before merging

# API Endpoint Implementation Plan: Get Author's Draws

## 1. Endpoint Overview

This endpoint retrieves a paginated list of all draws created by the currently authenticated user. It allows draw authors to view their own draws with support for pagination and sorting to efficiently manage large numbers of draws.

**Key Characteristics:**

- Read-only operation (GET method)
- Requires authentication
- Returns only draws authored by the authenticated user
- Supports pagination and sorting
- No authorization check needed beyond authentication (users only see their own draws)

## 2. Request Details

- **HTTP Method:** GET
- **URL Structure:** `/api/draws`
- **Parameters:**
  - **Required:** None (user ID extracted from authentication context)
- **Request Body:** None (GET request)
- **Headers:**
  - `Authorization: Bearer <token>` (Supabase auth token)

**Example Request:**

```
GET /api/draws
Authorization: Bearer <supabase-token>
```

## 3. Used Types

### Existing Types (from `src/types.ts`)

```typescript
/**
 * DTO representing summary information for a draw.
 */
export type DrawDTO = Pick<Tables<"draws">, "id" | "name" | "created_at">;

/**
 * Common pagination parameters for list endpoints.
 */
export interface PaginationParams {
  page: number;
  size: number;
  sort?: string;
}

/**
 * API error response structure returned by the backend.
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
}
```

### New Schema (to add in `src/lib/schemas/draw.schema.ts`)

```typescript
import { z } from "zod";

/**
 * Schema for validating query parameters for listing draws.
 * Provides defaults and constraints for pagination and sorting.
 */
export const listDrawsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, "Page must be at least 1")),
  size: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, "Size must be at least 1").max(100, "Size must not exceed 100")),
  sort: z
    .string()
    .optional()
    .default("created_at:desc")
    .refine(
      (val) => {
        const [field, direction] = val.split(":");
        const validFields = ["created_at", "name"];
        const validDirections = ["asc", "desc"];
        return validFields.includes(field) && validDirections.includes(direction);
      },
      {
        message:
          "Sort must be in format 'field:direction' where field is 'created_at' or 'name' and direction is 'asc' or 'desc'",
      }
    ),
});
```

## 4. Response Details

### Success Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Christmas Secret Santa 2024",
    "created_at": "2024-12-15T10:30:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Office Gift Exchange",
    "created_at": "2024-12-10T14:20:00.000Z"
  }
]
```

**Type:** `DrawDTO[]`

**Response Headers:**

- `Content-Type: application/json`

**Note:** The response is an array of draws. If no draws exist for the user, an empty array `[]` is returned (still 200 OK).

### Error Responses

| Status | Error                 | Description                                                               |
| ------ | --------------------- | ------------------------------------------------------------------------- |
| 400    | Bad Request           | Invalid query parameters (negative page, size > 100, invalid sort format) |
| 401    | Unauthorized          | Missing or invalid authentication token                                   |
| 500    | Internal Server Error | Database or unexpected server error                                       |

**Error Response Format:**

```json
{
  "error": "Error Type",
  "message": "Human-readable error description"
}
```

**Example Error Responses:**

```json
// 400 Bad Request
{
  "error": "Bad Request",
  "message": "Invalid query parameters",
  "details": [
    {
      "field": "size",
      "message": "Size must not exceed 100"
    }
  ]
}

// 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "Authentication required"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve draws"
}
```

## 5. Data Flow

```
   Client          API Route         DrawService       Supabase
     │                 │                  │                │
     │  1. GET         │                  │                │
     │   /api/draws    │                  │                │
     │  ?page=1&size=10│                  │                │
     │────────────────►│                  │                │
     │                 │  2. Validate     │                │
     │                 │     auth token   │                │
     │                 │                  │                │
     │                 │  3. Validate     │                │
     │                 │     query params │                │
     │                 │                  │                │
     │                 │  4. getDraws     │                │
     │                 │     ByAuthor()   │                │
     │                 │─────────────────►│                │
     │                 │                  │  5. SELECT     │
     │                 │                  │     FROM draws │
     │                 │                  │     WHERE      │
     │                 │                  │     author_id  │
     │                 │                  │     LIMIT/OFFSET│
     │                 │                  │───────────────►│
     │                 │                  │◄───────────────│
     │                 │                  │  6. Rows       │
     │                 │  7. Return       │                │
     │                 │     DrawDTO[]    │                │
     │                 │◄─────────────────│                │
     │  8. JSON        │                  │                │
     │     Response    │                  │                │
     │◄────────────────│                  │                │
```

### Steps:

1. Client sends GET request with optional pagination query parameters
2. API route validates authentication token via Supabase Auth
3. API route validates and parses query parameters using Zod schema
4. API route calls DrawService.getDrawsByAuthor() with user ID and pagination params
5. DrawService queries Supabase `draws` table with WHERE filter on author_id and pagination
6. Supabase returns matching rows
7. DrawService maps results to DrawDTO array and returns to API route
8. API route returns JSON response to client

## 6. Security Considerations

### Authentication

- **Verification:** Extract authenticated user from `locals.supabase.auth.getUser()`
- **Token Validation:** Supabase middleware handles token validation
- **Error Handling:** Return 401 if no valid authentication token is present

### Authorization

- **Implicit Authorization:** Query automatically filters by authenticated user's ID
- **Row-Level Security:** Supabase RLS policies provide additional protection
- **No Explicit Check Needed:** Since we filter by author_id, users can only see their own draws

### Input Validation

- **Query Parameters:** Validate all query params with Zod schema
- **Type Coercion:** Convert string query params to appropriate types (integers)
- **Range Validation:** Enforce limits on page size to prevent abuse
- **Sort Field Validation:** Whitelist allowed sort fields to prevent SQL injection
- **Sanitization:** Supabase handles parameter sanitization

### Rate Limiting

- **Consideration:** Implement rate limiting to prevent abuse (future enhancement)
- **Resource Protection:** Max page size of 100 prevents excessive database load

### Data Protection

- **Minimal Data Exposure:** Only return necessary fields (id, name, created_at)
- **HTTPS Required:** Ensure all production traffic uses HTTPS
- **Audit Logging:** Log access patterns for security monitoring

## 7. Error Handling

### Error Scenarios and Responses

| Scenario                  | Detection                                        | Status Code | Response                                                                      | Logging                             |
| ------------------------- | ------------------------------------------------ | ----------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| Missing auth token        | `locals.supabase.auth.getUser()` returns no user | 401         | `{ "error": "Unauthorized", "message": "Authentication required" }`           | Info level with request metadata    |
| Invalid auth token        | Supabase auth error                              | 401         | `{ "error": "Unauthorized", "message": "Invalid authentication token" }`      | Info level with error details       |
| Invalid page param        | Zod validation fails                             | 400         | `{ "error": "Bad Request", "message": "...", "details": [...] }`              | Info level with validation errors   |
| Invalid size param        | Zod validation fails                             | 400         | Same as above                                                                 | Info level                          |
| Invalid sort param        | Zod validation fails                             | 400         | Same as above                                                                 | Info level                          |
| Database connection error | Supabase query throws                            | 500         | `{ "error": "Internal Server Error", "message": "Failed to retrieve draws" }` | Error level with full error details |
| Unexpected error          | Try-catch block                                  | 500         | Generic error message                                                         | Error level with stack trace        |

### Error Handling Strategy

1. **Early Returns:** Use guard clauses for authentication and validation
2. **Structured Errors:** Return consistent ApiErrorResponse format
3. **Secure Messages:** Don't expose internal details in error messages to client
4. **Comprehensive Logging:** Log all errors with sufficient context for debugging
5. **Graceful Degradation:** Return empty array for valid queries with no results

### Example Error Handler Pattern

```typescript
try {
  // Validate auth
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    await LoggerService.info("Unauthorized list draws request", { authError });
    return new Response(JSON.stringify({ error: "Unauthorized", message: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate query params
  const validationResult = listDrawsQuerySchema.safeParse(url.searchParams);

  if (!validationResult.success) {
    // Return validation errors
  }

  // Business logic
  const draws = await drawService.getDrawsByAuthor(user.id, paginationParams);

  return new Response(JSON.stringify(draws), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  await LoggerService.error("Unexpected error in list draws endpoint", error);
  return new Response(JSON.stringify({ error: "Internal Server Error", message: "Failed to retrieve draws" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

## 8. Implementation Steps

### Step 1: Create Validation Schema

**File:** `src/lib/schemas/draw.schema.ts`

```typescript
// Add to existing file or create if not exists
export const listDrawsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, "Page must be at least 1")),
  size: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, "Size must be at least 1").max(100, "Size must not exceed 100")),
  sort: z
    .string()
    .optional()
    .default("created_at:desc")
    .refine(
      (val) => {
        const [field, direction] = val.split(":");
        const validFields = ["created_at", "name"];
        const validDirections = ["asc", "desc"];
        return validFields.includes(field) && validDirections.includes(direction);
      },
      {
        message:
          "Sort must be in format 'field:direction' where field is 'created_at' or 'name' and direction is 'asc' or 'desc'",
      }
    ),
});
```

### Step 2: Add Service Method

**File:** `src/lib/services/draw.service.ts`

```typescript
/**
 * Retrieves all draws created by a specific author with pagination and sorting.
 *
 * @param authorId - The ID of the draw author
 * @param pagination - Pagination and sorting parameters
 * @returns Array of DrawDTO
 * @throws Error if database query fails
 */
async getDrawsByAuthor(
  authorId: string,
  pagination: PaginationParams
): Promise<DrawDTO[]> {
  // Parse sort parameter
  const [sortField, sortDirection] = (pagination.sort || "created_at:desc").split(":");
  const ascending = sortDirection === "asc";

  // Calculate offset for pagination
  const offset = (pagination.page - 1) * pagination.size;

  // Query draws with pagination
  const { data, error } = await this.supabase
    .from("draws")
    .select("id, name, created_at")
    .eq("author_id", authorId)
    .order(sortField as "created_at" | "name", { ascending })
    .range(offset, offset + pagination.size - 1);

  if (error) {
    await LoggerService.error("Failed to fetch draws for author", {
      authorId,
      pagination,
      error,
    });
    throw new Error("Failed to fetch draws");
  }

  return data ?? [];
}
```

### Step 3: Add GET Handler to API Route

**File:** `src/pages/api/draws.ts`

```typescript
/**
 * GET /api/draws
 * Retrieves all draws created by the authenticated user.
 *
 * Requires authentication. Returns paginated list of draws.
 *
 * Query Parameters:
 * - page: Page number (default: 1, min: 1)
 * - size: Items per page (default: 10, min: 1, max: 100)
 * - sort: Sort field and direction (default: "created_at:desc")
 *
 * Responses:
 * - 200 OK: Array of DrawDTO
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication
 * - 500 Internal Server Error: Database or unexpected errors
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Verify authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      await LoggerService.info("Unauthorized list draws request", {
        authError: authError?.message,
      });

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

    // Step 2: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page") ?? undefined,
      size: url.searchParams.get("size") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
    };

    const validationResult = listDrawsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      await LoggerService.info("Invalid query parameters for list draws", {
        userId: user.id,
        errors,
      });

      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid query parameters",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Build pagination parameters
    const paginationParams: PaginationParams = {
      page: validationResult.data.page,
      size: validationResult.data.size,
      sort: validationResult.data.sort,
    };

    // Step 4: Fetch draws using service
    const drawService = new DrawService(locals.supabase);
    const draws = await drawService.getDrawsByAuthor(user.id, paginationParams);

    // Step 5: Return success response
    return new Response(JSON.stringify(draws), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    await LoggerService.error("Unexpected error in list draws endpoint", {
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to retrieve draws",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### Step 4: Add Unit Tests for Service Method

**File:** `src/lib/services/draw.service.test.ts`

Add test cases for:

- Fetching draws with default pagination
- Fetching draws with custom page size
- Sorting by created_at ascending/descending
- Sorting by name ascending/descending
- Empty result set for user with no draws
- Handling database errors
- Correct offset calculation for different pages

### Step 5: Add Integration Tests for API Route

**File:** `src/pages/api/draws.test.ts`

Add test cases for:

- Successful retrieval with default params (200)
- Successful retrieval with custom pagination (200)
- Empty array for user with no draws (200)
- Unauthorized request without token (401)
- Invalid page parameter (400)
- Invalid size parameter (400)
- Invalid sort parameter (400)
- Database error handling (500)

### Step 6: Update Database Indexes (if needed)

**Migration File:** Create migration to add indexes

```sql
-- Add index on author_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_draws_author_id ON draws(author_id);

-- Add composite index for author_id + created_at for efficient sorted queries
CREATE INDEX IF NOT EXISTS idx_draws_author_created ON draws(author_id, created_at DESC);

-- Add composite index for author_id + name for name-sorted queries
CREATE INDEX IF NOT EXISTS idx_draws_author_name ON draws(author_id, name ASC);
```

### Step 7: Manual Testing Checklist

1. **Authentication:**
   - [ ] Request without token returns 401
   - [ ] Request with invalid token returns 401
   - [ ] Request with valid token returns 200

2. **Pagination:**
   - [ ] Default pagination (page=1, size=10) works
   - [ ] Custom page size works
   - [ ] Page navigation works (page 1, 2, 3, etc.)
   - [ ] Size=1 returns single item
   - [ ] Size=100 returns up to 100 items
   - [ ] Size>100 returns 400 error

3. **Sorting:**
   - [ ] Default sort (created_at:desc) works
   - [ ] Sort by created_at:asc works
   - [ ] Sort by name:asc works
   - [ ] Sort by name:desc works
   - [ ] Invalid sort field returns 400
   - [ ] Invalid sort direction returns 400

4. **Edge Cases:**
   - [ ] User with no draws returns empty array
   - [ ] Page beyond available data returns empty array
   - [ ] Special characters in query params handled safely

5. **Performance:**
   - [ ] Response time acceptable for large datasets
   - [ ] Database query uses indexes

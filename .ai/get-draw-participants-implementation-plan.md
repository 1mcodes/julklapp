# API Endpoint Implementation Plan: Get Draw Participants

## 1. Endpoint Overview

This endpoint retrieves the list of participants for a specific draw. It allows draw authors to view all participants they have added to their draw, including their contact information and gift preferences.

**Key Characteristics:**

- Read-only operation (GET method)
- Requires authentication
- Only the draw author can access participants
- Returns an array of participant objects

## 2. Request Details

- **HTTP Method:** GET
- **URL Structure:** `/api/draws/{drawId}/participants`
- **Parameters:**
  - **Required:**
    - `drawId` (path parameter): UUID of the draw
  - **Optional:** None
- **Request Body:** None (GET request)
- **Headers:**
  - `Authorization: Bearer <token>` (Supabase auth token)

## 3. Used Types

### Existing Types (from `src/types.ts`)

```typescript
/**
 * DTO representing a participant in a draw.
 */
export type ParticipantDTO = Pick<
  Tables<"draw_participants">,
  "id" | "name" | "surname" | "email" | "gift_preferences"
>;
```

### New Schema (to add in `src/lib/schemas/draw.schema.ts`)

```typescript
/**
 * Schema for validating drawId path parameter.
 */
export const drawIdParamSchema = z.object({
  drawId: z.string().uuid("Invalid draw ID format"),
});
```

## 4. Response Details

### Success Response (200 OK)

```json
[
  {
    "id": "uuid-string",
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "gift_preferences": "Books, electronics, cooking equipment"
  },
  ...
]
```

**Type:** `ParticipantDTO[]`

### Error Responses

| Status | Error                 | Description                               |
| ------ | --------------------- | ----------------------------------------- |
| 400    | Bad Request           | Invalid drawId format (not a valid UUID)  |
| 401    | Unauthorized          | Missing or invalid authentication token   |
| 403    | Forbidden             | User is not the author of this draw       |
| 404    | Not Found             | Draw with the specified ID does not exist |
| 500    | Internal Server Error | Database or unexpected server error       |

**Error Response Format:**

```json
{
  "error": "Error Type",
  "message": "Human-readable error description"
}
```

## 5. Data Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│ Client  │────►│  API Route  │────►│ DrawService │────►│ Supabase │
│         │     │ (Astro)     │     │             │     │    DB    │
└─────────┘     └─────────────┘     └─────────────┘     └──────────┘
     │                │                    │                  │
     │  1. GET        │                    │                  │
     │  /api/draws/   │                    │                  │
     │  {id}/         │                    │                  │
     │  participants  │                    │                  │
     │ ──────────────►│                    │                  │
     │                │  2. Validate       │                  │
     │                │     drawId         │                  │
     │                │────────────────────►                  │
     │                │  3. Check draw     │                  │
     │                │     exists &       │                  │
     │                │     ownership      │                  │
     │                │                    │─────────────────►│
     │                │                    │    4. Query      │
     │                │                    │       draws      │
     │                │                    │◄─────────────────│
     │                │                    │                  │
     │                │                    │─────────────────►│
     │                │                    │    5. Query      │
     │                │                    │  participants    │
     │                │                    │◄─────────────────│
     │                │  6. Return         │                  │
     │                │     ParticipantDTO[]                  │
     │                │◄───────────────────│                  │
     │  7. JSON       │                    │                  │
     │     Response   │                    │                  │
     │◄───────────────│                    │                  │
```

### Steps:

1. Client sends GET request with drawId path parameter
2. API route validates the drawId format using Zod schema
3. DrawService verifies draw exists and user is the author
4. Query Supabase `draws` table to check ownership
5. Query Supabase `draw_participants` table for participants
6. Map database results to ParticipantDTO array
7. Return JSON response to client

## 6. Security Considerations

### Authentication

- Verify user is authenticated via Supabase Auth
- Extract user ID from authentication context (`locals`)
- Return 401 if no valid authentication token is present

### Authorization

- Only the draw author (`draws.author_id`) can access participants
- Query must verify `author_id` matches authenticated user's ID
- Return 403 if user is not the draw author

### Input Validation

- Validate `drawId` is a valid UUID format using Zod
- Sanitize inputs to prevent injection attacks
- Supabase RLS policies provide additional row-level security

### Data Protection

- Participant email addresses and preferences are sensitive data
- Ensure HTTPS is used in production
- Log access attempts for audit purposes

## 7. Error Handling

### Error Scenarios and Handling

| Scenario              | Detection                       | Response           | Logging             |
| --------------------- | ------------------------------- | ------------------ | ------------------- |
| Invalid drawId format | Zod validation fails            | 400 Bad Request    | LoggerService.warn  |
| No authentication     | `locals.user` is null/undefined | 401 Unauthorized   | LoggerService.warn  |
| Draw not found        | DB query returns null           | 404 Not Found      | LoggerService.info  |
| User not author       | `author_id !== userId`          | 403 Forbidden      | LoggerService.warn  |
| Database error        | Supabase returns error          | 500 Internal Error | LoggerService.error |
| Unexpected error      | try/catch catches exception     | 500 Internal Error | LoggerService.error |

### Error Response Helper

Create a consistent error response helper to maintain uniform error format:

```typescript
function createErrorResponse(status: number, error: string, message: string): Response {
  return new Response(JSON.stringify({ error, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
```

## 8. Performance Considerations

### Database Optimization

- Use indexed queries on `draw_id` column (already indexed via foreign key)
- Select only needed columns (`id, name, surname, email, gift_preferences`)
- Consider adding composite index on `(draw_id, id)` for pagination

### Query Optimization

- Combine draw existence check with authorization in a single query when possible
- Use `.select()` to limit returned columns

### Caching Considerations

- Participant data may change infrequently after draw creation
- Consider client-side caching with appropriate Cache-Control headers
- No server-side caching needed for MVP

### Response Size

- Maximum 32 participants per draw (enforced at creation)
- Response payload is bounded and predictable

## 9. Implementation Steps

### Step 1: Add Zod Schema for Path Parameter

**File:** `src/lib/schemas/draw.schema.ts`

Add validation schema for drawId path parameter:

```typescript
/**
 * Schema for validating drawId path parameter.
 * Ensures the drawId is a valid UUID format.
 */
export const drawIdParamSchema = z.object({
  drawId: z.string().uuid("Invalid draw ID format"),
});

export type DrawIdParam = z.infer<typeof drawIdParamSchema>;
```

### Step 2: Extend DrawService with New Methods

**File:** `src/lib/services/draw.service.ts`

Add methods to support the endpoint:

```typescript
/**
 * Retrieves a draw by ID if the user is the author.
 *
 * @param drawId - The UUID of the draw
 * @param userId - The authenticated user's ID
 * @returns The draw if found and user is author, null otherwise
 */
async getDrawByIdForAuthor(drawId: string, userId: string): Promise<DrawDTO | null> {
  const { data, error } = await this.supabase
    .from("draws")
    .select("id, name, created_at, author_id")
    .eq("id", drawId)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if user is the author
  if (data.author_id !== userId) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    created_at: data.created_at,
  };
}

/**
 * Retrieves all participants for a given draw.
 *
 * @param drawId - The UUID of the draw
 * @returns Array of ParticipantDTO
 * @throws Error if database query fails
 */
async getParticipantsByDrawId(drawId: string): Promise<ParticipantDTO[]> {
  const { data, error } = await this.supabase
    .from("draw_participants")
    .select("id, name, surname, email, gift_preferences")
    .eq("draw_id", drawId)
    .order("created_at", { ascending: true });

  if (error) {
    await LoggerService.error("Failed to fetch participants", { drawId, error });
    throw new Error("Failed to fetch participants");
  }

  return data ?? [];
}
```

### Step 3: Create API Route File

**File:** `src/pages/api/draws/[drawId]/participants.ts`

Create the directory structure and endpoint file:

```typescript
import type { APIRoute } from "astro";

import { DrawService } from "../../../../lib/services/draw.service";
import { LoggerService } from "../../../../lib/services/logger.service";
import { drawIdParamSchema } from "../../../../lib/schemas/draw.schema";

export const prerender = false;

/**
 * GET /api/draws/{drawId}/participants
 * Retrieves all participants for a specific draw.
 *
 * Requires authentication. Only the draw author can access this endpoint.
 *
 * Path Parameters:
 * - drawId: UUID of the draw
 *
 * Responses:
 * - 200 OK: Array of ParticipantDTO
 * - 400 Bad Request: Invalid drawId format
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: User is not the draw author
 * - 404 Not Found: Draw does not exist
 * - 500 Internal Server Error: Database or unexpected errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // TODO: Implement proper authentication when ready
    // For now, using mock user ID
    const mockUserId = "00000000-0000-0000-0000-000000000000";

    // Step 1: Validate path parameter
    const validationResult = drawIdParamSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid draw ID format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { drawId } = validationResult.data;

    // Step 2: Initialize service and verify draw access
    const drawService = new DrawService(locals.supabase);
    const draw = await drawService.getDrawByIdForAuthor(drawId, mockUserId);

    if (!draw) {
      // Check if draw exists at all to differentiate 404 vs 403
      const drawExists = await drawService.drawExists(drawId);

      if (!drawExists) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Draw not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Draw exists but user is not author
      await LoggerService.warn("Forbidden access attempt to draw participants", {
        drawId,
        userId: mockUserId,
      });

      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You do not have access to this draw",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Fetch participants
    const participants = await drawService.getParticipantsByDrawId(drawId);

    await LoggerService.info("Draw participants retrieved", {
      drawId,
      participantCount: participants.length,
    });

    // Step 4: Return success response
    return new Response(JSON.stringify(participants), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    await LoggerService.error("Error fetching draw participants", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while fetching participants",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### Step 4: Add Helper Method for Draw Existence Check

**File:** `src/lib/services/draw.service.ts`

Add method to check if a draw exists (for 404 vs 403 differentiation):

```typescript
/**
 * Checks if a draw exists by ID.
 *
 * @param drawId - The UUID of the draw
 * @returns true if draw exists, false otherwise
 */
async drawExists(drawId: string): Promise<boolean> {
  const { data, error } = await this.supabase
    .from("draws")
    .select("id")
    .eq("id", drawId)
    .single();

  return !error && data !== null;
}
```

### Step 5: Update Types if Needed

**File:** `src/types.ts`

No changes needed - `ParticipantDTO` already exists with the correct structure.

### Step 6: Testing Checklist

After implementation, verify:

- [ ] Valid request returns 200 with participant array
- [ ] Invalid UUID format returns 400
- [ ] Non-existent draw returns 404
- [ ] Accessing another user's draw returns 403
- [ ] Empty participant list returns 200 with empty array `[]`
- [ ] Database errors are properly caught and logged
- [ ] Response Content-Type is `application/json`

### File Structure After Implementation

```
src/
├── lib/
│   ├── schemas/
│   │   └── draw.schema.ts        # Add drawIdParamSchema
│   └── services/
│       └── draw.service.ts       # Add new methods
├── pages/
│   └── api/
│       └── draws/
│           ├── [drawId]/
│           │   └── participants.ts  # New file
│           └── ... (existing)
└── types.ts                      # No changes needed
```

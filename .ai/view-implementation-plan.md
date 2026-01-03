# API Endpoint Implementation Plan: Create Draw with Participants

## 1. Endpoint Overview

**Purpose:** Create a new draw along with its participants in a single atomic operation.

**Method & Path:**

- POST `/api/draws`

**Description:**

- Accepts a draw name and an array of participants (3–32 entries).
- Inserts a record into the `draws` table and associated entries into the `draw_participants` table.
- Returns the created draw’s ID, name, and timestamp.

## 2. Request Details

- HTTP Method: POST
- URL: `/api/draws`

### Parameters

- **None** in URL path or query.

### Request Body (JSON)

```json
{
  "name": "string",
  "participants": [
    {
      "name": "string",
      "surname": "string",
      "email": "string",
      "gift_preferences": "string (max 10000 chars)"
    },
    ...
  ]
}
```

- Required Fields:
  - `name` (string, non-empty)
  - `participants` (array, length 3–32)
    - Each participant:
      - `name` (string, non-empty)
      - `surname` (string, non-empty)
      - `email` (string, valid email format)
      - `gift_preferences` (string, max 10000 chars)

- Optional Fields: None.

## 3. Used Types

- **Command Models**
  - `CreateDrawCommand` (from `src/types.ts`)
  - `CreateParticipantCommand` (from `src/types.ts`)

- **DTOs**
  - `DrawDTO` (returned on success)

## 4. Response Details

### Success (201 Created)

```json
{
  "id": "UUID",
  "name": "string",
  "created_at": "timestamp"
}
```

- Content-Type: `application/json`

### Error Responses

- `400 Bad Request`: Validation errors in payload (lengths, missing fields, invalid email).
- `401 Unauthorized`: If authentication is required and missing/invalid.
- `500 Internal Server Error`: Database errors or unexpected failures.

## 5. Data Flow

1. **Validation Layer** (API Route):
   - Parse and validate using Zod schema.
   - Early return on validation failure.
2. **Service Layer** (`DrawService.createDraw`):
   - Begin transaction (if supported) or emulate.
   - Insert into `draws` table: `{ name }` → returns new `draw_id`.
   - Prepare participant records by adding `draw_id`.
   - Bulk insert into `draw_participants`.
   - Commit transaction.
   - Map result to `DrawDTO`.
3. **API Response**:
   - Return `201 Created` with `DrawDTO`.

## 6. Security Considerations

- **Authentication/Authorization**
  - Verify user identity via middleware (e.g., JWT or Supabase session).
  - Ensure only authorized users can create draws.

- **Input Validation**
  - Strict schema enforcement (Zod).
  - Limit participant array size and string lengths.

- **SQL Injection Protection**
  - Use Supabase client (parameterized queries).

- **Privacy**
  - Do not return sensitive participant data in this response.

## 7. Error Handling

| Scenario                                | Condition                      | Response                  |
| --------------------------------------- | ------------------------------ | ------------------------- |
| Payload schema invalid                  | Zod parsing or constraint fail | 400 Bad Request + details |
| Too few or too many participants        | `length < 3` or `> 32`         | 400 Bad Request + details |
| Gift preferences too long               | `gift_preferences` > 10000     | 400 Bad Request + details |
| Supabase insertion error (draws)        | DB returns error               | 500 Internal Server Error |
| Supabase insertion error (participants) | DB returns error               | 500 Internal Server Error |
| Transaction partial failure             | Participants insert fails      | Rollback + 500            |

- **Logging**
  - Log errors to console or a centralized error table via `ErrorService.log()` (if available).

## 8. Performance Considerations

- Batch insert participants to minimize round trips.
- Limit participant payload size (32 max) to bound work.
- Use indexed `draw_id` on `draw_participants` for fast lookup.

## 9. Implementation Steps

1. **Define Zod Schemas**
   - `createParticipantSchema` and `createDrawSchema` in `src/lib/schemas/draw.ts`.
2. **Implement Service**
   - Create `DrawService` in `src/lib/services/draw.service.ts` with `createDraw(command: CreateDrawCommand)`.
   - Use Supabase client from `context.locals.supabase`.
3. **Create API Route**
   - Add `src/pages/api/draws.ts`.
   - Export `POST` handler using Astro server endpoint format.
   - Validate input, call service, handle errors.
4. **Error Logging**
   - Integrate with existing `ErrorService` or console.error.
5. **Testing**
   - Write unit tests for schema validation and service logic.
   - Integration test for the API route.
6. **Documentation**
   - Update API documentation and OpenAPI spec if available.

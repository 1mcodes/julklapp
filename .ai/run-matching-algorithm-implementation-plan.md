# API Endpoint Implementation Plan: Run Matching Algorithm

## 1. Endpoint Overview

This endpoint executes the Secret Santa matching algorithm for a specific draw. It performs two critical operations:

1. **Generates matches**: Creates random pairings where each participant is assigned another participant to give a gift to
2. **Provisions accounts**: Creates Supabase authentication accounts for participants who don't have user accounts yet, enabling them to access the system

The endpoint is idempotent by design - it will reject requests if matches have already been generated for the draw. Only the draw author (creator) can trigger the matching process.

**Business Rules:**

- Minimum 3 participants required for valid Secret Santa matching
- Each participant must give to exactly one other participant
- Each participant must receive from exactly one other participant
- No participant can be assigned to themselves
- All operations must be atomic (all succeed or all fail)

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/draws/{drawId}/match`
- **Parameters**:
  - **Required**:
    - `drawId` (path parameter): UUID of the draw to generate matches for
  - **Optional**: None
- **Request Body**: None (this is a trigger endpoint)
- **Authentication**: Required (user must be authenticated via Supabase session)
- **Authorization**: Required (user must be the author of the draw)

### Request Validation Schema (Zod)

```typescript
const paramsSchema = z.object({
  drawId: z.string().uuid({ message: "Invalid draw ID format" }),
});
```

## 3. Used Types

### Existing Types (from `src/types.ts`)

- **MessageDTO**: Used for success response
  ```typescript
  interface MessageDTO {
    message: string;
  }
  ```
- **ParticipantDTO**: Used internally to work with participant data
  ```typescript
  type ParticipantDTO = Pick<Tables<"draw_participants">, "id" | "name" | "surname" | "email" | "gift_preferences">;
  ```

### New Internal Types (service layer only)

```typescript
// In src/lib/services/matching.service.ts
interface MatchPair {
  giver_id: string;
  recipient_id: string;
}

interface ProvisionedAccount {
  participant_id: string;
  user_id: string;
  temporary_password: string;
}

interface MatchingResult {
  matches: MatchPair[];
  provisioned_accounts: ProvisionedAccount[];
}
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "message": "Matches created successfully"
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Invalid draw ID format"
}
```

```json
{
  "error": "Bad Request",
  "message": "Matches have already been generated for this draw"
}
```

```json
{
  "error": "Bad Request",
  "message": "Insufficient participants. At least 3 participants are required for matching"
}
```

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Only the draw author can generate matches"
}
```

#### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Draw not found"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Failed to generate matches. Please try again"
}
```

## 5. Data Flow

### High-Level Flow

```
1. Client sends POST /api/draws/{drawId}/match
2. Astro endpoint receives request
3. Validate drawId format (Zod)
4. Extract authenticated user from context.locals.supabase
5. Verify draw exists and user is author
6. Check if matches already exist (idempotency)
7. Fetch all participants for the draw
8. Validate minimum participant count (≥ 3)
9. Call matching service to:
   a. Run matching algorithm
   b. Provision accounts for participants without user_id
   c. Save matches to database
10. Return success response
```

### Detailed Service Layer Flow

#### Matching Service (`src/lib/services/matching.service.ts`)

**Main Function: `generateMatches()`**

1. Begin database transaction (if Supabase supports) or prepare rollback strategy
2. Call `runMatchingAlgorithm()` to generate match pairs
3. Call `provisionAccounts()` for participants needing accounts
4. Call `saveMatches()` to persist matches to database
5. Commit transaction
6. Return success indicator

**Algorithm Function: `runMatchingAlgorithm()`**

1. Validate input (minimum 3 participants)
2. Create a shuffled copy of participants array (Fisher-Yates shuffle)
3. Generate circular assignments:
   - Participant at index i gives to participant at index (i + 1) % n
   - This ensures everyone gives once and receives once
4. Return array of match pairs

**Provisioning Function: `provisionAccounts()`**

1. Filter participants where `user_id` is NULL
2. For each participant without account:
   a. Generate secure random temporary password
   b. Create Supabase auth user using Admin API:
   - Email: participant.email
   - Password: temporary password
   - Email confirmation: skip (or send custom invite)
     c. Store mapping of participant_id to new user_id
     d. Send invitation email with temporary credentials
3. Update `draw_participants` table with new user_ids
4. Return list of provisioned accounts

**Persistence Function: `saveMatches()`**

1. Prepare batch insert for matches table
2. For each match pair, create record:
   ```sql
   INSERT INTO matches (draw_id, giver_id, recipient_id)
   VALUES (drawId, match.giver_id, match.recipient_id)
   ```
3. Execute batch insert
4. Handle unique constraint violations gracefully

### Database Interactions

**Query 1: Verify draw and authorization**

```sql
SELECT id, author_id, name
FROM draws
WHERE id = {drawId}
```

**Query 2: Check existing matches**

```sql
SELECT COUNT(*) as match_count
FROM matches
WHERE draw_id = {drawId}
```

**Query 3: Fetch participants**

```sql
SELECT id, draw_id, user_id, name, surname, email, gift_preferences
FROM draw_participants
WHERE draw_id = {drawId}
ORDER BY created_at
```

**Query 4: Create user accounts** (via Supabase Admin Auth API)

```typescript
supabase.auth.admin.createUser({
  email: participant.email,
  password: temporaryPassword,
  email_confirm: true,
  user_metadata: {
    name: participant.name,
    surname: participant.surname,
  },
});
```

**Query 5: Update participant user_id**

```sql
UPDATE draw_participants
SET user_id = {newUserId}
WHERE id = {participantId}
```

**Query 6: Insert matches (batch)**

```sql
INSERT INTO matches (draw_id, giver_id, recipient_id)
VALUES
  ({drawId}, {giver1Id}, {recipient1Id}),
  ({drawId}, {giver2Id}, {recipient2Id}),
  ...
```

## 6. Security Considerations

### Authentication

- **Requirement**: User must have valid Supabase session
- **Implementation**: Check `context.locals.supabase.auth.getUser()`
- **Error Response**: 401 Unauthorized if no valid session

### Authorization

- **Requirement**: Only draw author can trigger matching
- **Implementation**: Compare `user.id` with `draw.author_id`
- **Error Response**: 403 Forbidden if user is not author
- **Security Note**: Don't reveal whether draw exists in 403 response to prevent enumeration

### Input Validation

- **drawId**: Must be valid UUID format (Zod validation)
- **Participant emails**: Validated during draw creation, re-validate before provisioning
- **Minimum participants**: Enforce >= 3 for valid matching

### Data Protection

- **Temporary passwords**:
  - Generate with cryptographically secure random generator
  - Minimum 16 characters, mix of alphanumeric and special characters
  - Force password change on first login
  - Never log passwords
- **Email security**: Validate email format to prevent injection attacks
- **Match privacy**: Ensure matches are only visible to the giver (not in response)

### Rate Limiting

- **Consideration**: This is an expensive operation
- **Recommendation**: Implement rate limiting (max 1 request per minute per draw)
- **Implementation**: Use middleware or Supabase Edge Functions rate limiting

### Timing Attacks

- **Risk**: Response time differences revealing draw existence
- **Mitigation**: Use constant-time comparison where possible, consistent error messages

### CSRF Protection

- **Requirement**: Protect against cross-site request forgery
- **Implementation**: Use Supabase session tokens (automatically CSRF-protected)

## 7. Error Handling

### Validation Errors (400)

**Scenario 1: Invalid drawId format**

- **Trigger**: drawId is not a valid UUID
- **Detection**: Zod validation failure
- **Response**: 400 with "Invalid draw ID format"
- **Logging**: Info level (expected user error)

**Scenario 2: Matches already exist**

- **Trigger**: Database query finds existing matches for draw
- **Detection**: COUNT(\*) > 0 from matches table
- **Response**: 400 with "Matches have already been generated for this draw"
- **Logging**: Info level (idempotency check)

**Scenario 3: Insufficient participants**

- **Trigger**: Less than 3 participants in draw
- **Detection**: participants.length < 3
- **Response**: 400 with "Insufficient participants. At least 3 participants are required for matching"
- **Logging**: Warning level (data integrity issue)

### Authentication Errors (401)

**Scenario: No authenticated user**

- **Trigger**: No valid Supabase session
- **Detection**: `getUser()` returns null or error
- **Response**: 401 with "Authentication required"
- **Logging**: Info level (expected for unauthenticated requests)

### Authorization Errors (403)

**Scenario: User is not draw author**

- **Trigger**: Authenticated user's ID doesn't match draw.author_id
- **Detection**: user.id !== draw.author_id
- **Response**: 403 with "Only the draw author can generate matches"
- **Logging**: Warning level (potential security issue)
- **Note**: Don't reveal if draw exists to prevent enumeration

### Not Found Errors (404)

**Scenario: Draw doesn't exist**

- **Trigger**: Database query returns no draw with given ID
- **Detection**: draw === null
- **Response**: 404 with "Draw not found"
- **Logging**: Info level (expected user error)
- **Security**: Return 404 before authorization check to prevent enumeration

### Server Errors (500)

**Scenario 1: Matching algorithm failure**

- **Trigger**: Unexpected error in algorithm logic
- **Detection**: Try-catch around matching algorithm
- **Response**: 500 with "Failed to generate matches. Please try again"
- **Logging**: Error level with full stack trace
- **Rollback**: Don't persist any partial data

**Scenario 2: Account provisioning failure**

- **Trigger**: Supabase auth API error (e.g., email already exists)
- **Detection**: Error from `createUser()` call
- **Response**: 500 with "Failed to generate matches. Please try again"
- **Logging**: Error level with specific provisioning error details
- **Rollback**: Don't insert matches if provisioning fails

**Scenario 3: Database transaction failure**

- **Trigger**: Database constraint violation or connection error
- **Detection**: Error from Supabase insert operation
- **Response**: 500 with "Failed to generate matches. Please try again"
- **Logging**: Error level with database error details
- **Rollback**: Attempt to delete any provisioned accounts

**Scenario 4: Email sending failure**

- **Trigger**: Email service error
- **Detection**: Error from email sending function
- **Response**: 500 with custom message explaining accounts created but emails failed
- **Logging**: Error level with email service error
- **Action**: Matches and accounts still valid, admin notification needed

### Error Logging Strategy

All errors should be logged with:

- Timestamp
- User ID (if available)
- Draw ID
- Error type and message
- Stack trace (for 500 errors)
- Request metadata (IP, user agent)

Use structured logging for easy querying:

```typescript
logger.error({
  endpoint: "POST /api/draws/:drawId/match",
  drawId,
  userId,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
});
```

## 8. Performance Considerations

### Bottlenecks

1. **Account Provisioning**
   - Creating multiple user accounts sequentially is slow
   - Each account creation involves network round-trip to Supabase Auth
   - **Optimization**: Batch user creation if Supabase supports it, or use Promise.all() for parallel creation

2. **Email Sending**
   - Sending multiple invitation emails can take time
   - Synchronous email sending blocks response
   - **Optimization**: Use background job queue (e.g., Supabase Edge Functions) for email sending

3. **Database Batch Insert**
   - Inserting many matches one-by-one is inefficient
   - Multiple round-trips to database
   - **Optimization**: Use single batch INSERT statement with multiple VALUES

4. **Transaction Overhead**
   - Long-running transactions can lock database resources
   - **Optimization**: Keep transaction scope minimal, release locks quickly

### Optimization Strategies

**Strategy 1: Parallel Account Provisioning**

```typescript
const provisioningPromises = participantsWithoutAccounts.map((participant) => createUserAccount(participant));
const provisionedAccounts = await Promise.all(provisioningPromises);
```

**Strategy 2: Batch Database Operations**

```typescript
// Instead of N inserts, do 1 batch insert
await supabase.from("matches").insert(matches); // Array of match objects
```

**Strategy 3: Asynchronous Email Sending**

```typescript
// Don't await email sending
sendInvitationEmails(provisionedAccounts).catch((error) => {
  logger.error("Email sending failed", error);
  // Notify admin via monitoring system
});
```

**Strategy 4: Caching Draw Data**

```typescript
// If draw data is needed multiple times, cache it
const draw = await fetchDraw(drawId);
// Use 'draw' throughout the request handler
```

## 9. Implementation Steps

### Step 1: Create Matching Service

**File**: `src/lib/services/matching.service.ts`

**Tasks**:

1. Create service file with proper TypeScript types
2. Implement `runMatchingAlgorithm()` function:
   - Accept array of participants
   - Validate minimum count (>= 3)
   - Implement Fisher-Yates shuffle
   - Generate circular assignments
   - Return array of match pairs
   - Add unit tests for algorithm correctness
3. Implement helper functions:
   - `shuffleArray()` for randomization
   - `generateSecurePassword()` for temporary passwords
   - `validateParticipantCount()` for business rule validation

**Expected Output**: Pure matching algorithm that's testable independently

### Step 2: Implement Account Provisioning Service

**File**: `src/lib/services/matching.service.ts` (add to existing)

**Tasks**:

1. Implement `provisionAccounts()` function:
   - Accept participants array and Supabase client
   - Filter participants where user_id is NULL
   - For each, create Supabase auth user
   - Store user_id mappings
   - Return provisioned accounts list
2. Implement `updateParticipantUserIds()` function:
   - Accept participant-to-user mappings
   - Update draw_participants table
   - Handle update failures
3. Add error handling for:
   - Email already exists
   - Invalid email format
   - Supabase auth API errors

**Expected Output**: Account provisioning that integrates with Supabase Auth

### Step 3: Implement Match Persistence Service

**File**: `src/lib/services/matching.service.ts` (add to existing)

**Tasks**:

1. Implement `saveMatches()` function:
   - Accept draw ID, match pairs, and Supabase client
   - Prepare batch insert statement
   - Execute insert with proper error handling
   - Handle constraint violations gracefully
2. Implement transaction logic (if supported):
   - Begin transaction
   - Execute all inserts
   - Commit on success, rollback on failure
3. Add validation for database constraints:
   - Check unique (draw_id, giver_id)
   - Check unique (draw_id, recipient_id)
   - Check giver_id <> recipient_id

**Expected Output**: Reliable match persistence with ACID properties

### Step 4: Create Main Orchestration Function

**File**: `src/lib/services/matching.service.ts` (add to existing)

**Tasks**:

1. Implement `generateMatches()` function:
   - Accept drawId and Supabase client
   - Orchestrate the entire matching process
   - Call runMatchingAlgorithm()
   - Call provisionAccounts()
   - Call saveMatches()
   - Implement comprehensive error handling
   - Return success/failure indicator
2. Implement rollback strategy:
   - If provisioning fails after algorithm runs, return error
   - If match save fails after provisioning, attempt to delete accounts
   - Log all failures for manual intervention if needed

**Expected Output**: Complete matching service ready for endpoint integration

### Step 5: Implement API Endpoint

**File**: `src/pages/api/draws/[drawId]/match.ts`

**Tasks**:

1. Create Astro API endpoint file
2. Add `export const prerender = false`
3. Implement POST handler:
   ```typescript
   export async function POST({ params, locals }: APIContext);
   ```
4. Extract and validate drawId:
   - Use Zod schema for validation
   - Return 400 for invalid format
5. Get authenticated user:
   - Use `locals.supabase.auth.getUser()`
   - Return 401 if not authenticated
6. Fetch draw and verify existence:
   - Query draws table
   - Return 404 if not found
7. Verify authorization:
   - Compare user.id with draw.author_id
   - Return 403 if not authorized
8. Check for existing matches:
   - Query matches table
   - Return 400 if matches exist
9. Fetch all participants:
   - Query draw_participants table
   - Validate minimum count (>= 3)
   - Return 400 if insufficient
10. Call matching service:
    - Pass drawId and supabase client
    - Handle service errors
    - Return 500 on failure
11. Return success response:
    - Return 200 with MessageDTO
12. Add error handling for all scenarios
13. Add proper TypeScript types

**Expected Output**: Fully functional API endpoint

### Step 6: Add Input Validation Schemas

**File**: `src/pages/api/draws/[drawId]/match.ts` (update)

**Tasks**:

1. Define Zod schema for path parameters:
   ```typescript
   const paramsSchema = z.object({
     drawId: z.string().uuid(),
   });
   ```
2. Validate params at the beginning of handler
3. Return appropriate error responses for validation failures

**Expected Output**: Robust input validation using Zod

### Step 7: Implement Email Invitation Service

## NOT VALID FOR MVP. Just mock this behaviour.

**File**: `src/lib/services/email.service.ts` (new or existing)

**Tasks**:

1. Implement `sendMatchInvitations()` function:
   - Accept list of provisioned accounts
   - For each account, prepare email content
   - Include temporary password
   - Include login link
   - Send email via email service (e.g., Supabase, SendGrid)
2. Implement email template:
   - Welcome message
   - Instructions for first login
   - Password change requirement
   - Link to participant's match view
3. Add error handling:
   - Log email failures
   - Don't fail entire operation if emails fail
   - Consider retry mechanism

**Expected Output**: Email invitation system for new participants

### Step 8: Add Comprehensive Error Handling

**File**: `src/pages/api/draws/[drawId]/match.ts` (update)

**Tasks**:

1. Wrap handler in try-catch block
2. Implement specific error handlers for:
   - Zod validation errors → 400
   - Authentication errors → 401
   - Authorization errors → 403
   - Not found errors → 404
   - Service errors → 500
3. Implement error logging:
   - Create logger utility if not exists
   - Log all errors with context
   - Include user ID, draw ID, error details
4. Return consistent error response format:
   - Use ApiErrorResponse type
   - Include error type and message

**Expected Output**: Robust error handling and logging

### Step 9: Add Unit Tests

**File**: `src/lib/services/matching.service.test.ts` (new)

**Tasks**:

1. Test `runMatchingAlgorithm()`:
   - Test with exactly 3 participants
   - Test with 10 participants
   - Test with 100 participants
   - Verify each person gives once and receives once
   - Verify no self-assignments
   - Test error handling for < 3 participants
2. Test `shuffleArray()`:
   - Verify randomization (run multiple times, check distribution)
   - Verify array length unchanged
   - Verify all elements present
3. Test `generateSecurePassword()`:
   - Verify length requirement
   - Verify character variety
   - Verify uniqueness (generate multiple, check no duplicates)
4. Mock Supabase client for integration tests:
   - Test successful account provisioning
   - Test email conflict handling
   - Test match persistence
   - Test transaction rollback

**Expected Output**: Comprehensive test coverage for matching service

### Step 10: Add Integration Tests

**File**: `src/pages/api/draws/[drawId]/match.test.ts` (new)

**Tasks**:

1. Test complete endpoint flow:
   - Create test draw with author
   - Add participants
   - Call endpoint as author
   - Verify matches created
   - Verify accounts provisioned
2. Test authentication:
   - Call endpoint without authentication
   - Verify 401 response
3. Test authorization:
   - Call endpoint as non-author
   - Verify 403 response
4. Test validation:
   - Call with invalid drawId
   - Verify 400 response
5. Test idempotency:
   - Call endpoint twice for same draw
   - Verify second call returns 400
6. Test insufficient participants:
   - Create draw with only 2 participants
   - Verify 400 response

**Expected Output**: End-to-end test coverage for endpoint

### Step 11: Add Documentation

**File**: Update relevant documentation files

**Tasks**:

1. Update API documentation:
   - Document endpoint in API reference
   - Include request/response examples
   - Document error codes and messages
2. Add code comments:
   - Document matching algorithm logic
   - Explain provisioning flow
   - Document security considerations
3. Update README if needed:
   - Document matching feature
   - Explain Secret Santa rules
4. Add inline JSDoc comments:
   - Document all public functions
   - Include parameter and return type descriptions

**Expected Output**: Comprehensive documentation for developers

### Step 12: Security Review and Testing

**Tasks**:

1. Review authentication implementation
2. Review authorization checks
3. Test rate limiting (if implemented)
4. Review input validation coverage
5. Test with malicious inputs:
   - SQL injection attempts
   - Invalid UUIDs
   - XSS attempts in parameters
6. Review logging for sensitive data exposure
7. Verify passwords never logged
8. Test CSRF protection

**Expected Output**: Security-hardened endpoint

## 10. Testing Checklist

### Unit Tests

- [ ] Matching algorithm with 3 participants
- [ ] Matching algorithm with 10+ participants
- [ ] Matching algorithm rejects < 3 participants
- [ ] Shuffle algorithm randomizes correctly
- [ ] Password generation meets security requirements
- [ ] All helper functions have tests

### Integration Tests

- [ ] Successful match generation end-to-end
- [ ] Authentication requirement enforced
- [ ] Authorization requirement enforced
- [ ] Draw not found returns 404
- [ ] Invalid drawId returns 400
- [ ] Existing matches returns 400
- [ ] Insufficient participants returns 400
- [ ] Account provisioning works correctly
- [ ] Match persistence works correctly

### Security Tests

- [ ] Unauthorized users blocked
- [ ] Non-authors blocked
- [ ] Invalid UUIDs rejected
- [ ] No sensitive data in logs
- [ ] CSRF protection works
- [ ] Rate limiting works (if implemented)

### Performance Tests

- [ ] Response time < 5s for 50 participants
- [ ] Handles concurrent requests
- [ ] No database deadlocks
- [ ] Memory usage acceptable

### Edge Cases

- [ ] Exactly 3 participants
- [ ] All participants already have accounts
- [ ] No participants have accounts
- [ ] Mix of participants with/without accounts
- [ ] Email conflicts during provisioning
- [ ] Network errors during provisioning
- [ ] Database errors during match save

## 12. Future Enhancements

### Matching Algorithm Improvements

- Support for exclusion lists (don't match certain pairs)
- Historical data (don't repeat matches from previous years)

### Operational Improvements

- Admin API to manually trigger matching
- Ability to regenerate matches (undo functionality)
- Audit log for all matching operations
- Detailed analytics on matching success rates

# Test Plan - JulklApp

## 1. Introduction and Testing Objectives

### 1.1 Purpose

This document defines the comprehensive testing strategy for JulklApp, a web application that automates Secret Santa event management for small groups (3-32 participants). The testing approach ensures the application meets functional requirements, maintains security standards, and delivers a reliable user experience.

### 1.2 Testing Objectives

- Verify all functional requirements outlined in the PRD
- Ensure security and data isolation between users (authors and participants)
- Validate the correctness of the matching algorithm
- Confirm proper integration with external services (Supabase, OpenRouter)
- Test error handling and edge cases
- Verify UI/UX components function correctly
- Ensure performance meets acceptable standards
- Validate data integrity and transaction atomicity

### 1.3 Quality Gates

- All critical and high-priority test cases must pass
- Code coverage minimum: 80% for business logic
- Zero critical security vulnerabilities
- All API endpoints must have integration tests
- Core business logic (matching, draw creation) must have 100% coverage

## 2. Scope of Testing

### 2.1 In Scope

#### Authentication & Authorization

- User registration for draw authors
- Login for authors and participants
- Logout functionality
- Password reset and forgot password flows
- First-time password setup for auto-provisioned participants
- Session management and cookie handling
- Row-level security policy enforcement

#### Draw Management

- Draw creation with 3-32 participants
- Participant data validation
- Drawing list retrieval for authors
- Draw immutability after matching
- Gift preference text limit (10,000 characters)

#### Matching Algorithm

- Random pairing generation
- No self-matching constraint
- One-to-one mapping enforcement
- Participant account provisioning
- Match result storage

#### Participant Experience

- View assigned recipient details
- Access gift preferences
- AI-generated gift suggestions
- Suggestion caching and refresh

#### API Endpoints

- All REST endpoints defined in API plan
- Request validation (Zod schemas)
- Error responses and status codes
- Authentication and authorization checks

#### Frontend Components

- React components (forms, displays, navigation)
- Astro pages and layouts
- Client-side validation
- Error message display

### 2.2 Out of Scope

- Email delivery testing (third-party service)
- Browser compatibility testing (assumed modern browsers)
- Accessibility compliance testing (planned for future)
- Mobile responsiveness testing (basic coverage only)
- Internationalization/localization testing (English only for MVP)

## 3. Types of Tests

### 3.1 Unit Tests

**Framework**: Vitest

**Coverage**:

- Business logic in service layer
- Utility functions
- Schema validation (Zod)
- Helper functions
- Custom hooks

**Priority**: High

**Examples**:

- `matching.service.test.ts` - Matching algorithm logic
- `draw.service.test.ts` - Draw CRUD operations
- `draw.schema.test.ts` - Input validation schemas
- `useDraws.test.ts` - Custom React hooks

### 3.2 Integration Tests

**Framework**: Vitest with mocked external dependencies

**Coverage**:

- API endpoint flows
- Service layer interactions with database
- Authentication flows
- Multi-step operations (draw creation + matching)

**Priority**: Critical

**Focus Areas**:

- API request/response cycles
- Database transaction handling
- Error propagation
- Authentication middleware

### 3.3 Component Tests

**Framework**: React Testing Library + Vitest

**Coverage**:

- React component rendering
- User interactions (clicks, form submissions)
- State management
- Conditional rendering
- Error state display

**Priority**: Medium

**Examples**:

- `RegisterForm.tsx` - Registration form interactions
- `CreatedDrawsView.test.tsx` - Draw list display
- `MatchButton.test.tsx` - Match triggering UI

### 3.4 End-to-End Tests

**Framework**: Playwright (recommended for future implementation)

**Coverage**:

- Complete user journeys
- Authentication flows
- Draw creation to match viewing
- Multi-page workflows

**Priority**: Medium (planned for post-MVP)

### 3.5 Security Tests

**Approach**: Manual security review + automated checks

**Coverage**:

- Row-level security policies
- Authorization checks
- SQL injection prevention
- XSS prevention
- CSRF protection
- Session hijacking prevention

**Priority**: Critical

### 3.6 API Contract Tests

**Approach**: Schema validation tests

**Coverage**:

- Request/response DTOs
- API error responses
- Type safety verification

**Priority**: High

## 4. Test Scenarios for Key Functionalities

### 4.1 User Registration (Draw Author)

#### TC-AUTH-001: Successful Registration

- **Precondition**: User not registered
- **Steps**:
  1. Navigate to `/register`
  2. Enter valid email and password
  3. Confirm password
  4. Accept terms and conditions
  5. Submit form
- **Expected**: User created, redirected to dashboard, session established
- **Priority**: Critical

#### TC-AUTH-002: Registration Validation

- **Test Cases**:
  - Invalid email format
  - Password too short (< 8 characters)
  - Passwords don't match
  - Terms not accepted
  - Duplicate email
- **Expected**: Appropriate error messages displayed
- **Priority**: High

### 4.2 User Login

#### TC-AUTH-010: Successful Login (Author)

- **Precondition**: Registered author account exists
- **Steps**:
  1. Navigate to `/login`
  2. Enter valid credentials
  3. Submit form
- **Expected**: Redirected to dashboard, session created
- **Priority**: Critical

#### TC-AUTH-011: Successful Login (Participant - First Time)

- **Precondition**: Auto-provisioned participant account
- **Steps**:
  1. Navigate to `/login`
  2. Enter temporary credentials
  3. Redirected to set password page
  4. Set new password
  5. Submit
- **Expected**: Password updated, redirected to matches page
- **Priority**: Critical

#### TC-AUTH-012: Login Validation

- **Test Cases**:
  - Invalid credentials
  - Non-existent email
  - Empty fields
  - Account locked (if implemented)
- **Expected**: Appropriate error messages
- **Priority**: High

### 4.3 Draw Creation

#### TC-DRAW-001: Create Valid Draw

- **Precondition**: Authenticated author
- **Steps**:
  1. Navigate to create draw page
  2. Enter draw name
  3. Add 5 participants with valid data
  4. Submit
- **Expected**: Draw created, ID returned, participants saved
- **Priority**: Critical

#### TC-DRAW-002: Participant Count Validation

- **Test Cases**:
  - Less than 3 participants
  - More than 32 participants
  - Exactly 3 participants (boundary)
  - Exactly 32 participants (boundary)
- **Expected**: Appropriate validation errors or success
- **Priority**: High

#### TC-DRAW-003: Gift Preference Length Validation

- **Test Cases**:
  - Exactly 10,000 characters (boundary)
  - 10,001 characters (exceeds limit)
  - Empty gift preferences (allowed)
- **Expected**: Validation error or success
- **Priority**: Medium

#### TC-DRAW-004: Email Validation

- **Test Cases**:
  - Invalid email format
  - Duplicate emails in same draw
  - Empty email field
- **Expected**: Appropriate validation errors
- **Priority**: High

### 4.4 Matching Algorithm

#### TC-MATCH-001: Basic Matching (5 participants)

- **Precondition**: Draw created with 5 participants
- **Steps**:
  1. Execute matching endpoint
  2. Verify matches created
- **Expected**:
  - 5 matches created
  - Each participant gives to exactly one other
  - Each participant receives from exactly one other
  - No self-matches
- **Priority**: Critical

#### TC-MATCH-002: Minimum Participants (3)

- **Precondition**: Draw with exactly 3 participants
- **Steps**: Execute matching
- **Expected**: Valid circular matching created
- **Priority**: High

#### TC-MATCH-003: Maximum Participants (32)

- **Precondition**: Draw with 32 participants
- **Steps**: Execute matching
- **Expected**: All 32 participants matched correctly
- **Priority**: High

#### TC-MATCH-004: No Self-Matching

- **Precondition**: Any valid draw
- **Steps**:
  1. Execute matching
  2. Check all match pairs
- **Expected**: No participant.id == match.recipient_id
- **Priority**: Critical

#### TC-MATCH-005: Idempotency

- **Precondition**: Draw with matches already created
- **Steps**: Attempt to execute matching again
- **Expected**: 400 error, no new matches created
- **Priority**: High

#### TC-MATCH-006: Participant Provisioning

- **Precondition**: Draw with 3 new participants (no accounts)
- **Steps**:
  1. Execute matching
  2. Check auth.users table
- **Expected**:
  - 3 new user accounts created
  - `email_confirmed_at` set
  - `role='participant'` in metadata
  - `password_set=false` in metadata
- **Priority**: Critical

#### TC-MATCH-007: Existing User Linking

- **Precondition**: Participant email matches existing user
- **Steps**: Execute matching
- **Expected**: Participant linked to existing user_id, no new account created
- **Priority**: High

#### TC-MATCH-008: Transaction Atomicity

- **Test Cases**:
  - Database error during match creation
  - Error during user provisioning
  - Partial match creation failure
- **Expected**: All changes rolled back, no partial state
- **Priority**: Critical

### 4.5 Security & Authorization

#### TC-SEC-001: Author Can Only See Own Draws

- **Precondition**: Two authors with draws
- **Steps**:
  1. Author A requests Author B's draw
- **Expected**: 403 Forbidden
- **Priority**: Critical

#### TC-SEC-002: Participant Can Only See Own Match

- **Precondition**: Draw with matches
- **Steps**:
  1. Participant A requests Participant B's match
- **Expected**: 403 Forbidden or no data returned
- **Priority**: Critical

#### TC-SEC-003: Unauthenticated Access

- **Test Cases**:
  - Access protected pages without session
  - Call API endpoints without auth
- **Expected**: 401 Unauthorized, redirect to login
- **Priority**: Critical

#### TC-SEC-004: Author Cannot View Matches

- **Precondition**: Author's draw with matches
- **Steps**: Author attempts to view match details
- **Expected**: No match information revealed to author
- **Priority**: High

## 5. Test Environment

### 5.1 Development Environment

- **Purpose**: Local development and unit testing
- **Setup**:
  - Node.js 22.14.0 (per `.nvmrc`)
  - Local Supabase instance or development project
  - Mock OpenRouter API responses
  - In-memory test database (Vitest)

### 5.2 Staging Environment

- **Purpose**: Integration and E2E testing
- **Setup**:
  - Separate Supabase project
  - OpenRouter API (test account with limits)
  - Deployed on test server (DigitalOcean)
  - Test data seeding scripts

### 5.3 Test Data

- **Authors**:
  - Minimum 3 test author accounts
  - Various draw creation scenarios
- **Participants**:
  - Pre-created participant accounts
  - New participants for provisioning tests
  - Edge case emails (special characters, long domains)
- **Draws**:
  - Draws with 3, 5, 10, 32 participants
  - Draws in various states (created, matched)
  - Draws with mixed existing/new participants

### 5.4 Mock Services

- **Supabase Admin Client**: Mock for user provisioning tests
- **OpenRouter API**: Mock responses for AI suggestion tests
- **Email Service**: Mock for notification verification

## 6. Testing Tools

### 6.1 Test Frameworks

- **Vitest** (v4.0.6): Primary test runner
  - Fast, ESM-native
  - Built-in TypeScript support
  - Watch mode for development
- **@testing-library/react** (v16.3.0): Component testing
  - User-centric testing approach
  - Accessible queries
- **@testing-library/jest-dom** (v6.9.1): DOM matchers

### 6.2 Development Tools

- **TypeScript**: Type checking in tests
- **ESLint**: Test code quality
- **Vitest UI** (@vitest/ui): Visual test interface

### 6.3 Mocking Libraries

- **Vitest mocks**: Built-in mocking capabilities
- **vi.fn()**: Function mocking
- **vi.mock()**: Module mocking

### 6.4 CI/CD Integration

- **GitHub Actions**: Automated test execution
- **Pre-commit hooks** (Husky + lint-staged): Test execution before commits

### 6.5 Test Utilities

- **jsdom** (v27.1.0): DOM simulation for Node.js
- **Custom test helpers**: Shared setup and teardown functions

## 7. Test Schedule

### 7.1 Continuous Testing

- **Unit tests**: Run on every file save (watch mode)
- **Pre-commit**: Run affected tests before commit
- **Pre-push**: Run full test suite before push

### 7.2 CI Pipeline

- **On Pull Request**:
  - Run all unit tests
  - Run integration tests
  - Generate coverage report
  - Lint test files
- **On Merge to Main**:
  - Full test suite
  - Deploy to staging
  - Run smoke tests

### 7.3 Release Testing

- **Pre-release checklist**:
  - All automated tests pass
  - Manual security review
  - Critical path testing
  - Database migration testing

### 7.4 Regression Testing

- **Frequency**: Before each release
- **Scope**: All critical and high-priority test cases
- **Duration**: 2-4 hours (automated)

## 8. Test Acceptance Criteria

### 8.1 Unit Tests

- Minimum 80% code coverage for services
- 100% coverage for matching algorithm
- All edge cases documented and tested
- No skipped tests in main branch

### 8.2 Integration Tests

- All API endpoints have test coverage
- Happy path and error scenarios covered
- Database transaction tests pass
- Authentication flows validated

### 8.3 Component Tests

- All critical UI components tested
- User interactions simulated
- Error states rendered correctly
- Loading states handled

### 8.4 Performance Criteria

- Unit tests complete in < 5 seconds
- Integration tests complete in < 30 seconds
- Full test suite completes in < 2 minutes

### 8.5 Quality Metrics

- Zero critical bugs in production
- Test failure rate < 1% (flaky tests)
- Code coverage trends upward
- No security vulnerabilities

## 12. Risk Assessment and Mitigation

### 12.1 High-Risk Areas

#### Matching Algorithm

- **Risk**: Incorrect pairings or invalid matches
- **Impact**: Critical - breaks core functionality
- **Mitigation**:
  - 100% test coverage
  - Property-based testing
  - Multiple validation steps
  - Extensive edge case testing

#### Security & Authorization

- **Risk**: Data leakage between users
- **Impact**: Critical - privacy violation
- **Mitigation**:
  - Dedicated security test suite
  - Manual security review
  - RLS policy testing
  - Penetration testing (planned)

#### Participant Provisioning

- **Risk**: Account creation failures or partial provisioning
- **Impact**: High - participants cannot access system
- **Mitigation**:
  - Transaction atomicity tests
  - Rollback verification
  - Error handling tests
  - Retry mechanisms

#### AI API Integration

- **Risk**: Service unavailability or timeout
- **Impact**: Medium - suggestions unavailable
- **Mitigation**:
  - Retry logic with exponential backoff
  - Timeout handling
  - Graceful degradation
  - Cached fallbacks

## Appendix A: Test Case Template

```markdown
### Test Case ID: TC-[AREA]-[NUMBER]

**Title**: Descriptive test case name

**Priority**: Critical/High/Medium/Low

**Type**: Unit/Integration/Component/E2E/Security

**Preconditions**:

- Precondition 1
- Precondition 2

**Test Data**:

- Data requirement 1
- Data requirement 2

**Steps**:

1. Step 1
2. Step 2
3. Step 3

**Expected Result**:

- Expected outcome 1
- Expected outcome 2

**Actual Result**: (To be filled during execution)

**Status**: Pass/Fail/Blocked/Skipped

**Notes**: Additional observations
```

## Appendix B: Current Test Files

### Existing Test Coverage

- `src/lib/services/matching.service.test.ts` ✅
- `src/lib/services/draw.service.test.ts` ✅
- `src/lib/schemas/draw.schema.test.ts` ✅
- `src/pages/api/draws.test.ts` ✅
- `src/hooks/useDraws.test.ts` ✅
- `src/hooks/useDrawParticipants.test.ts` ✅
- `src/hooks/useDrawForm.test.ts` ✅
- `src/components/CreatedDraws/CreatedDrawsView.test.tsx` ✅
- `src/components/DrawParticipants/MatchStatusBadge.test.tsx` ✅
- `src/components/DrawParticipants/MatchButton.test.tsx` ✅

### Recommended Additional Tests

- Authentication endpoints (`/api/auth/*`)
- Participant endpoints
- Match endpoints
- AI suggestion endpoints
- RegisterForm component
- LoginForm component
- Middleware authentication
- Password reset flows

## Appendix C: Test Configuration

### vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.test.{ts,tsx}", "**/*.config.{ts,js}"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

**Document Version**: 1.0  
**Last Updated**: December 30, 2025  
**Next Review**: March 30, 2026  
**Owner**: Development Team

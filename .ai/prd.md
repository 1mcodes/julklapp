# Product Requirements Document (PRD) - JulklApp
## 1. Product Overview
JulklApp is a web application that automates the creation and management of Secret Santa events (draws) for small groups (3–32 participants). Draw authors can register, create events, and input participant details. After conducting the draw, participants are auto-provisioned accounts and can log in to view their assigned recipient along with AI-generated gift suggestions based on free-text preference letters. The application emphasizes simplicity, security, and future localization support.

## 2. User Problem
Friends and families organizing Secret Santa lack a simple, secure tool to:
- Collect participant information (name, surname, email, gift preferences).
- Ensure fair, one-to-one matching without self-matches.
- Share match results privately with each participant.
- Generate and display personalized gift suggestions without manual effort.
- Manage events without complex manual coordination or email confirmations.

## 3. Functional Requirements
- FR-001: User authentication and registration for draw authors via email/password.
- FR-002: Secure login for participants with first-time password setup.
- FR-003: Create Secret Santa draw with 3–32 participants.
- FR-004: Input and store participant details: name, surname, email (required), gift-preferences letter (plain text, max 10 000 chars).
- FR-005: Enforce participant count (min 3, max 32) and gift-preferences length limit at input.
- FR-006: Execute draw algorithm producing one distinct match per participant; prohibit self-matching.
- FR-007: Auto-provision participant accounts immediately after draw; require password set on first login.
- FR-008: Implement row-level security: authors see only their draws; participants see only their own match.
- FR-009: Display match results on a dedicated page for each participant.
- FR-010: Integrate AI gift suggestion via XHR to OpenRouter (configured in .env) with retry logic (up to 3 retries, 30 s timeout).
- FR-011: Cache AI suggestions indefinitely; provide manual refresh button without rate limiting.
- FR-012: Prevent authors from modifying or deleting draws after creation.
- FR-013: Wrap all UI strings in an i18n abstraction for future localization.

## 4. Product Boundaries
In scope:
- Email/password authentication for authors and participants.
- Draw creation and participant management.
- AI-based gift suggestions with caching and refresh.
- Row-level security policies in the database.
- English UI with i18n support.

Out of scope:
- Email confirmation workflow for participation.
- Participant exclusion rules and validation of mutual exclusions.
- Budget handling for gifts.
- Draw modification or deletion after creation.

## 5. User Stories
- ID: US-001
  Title: Author registration and login
  Description: As a draw author, I want to register and log in with my email and password so that I can securely manage my events.
  Acceptance Criteria:
  - Given a new author, when I provide a valid email and password, then my account is created.
  - Given an existing author, when I enter correct credentials, then I am granted access.
  - Given incorrect credentials, when I attempt to log in, then I see an error message.

- ID: US-002
  Title: Create a new Secret Santa draw
  Description: As an author, I want to create a draw specifying 3–32 participants so that I can set up an event.
  Acceptance Criteria:
  - Given 3–32 valid participant entries, when I submit, then the draw is created successfully.
  - Given fewer than 3 or more than 32 participants, when I attempt to submit, then I see a validation error.

- ID: US-003
  Title: Input participant details
  Description: As an author, I want to enter each participant's name, surname, email, and gift preferences so that the draw has all required data.
  Acceptance Criteria:
  - Given missing required fields, when I try to save, then I see field-level validation errors.
  - Given a gift-preferences letter exceeding 10 000 characters, when I save, then I see a length validation error.

- ID: US-004
  Title: Prohibit draw modifications
  Description: As an author, I must not be able to modify or delete a draw after creation to ensure consistency.
  Acceptance Criteria:
  - Given a completed draw, when I view options, then edit and delete actions are disabled or hidden.

- ID: US-005
  Title: Perform matching algorithm
  Description: As a draw created, I want to generate one distinct match per participant and prevent self-matching so that assignments are fair.
  Acceptance Criteria:
  - Given N participants, when the draw runs, then each participant receives exactly one unique match and no one is matched to themselves.

- ID: US-006
  Title: Auto-provision participant accounts
  Description: As a system, after draw completion, I need to create accounts for participants so they can log in.
  Acceptance Criteria:
  - Given a completed draw, when event ends, then participant accounts exist but require password setup.

- ID: US-007
  Title: Participant first-time password setup
  Description: As a participant, I want to set my password on first login so that I can secure my account.
  Acceptance Criteria:
  - Given an auto-provisioned account, when I first log in, then I am prompted to set a password before accessing results.

- ID: US-008
  Title: Participant login and view match
  Description: As a participant, I want to log in and view my assigned match and their gift preferences so that I know who to buy for.
  Acceptance Criteria:
  - Given valid credentials, when I log in, then I see my match name, email, and gift-preferences summary.

- ID: US-009
  Title: Generate AI gift suggestions
  Description: As a participant, I want personalized gift suggestions based on the preference letter so that I get helpful ideas.
  Acceptance Criteria:
  - Given a valid preference letter, when I view results, then AI suggestions appear.
  - If the AI call fails after 3 retries, then I see a friendly error message.

- ID: US-010
  Title: Manual refresh of AI suggestions
  Description: As a participant, I want to refresh my gift suggestions on demand so that I can get new ideas.
  Acceptance Criteria:
  - Given cached suggestions, when I click refresh, then a new AI call is made and results update.

- ID: US-011
  Title: Enforce row-level security
  Description: As a system, I need to ensure authors see only their draws and participants see only their match so data is secure.
  Acceptance Criteria:
  - Given author identity, when querying draws, then only their draws are returned.
  - Given participant identity, when querying match results, then only their assignment is returned.

- ID: US-012
  Title: View created draws on default page
  Description: As an author, I want to see a list of all draws I have created when I first access the application so that I can easily manage and track my events.
  Acceptance Criteria:
  - Given I am logged in as an author, when I access the default application page, then I see a list of all draws I have created.
  - Given no draws exist, when I access the default page, then I see an empty state with a call-to-action to create a new draw.
  - Given multiple draws exist, when I view the list, then draws are displayed with relevant information (e.g., draw name, date created, number of participants).

- ID: US-013
  Title: Redirect to draw participants page after creation
  Description: As an author, after successfully creating a draw, I want to be redirected to the draw participants page so that I can immediately view or manage the event details.
  Acceptance Criteria:
  - Given a draw is successfully created, when the creation process completes, then I am automatically redirected to the draw participants page.
  - Given the redirect occurs, when I arrive at the participants page, then I see confirmation of successful draw creation.
  - Given the redirect fails, when an error occurs, then I see an error message with an option to manually navigate to the draw.

## 6. Success Metrics
- Every participant has exactly one distinct match (100% match rate).
- Participants successfully log in and view results in at least 95% of attempts.
- AI suggestions load successfully within timeout in at least 90% of calls.
- Validation errors prevent invalid inputs in 100% of cases.

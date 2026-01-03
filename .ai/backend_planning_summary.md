<conversation_summary>

<decisions>
1. Target users are casual organizers (friends and families) across various ages and countries.
2. Participant data: name, surname, gift-preferences letter (up to 10 000 chars) and email. Email is a only one required field.
3. AI gift suggestions generated on the result page via XHR, saved to the database; suggestions remain valid indefinitely and can be manually refreshed.
4. Authentication: email/password for draw authors; participants auto-provisioned post-draw and set their password on first login; input validation and RLS applied.
5. Draw flow: author creates draw, inputs participants (3–32 people), runs draw; no draw modification or deletion permitted by authors.
6. Matching rules: each participant receives exactly one distinct match; self-matching prohibited; no other matching constraints in MVP.
7. UI: English only; gift preferences via a simple text area; all UI strings wrapped for future localization.
8. AI integration: uses OpenRouter with model and API key in .env; retry logic up to 3 attempts with 30 s timeout; no rate-limiting on refresh.
9. Config & secrets: all environment configuration and API keys stored in .env; no legal placeholders, accessibility targets, or performance SLAs in MVP.
10. MVP success criterion: every participant has one assigned match; AI suggestions are optional.
</decisions>

<matched_recommendations>

1. Map detailed user journeys for draw creation, participant onboarding, and result viewing.
2. Wrap all front-end strings in an i18n abstraction to future-proof localization.
3. Enforce participant count constraints (3–32) and implement validation to prevent self-matching.
4. Specify input schema for gift preferences (plain text, 10 000-character limit)
5. Establish caching and manual refresh logic for AI suggestions (infinite TTL with refresh button).
6. Draft and test RLS policies to restrict draw management to authors and match visibility to participants.
7. Implement error-handling and retry logic (3 retries, 30 s timeout) for AI calls.
8. Limit gift preference input to plain text to simplify sanitization.
9. Adopt centralized .env-based secret management for API keys and environment configuration.  
   </matched_recommendations>

<prd_planning_summary>
The MVP enables a registered draw author to create a Secret Santa event for 3–32 participants by entering names, surnames, and a free-text gift-preferences letter (up to 10 000 chars). After the draw, each participant is auto-provisioned an account for which user will set password on first login attempt. Authors cannot modify or delete draws once created.

Participants log in to view their assigned match and an AI-generated gift-suggestion summary. Suggestions are fetched via an XHR call to OpenRouter (configured via .env), cached indefinitely, and can be refreshed on demand without rate limiting. The UI is English-only but built on an i18n layer for future localization.

Security is enforced with email/password auth, input validation, and database row-level security to ensure authors see only their draws and participants see only their match. AI calls include up to three retries with a 30 s timeout.

The sole success metric for MVP is that every participant has exactly one distinct match; AI suggestions are optional and do not affect success measurement.
</prd_planning_summary>

<unresolved_issues>

- Detailed design and enforcement of row-level security policies.
- UX design for AI-failure error states and user messaging.
  </unresolved_issues>
  </conversation_summary>

<conversation_summary>
<decisions>

1. Unify draw authors and participants into a single `users` table with a `role` enum (`'author'`, `'participant'`).
2. Model participant membership in draws via a many-to-many join table `draw_participants` linking `draws` and `users`.
3. Store per-draw participant data (`gift_preferences`) on `draw_participants`.
4. Use a `matches` table referencing `draw_participants.id` for `giver_id` and `recipient_id`, with UNIQUE and CHECK constraints to enforce one-to-one, no self-matches.
5. Define `gift_preferences` as `TEXT` with `CHECK (char_length(gift_preferences) <= 10000)`.
6. Create an `ai_suggestions` table with `jsonb` response data, timestamp, and one-to-one FK to `matches.match_id`.
7. Add indexes on `users.email` (UNIQUE), `draw_participants.user_id`, `draw_participants.draw_id`, `matches.giver_id`, and `ai_suggestions.match_id`.
8. Omit table partitioning for MVP scale.
9. Implement simple RLS policies checking `user_id = current_user_id` on relevant tables.
10. Enforce data integrity via foreign keys and CHECK constraints; omit transactions in MVP.
    </decisions>

<matched_recommendations>

1. Unify users table with `role` enum.
2. Link participants to users and track first-time password flow.
3. Use a `matches` table with FK constraints and CHECK to prevent self-matches.
4. Use `TEXT` + CHECK constraint for `gift_preferences`.
5. Create `ai_suggestions` table with `jsonb` and one-to-one link to matches.
6. Add indexes on email and FK columns.
7. Enable RLS policies based on `user_id = current_user_id`.
8. Use foreign keys and CHECK constraints for integrity.
   </matched_recommendations>

<database_planning_summary>
Main requirements:

- Support Secret Santa draws (3–32 participants) with secure author and participant authentication.
- Store participant details and enforce gift-preference length.
- Generate and store one-to-one matches; provision participant accounts.
- Integrate and cache AI gift suggestions.
- Apply row-level security so authors see only their draws and participants see only their own match.

Key entities & relationships:

- `users` (id, email, password_hash, role, etc.)
- `draws` (id, author_id → users.id, created_at, …)
- `draw_participants` (id, draw_id → draws.id, user_id → users.id, name, surname, email, gift_preferences)
- `matches` (id, draw_id → draws.id, giver_id → draw_participants.id, recipient_id → draw_participants.id)
- `ai_suggestions` (id, match_id → matches.id, data jsonb, created_at)

Security & scalability:

- RLS policies check `user_id = current_user_id` on `draw_participants`, `matches`, `ai_suggestions`.
- Unique and CHECK constraints enforce participant counts, one-to-one matches, and gift-preference limits.
- Indexes on email and foreign keys ensure performant lookups.
- No partitioning needed for initial scale; plan for future if data grows.

Unresolved issues:

- How to track first-time password setup in `users` (e.g. `password_set_at` flag).
- Clarify auto-provisioning process: upserting `users.email` and syncing with `draw_participants.email`.
- Detail exact RLS policy definitions for authors on `draws` vs participants on `matches`.
  </database_planning_summary>

<unresolved_issues>

1. Mechanism to record first-time password setup in `users`.
2. Auto-provisioning workflow and email synchronization between `users` and `draw_participants`.
3. Precise RLS policy definitions for authors on `draws` and participants on `matches`.
   </unresolved_issues>
   </conversation_summary>

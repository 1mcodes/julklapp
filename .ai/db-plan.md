# 1. Tables

### 1.1 user_role_enum

```sql
CREATE TYPE user_role_enum AS ENUM ('author', 'participant');
```

### 1.2 users

This table is managed by Supabase Auth

- id: UUID, PRIMARY KEY, DEFAULT gen_random_uuid()
- email: TEXT, NOT NULL, UNIQUE
- password_hash: TEXT, NOT NULL
- role: user_role_enum, NOT NULL
- password_set_at: TIMESTAMP WITH TIME ZONE
- created_at: TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT now()

### 1.3 draws

- id: UUID, PRIMARY KEY, DEFAULT gen_random_uuid()
- author_id: UUID, NOT NULL, REFERENCES users(id) ON DELETE CASCADE
- name: TEXT, NOT NULL
- created_at: TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT now()

### 1.4 draw_participants

- id: UUID, PRIMARY KEY, DEFAULT gen_random_uuid()
- draw_id: UUID, NOT NULL, REFERENCES draws(id) ON DELETE CASCADE
- user_id: UUID, REFERENCES users(id) ON DELETE SET NULL
- name: TEXT, NOT NULL
- surname: TEXT, NOT NULL
- email: TEXT, NOT NULL
- gift_preferences: TEXT, NOT NULL, CHECK (char_length(gift_preferences) <= 10000)
- created_at: TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT now()

### 1.5 matches

- id: UUID, PRIMARY KEY, DEFAULT gen_random_uuid()
- draw_id: UUID, NOT NULL, REFERENCES draws(id) ON DELETE CASCADE
- giver_id: UUID, NOT NULL, REFERENCES draw_participants(id) ON DELETE CASCADE
- recipient_id: UUID, NOT NULL, REFERENCES draw_participants(id) ON DELETE CASCADE
- created_at: TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT now()

**Constraints:**

- UNIQUE (draw_id, giver_id)
- UNIQUE (draw_id, recipient_id)
- CHECK (giver_id <> recipient_id)

### 1.6 ai_suggestions

- id: UUID, PRIMARY KEY, DEFAULT gen_random_uuid()
- match_id: UUID, NOT NULL, UNIQUE, REFERENCES matches(id) ON DELETE CASCADE
- data: JSONB, NOT NULL
- created_at: TIMESTAMP WITH TIME ZONE, NOT NULL, DEFAULT now()

# 2. Relationships

- users (1) ↔ draws (many) via draws.author_id → users.id
- draws (1) ↔ draw_participants (many) via draw_participants.draw_id → draws.id
- users (1) ↔ draw_participants (many) via draw_participants.user_id → users.id
- draw_participants (1) ↔ matches (1) as giver: matches.giver_id → draw_participants.id
- draw_participants (1) ↔ matches (1) as recipient: matches.recipient_id → draw_participants.id
- matches (1) ↔ ai_suggestions (1) via ai_suggestions.match_id → matches.id

# 3. Indexes

- users.email (UNIQUE)
- draw_participants.draw_id
- draw_participants.user_id
- matches.draw_id
- matches.giver_id
- matches.recipient_id
- ai_suggestions.match_id (UNIQUE)

# 4. PostgreSQL Policies (Row-Level Security)

Enable RLS on all tables that should be scoped to the current user:

```sql
ALTER TABLE draws            ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions  ENABLE ROW LEVEL SECURITY;
```

### 4.1 draws

```sql
CREATE POLICY author_select ON draws
  FOR SELECT USING (author_id = auth.uid());
CREATE POLICY author_modify ON draws
  FOR INSERT, UPDATE, DELETE USING (author_id = auth.uid());
```

### 4.2 draw_participants

```sql
-- Authors can view all participants in their draws
CREATE POLICY author_view_participants ON draw_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM draws
      WHERE draws.id = draw_participants.draw_id
        AND draws.author_id = auth.uid()
    )
  );

-- Participants can view and update their own record
CREATE POLICY participant_self_manage ON draw_participants
  FOR SELECT, UPDATE USING (user_id = auth.uid());
```

### 4.3 matches

```sql
-- Authors can view all matches in their draws
CREATE POLICY author_view_matches ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM draws
      WHERE draws.id = matches.draw_id
        AND draws.author_id = auth.uid()
    )
  );

-- Participants can view their own match
CREATE POLICY participant_view_match ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM draw_participants
      WHERE draw_participants.id = matches.giver_id
        AND draw_participants.user_id = auth.uid()
    )
  );
```

### 4.4 ai_suggestions

```sql
-- Authors can view suggestions for matches in their draws
CREATE POLICY author_view_suggestions ON ai_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      JOIN draws ON matches.draw_id = draws.id
      WHERE ai_suggestions.match_id = matches.id
        AND draws.author_id = auth.uid()
    )
  );

-- Participants can view suggestions for their own match
CREATE POLICY participant_view_suggestions ON ai_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      JOIN draw_participants ON matches.giver_id = draw_participants.id
      WHERE ai_suggestions.match_id = matches.id
        AND draw_participants.user_id = auth.uid()
    )
  );
```

# 5. Additional Notes

- All UUID primary keys use `gen_random_uuid()` (ensure the `pgcrypto` extension is enabled).
- Gift preferences are limited to 10,000 characters via a CHECK constraint.
- Denormalization is avoided; schema is in 3NF.
- Foreign key `ON DELETE CASCADE` ensures related records are cleaned up when a parent is removed.
- RLS policies use `auth.uid()` (Supabase) to scope access securely.

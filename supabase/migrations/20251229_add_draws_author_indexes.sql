-- migration: add indexes for draws table to optimize author queries
-- created at: 2025-12-29
-- purpose: improve performance of getDrawsByAuthor queries

-- Add index on author_id for faster filtering
create index if not exists idx_draws_author_id on public.draws(author_id);

-- Add composite index for author_id + created_at for efficient sorted queries
create index if not exists idx_draws_author_created on public.draws(author_id, created_at desc);


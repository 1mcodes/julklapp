-- migration: allow authors to insert participants in their draws
-- created at: 2025-12-30
-- purpose: fix RLS policy to allow draw authors to insert participants when creating a draw

-- add policy for authors to insert participants in their draws
create policy author_insert_participants on draw_participants for insert with check (
  exists (
    select 1 from draws
    where draws.id = draw_participants.draw_id
      and draws.author_id = auth.uid()
  )
);

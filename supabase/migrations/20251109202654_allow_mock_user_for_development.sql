-- migration: allow mock user for development
-- created at: 2025-11-09 20:26:54 utc
-- purpose: allow the mock user id '00000000-0000-0000-0000-000000000000' to bypass rls for development testing

-- allow mock user to modify draws
create policy mock_user_modify_draws on draws for all using (
  author_id = '00000000-0000-0000-0000-000000000000'::uuid
);

-- allow mock user to view and modify participants in their draws
create policy mock_user_manage_participants on draw_participants for all using (
  exists (
    select 1 from draws
    where draws.id = draw_participants.draw_id
      and draws.author_id = '00000000-0000-0000-0000-000000000000'::uuid
  )
);

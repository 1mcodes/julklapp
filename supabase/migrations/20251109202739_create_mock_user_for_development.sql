-- migration: create mock user for development
-- created at: 2025-11-09 20:27:39 utc
-- purpose: create a mock user in auth.users table for development testing

-- insert mock user for development testing
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'mock@example.com',
  '$2a$10$example.hash.for.mock.user',
  now(),
  now(),
  now(),
  '{"provider": "mock", "providers": ["mock"]}'::jsonb,
  '{}'::jsonb,
  'authenticated',
  'authenticated'
)
on conflict (id) do nothing;

-- Temporary policies to allow anonymous access for development
-- TODO: Remove these and use proper authentication before production

-- Allow anonymous inserts to matches table
create policy anon_insert_matches on matches for insert 
  with check (true);

-- Allow anonymous reads from matches table
create policy anon_select_matches on matches for select 
  using (true);



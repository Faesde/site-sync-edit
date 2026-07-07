-- Allow the frontend Supabase client to read the auth-related wiki tables.
-- RLS policies still restrict rows to the current user or admins.
grant usage on schema wiki to anon, authenticated;

grant select on table wiki.profiles to anon, authenticated;
grant select on table wiki.user_roles to anon, authenticated;
grant select on table wiki.subscriptions to anon, authenticated;

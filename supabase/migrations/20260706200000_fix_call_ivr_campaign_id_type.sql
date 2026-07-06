-- Align IVR campaign ids with the application-generated campaign ids.
-- The app uses text ids like "campaign_<user_id>_<timestamp>_<suffix>",
-- so this column cannot remain UUID without breaking call/IVR campaigns.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'wiki'
      and table_name = 'call_ivr_config'
      and column_name = 'campaign_id'
      and data_type = 'uuid'
  ) then
    alter table wiki.call_ivr_config
      alter column campaign_id type text using campaign_id::text;
  end if;
end $$;

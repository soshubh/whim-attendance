alter table public.office_settings
add column if not exists weekly_off_rules jsonb not null default '[]'::jsonb;

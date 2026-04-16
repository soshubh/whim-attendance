alter table public.profiles
add column if not exists is_deactivated boolean;

update public.profiles
set is_deactivated = false
where is_deactivated is null;

alter table public.profiles
alter column is_deactivated set default false;

alter table public.profiles
alter column is_deactivated set not null;

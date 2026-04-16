alter table public.profiles
add column if not exists role text;

update public.profiles
set role = 'user'
where role is null;

alter table public.profiles
alter column role set default 'user';

alter table public.profiles
alter column role set not null;

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('admin', 'user'));

create index if not exists profiles_role_idx
on public.profiles (role);

-- Promote specific users manually after the column exists.
-- Example:
-- update public.profiles
-- set role = 'admin'
-- where id in ('your-user-uuid');

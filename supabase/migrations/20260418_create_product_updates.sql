create table if not exists public.product_updates (
  id uuid primary key default gen_random_uuid(),
  meta text not null,
  title text not null,
  copy text not null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists product_updates_published_at_idx
on public.product_updates (published_at desc);

create or replace function public.set_product_updates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_product_updates_updated_at on public.product_updates;

create trigger set_product_updates_updated_at
before update on public.product_updates
for each row
execute function public.set_product_updates_updated_at();

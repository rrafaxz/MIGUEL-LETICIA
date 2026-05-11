-- Pedro & Maynara RSVP seed
-- Rode este arquivo no SQL Editor do Supabase.
-- Para substituir membros provisórios por nomes reais depois, edite a tabela
-- public.guests no Supabase ou altere os arrays deste seed antes de rodar novamente.

create extension if not exists pgcrypto;
create extension if not exists unaccent;

create or replace function public.rsvp_search_name(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(unaccent(coalesce(value, '')), '\s+', ' ', 'g'));
$$;

create table if not exists public.guest_groups (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  search_name text not null,
  is_confirmed boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.guest_groups(id) on delete cascade,
  full_name text not null,
  attendance_status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.guest_groups
  add column if not exists search_name text;

alter table public.guest_groups
  alter column search_name set default '';

update public.guest_groups
set search_name = public.rsvp_search_name(display_name)
where search_name is null or search_name = '';

alter table public.guest_groups
  alter column search_name set not null;

alter table public.guest_groups
  add column if not exists is_confirmed boolean not null default false;

alter table public.guest_groups
  add column if not exists confirmed_at timestamptz;

alter table public.guest_groups
  add column if not exists created_at timestamptz not null default now();

alter table public.guests
  add column if not exists attendance_status text not null default 'pending';

alter table public.guests
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'guests_attendance_status_check'
      and conrelid = 'public.guests'::regclass
  ) then
    alter table public.guests
      add constraint guests_attendance_status_check
      check (attendance_status in ('pending', 'going', 'not_going'));
  end if;
end $$;

create unique index if not exists guest_groups_display_name_uidx
  on public.guest_groups(display_name);

create unique index if not exists guests_group_full_name_uidx
  on public.guests(group_id, full_name);

alter table public.guest_groups enable row level security;
alter table public.guests enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.guest_groups to anon, authenticated;
grant select on public.guests to anon, authenticated;
grant update (is_confirmed, confirmed_at) on public.guest_groups to anon, authenticated;
grant update (attendance_status) on public.guests to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'guest_groups'
      and policyname = 'guest groups are readable'
  ) then
    create policy "guest groups are readable"
      on public.guest_groups
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'guests'
      and policyname = 'guests are readable'
  ) then
    create policy "guests are readable"
      on public.guests
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'guest_groups'
      and policyname = 'unconfirmed groups can be confirmed once'
  ) then
    create policy "unconfirmed groups can be confirmed once"
      on public.guest_groups
      for update
      to anon, authenticated
      using (is_confirmed = false)
      with check (
        is_confirmed = true
        and confirmed_at is not null
        and not exists (
          select 1
          from public.guests g
          where g.group_id = guest_groups.id
            and g.attendance_status = 'pending'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'guests'
      and policyname = 'guests can be updated before group confirmation'
  ) then
    create policy "guests can be updated before group confirmation"
      on public.guests
      for update
      to anon, authenticated
      using (
        exists (
          select 1
          from public.guest_groups gg
          where gg.id = guests.group_id
            and gg.is_confirmed = false
        )
      )
      with check (attendance_status in ('pending', 'going', 'not_going'));
  end if;
end $$;

with seed_groups(display_name, members) as (
  values
    ('Família Batista', array['Família Batista']::text[]),
    ('Darlan e família', array['Darlan', 'Família de Darlan']::text[]),
    ('Pedro Elquer e família', array['Pedro Elquer', 'Família de Pedro Elquer']::text[]),
    ('André Gomes e família', array['André Gomes', 'Família de André Gomes']::text[]),
    ('Dayrton e Esposa', array['Dayrton', 'Esposa de Dayrton']::text[]),
    ('Iliana Correia e família', array['Iliana Correia', 'Família de Iliana Correia']::text[]),
    ('Bernadete', array['Bernadete']::text[]),
    ('Florací e Adriana', array['Florací', 'Adriana']::text[]),
    ('Gamaliel e família', array['Gamaliel', 'Família de Gamaliel']::text[]),
    ('Irmã Ana e família', array['Irmã Ana', 'Família de Irmã Ana']::text[]),
    ('Nauritânia e família', array['Nauritânia', 'Família de Nauritânia']::text[]),
    ('Claucí e família', array['Claucí', 'Família de Claucí']::text[]),
    ('Ana Maria e família', array['Ana Maria', 'Família de Ana Maria']::text[]),
    ('Cristina', array['Cristina']::text[]),
    ('Raquel Batista e família', array['Raquel Batista', 'Família de Raquel Batista']::text[]),
    ('Alzeno', array['Alzeno']::text[]),
    ('Ducarmo', array['Ducarmo']::text[]),
    ('Iolanda e esposo', array['Iolanda', 'Esposo de Iolanda']::text[]),
    ('Bento', array['Bento']::text[]),
    ('Antônio Augusto e esposa', array['Antônio Augusto', 'Esposa de Antônio Augusto']::text[]),
    ('Mãe Lay e família', array['Mãe Lay', 'Família de Mãe Lay']::text[]),
    ('Pai Flaésio', array['Pai Flaésio']::text[]),
    ('Vó Laura e Vô Ducílio', array['Vó Laura', 'Vô Ducílio']::text[]),
    ('Flávia e família', array['Flávia', 'Família de Flávia']::text[]),
    ('Wesley e família', array['Wesley', 'Família de Wesley']::text[]),
    ('Bruna e família', array['Bruna', 'Família de Bruna']::text[]),
    ('Fagner e família', array['Fagner', 'Família de Fagner']::text[]),
    ('Fábio e família', array['Fábio', 'Família de Fábio']::text[]),
    ('Marlin', array['Marlin']::text[]),
    ('Tia Maria', array['Tia Maria']::text[]),
    ('Valéria e família', array['Valéria', 'Família de Valéria']::text[]),
    ('Juan', array['Juan']::text[]),
    ('Fabiula e família', array['Fabiula', 'Família de Fabiula']::text[]),
    ('Verônica', array['Verônica']::text[]),
    ('Vó Zuleide', array['Vó Zuleide']::text[]),
    ('Elias e família', array['Elias', 'Família de Elias']::text[]),
    ('Nailson', array['Nailson']::text[]),
    ('Lailson', array['Lailson']::text[]),
    ('Jailson e família', array['Jailson', 'Família de Jailson']::text[]),
    ('Natan', array['Natan']::text[]),
    ('Tainá e família', array['Tainá', 'Família de Tainá']::text[]),
    ('Lucas e família', array['Lucas', 'Família de Lucas']::text[]),
    ('Josué', array['Josué']::text[]),
    ('Paulo', array['Paulo']::text[]),
    ('Maxwell e Geovanna', array['Maxwell', 'Geovanna']::text[]),
    ('Rafael e Camila', array['Rafael', 'Camila']::text[]),
    ('Bruno', array['Bruno']::text[]),
    ('Nilza e Genésio', array['Nilza', 'Genésio']::text[]),
    ('Renato Belo e família', array['Renato Belo', 'Família de Renato Belo']::text[]),
    ('Rafael Santos e família', array['Rafael Santos', 'Família de Rafael Santos']::text[]),
    ('Regiane e família', array['Regiane', 'Família de Regiane']::text[]),
    ('Ednalva e família', array['Ednalva', 'Família de Ednalva']::text[]),
    ('Marlon e esposa', array['Marlon', 'Esposa de Marlon']::text[]),
    ('Maykon e esposa', array['Maykon', 'Esposa de Maykon']::text[]),
    ('Nailde', array['Nailde']::text[]),
    ('Paulo e Lorrane', array['Paulo', 'Lorrane']::text[]),
    ('Bruna', array['Bruna']::text[]),
    ('Mateus', array['Mateus']::text[]),
    ('Edmila', array['Edmila']::text[]),
    ('Lucas', array['Lucas']::text[]),
    ('Marcos', array['Marcos']::text[]),
    ('Emilly Moura', array['Emilly Moura']::text[]),
    ('Thalison', array['Thalison']::text[]),
    ('Kauany', array['Kauany']::text[]),
    ('Alberto e família', array['Alberto', 'Família de Alberto']::text[])
),
upsert_groups as (
  insert into public.guest_groups(display_name, search_name)
  select display_name, public.rsvp_search_name(display_name)
  from seed_groups
  on conflict (display_name) do update
    set search_name = excluded.search_name
  returning id, display_name
)
insert into public.guests(group_id, full_name, attendance_status)
select gg.id, member.member_name, 'pending'
from seed_groups sg
join public.guest_groups gg on gg.display_name = sg.display_name
cross join lateral unnest(sg.members) as member(member_name)
on conflict (group_id, full_name) do nothing;

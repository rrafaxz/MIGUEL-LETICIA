-- Miguel & Leticia RSVP setup
-- Rode este arquivo no SQL Editor do Supabase novo.
-- Ele cria a estrutura, cadastra a lista inicial de convidados e cria as views
-- usadas por admin-confirmacoes.html.
--
-- Importante: nao rode este arquivo sobre uma base com confirmacoes reais sem
-- revisar antes. O seed abaixo preserva respostas existentes quando encontra
-- o mesmo grupo/convidado, mas nao remove grupos antigos automaticamente.

create extension if not exists pgcrypto;
create extension if not exists unaccent;

create or replace function public.rsvp_search_name(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(unaccent(coalesce(value, '')), '\s+', ' ', 'g'));
$$;

drop view if exists public.rsvp_grupos_pendentes;
drop view if exists public.rsvp_grupos_mistos;
drop view if exists public.rsvp_grupos_que_nao_vao;
drop view if exists public.rsvp_grupos_que_vao;
drop view if exists public.rsvp_grupos_resumo;
drop view if exists public.rsvp_totais_por_lado;
drop view if exists public.rsvp_totais_gerais;
drop view if exists public.rsvp_admin_view;

create table if not exists public.guest_groups (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  search_name text not null,
  side text not null default 'Casal',
  category text not null default 'Convidados',
  group_type text not null default 'Grupo',
  sort_order integer not null default 0,
  notes text,
  is_confirmed boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.guest_groups(id) on delete cascade,
  full_name text not null,
  attendance_status text not null default 'pending',
  guest_order integer not null default 0,
  is_child boolean not null default false,
  is_baby boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.guest_groups
  add column if not exists search_name text,
  add column if not exists side text not null default 'Casal',
  add column if not exists category text not null default 'Convidados',
  add column if not exists group_type text not null default 'Grupo',
  add column if not exists sort_order integer not null default 0,
  add column if not exists notes text,
  add column if not exists is_confirmed boolean not null default false,
  add column if not exists confirmed_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

alter table public.guest_groups
  alter column search_name set default '';

update public.guest_groups
set search_name = public.rsvp_search_name(display_name)
where search_name is null or search_name = '';

alter table public.guest_groups
  alter column search_name set not null;

alter table public.guests
  add column if not exists attendance_status text not null default 'pending',
  add column if not exists guest_order integer not null default 0,
  add column if not exists is_child boolean not null default false,
  add column if not exists is_baby boolean not null default false,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now();

alter table public.guests
  drop constraint if exists guests_attendance_status_check;

alter table public.guests
  add constraint guests_attendance_status_check
  check (attendance_status in ('pending', 'yes', 'no', 'going', 'not_going'));

create unique index if not exists guest_groups_display_name_uidx
  on public.guest_groups(display_name);

create unique index if not exists guests_group_full_name_uidx
  on public.guests(group_id, full_name);

alter table public.guest_groups enable row level security;
alter table public.guests enable row level security;

drop policy if exists "guest groups are readable" on public.guest_groups;
drop policy if exists "guests are readable" on public.guests;
drop policy if exists "unconfirmed groups can be confirmed once" on public.guest_groups;
drop policy if exists "groups can be confirmed or updated" on public.guest_groups;
drop policy if exists "guests can be updated before group confirmation" on public.guests;
drop policy if exists "guests can update attendance status" on public.guests;

create policy "guest groups are readable"
  on public.guest_groups
  for select
  to anon, authenticated
  using (true);

create policy "guests are readable"
  on public.guests
  for select
  to anon, authenticated
  using (true);

create policy "groups can be confirmed or updated"
  on public.guest_groups
  for update
  to anon, authenticated
  using (true)
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

create policy "guests can update attendance status"
  on public.guests
  for update
  to anon, authenticated
  using (true)
  with check (attendance_status in ('pending', 'yes', 'no', 'going', 'not_going'));

grant usage on schema public to anon, authenticated;
grant select on public.guest_groups to anon, authenticated;
grant select on public.guests to anon, authenticated;
grant update (is_confirmed, confirmed_at) on public.guest_groups to anon, authenticated;
grant update (attendance_status) on public.guests to anon, authenticated;

with seed_groups(display_name, side, category, group_type, sort_order, members) as (
  values
    ('Família Eduardo', 'Miguel', 'Família noivo', 'Família', 10, array['Eduardo', 'Viviane', 'Anna Beatriz', 'Sahan', 'Daniel', 'Lívia', 'Bárbara']::text[]),
    ('Família Wilker', 'Miguel', 'Família noivo', 'Família', 20, array['Wilker', 'Miguel Souza', 'Rebeca', 'Davi (criança)', 'Elis (criança)', 'William']::text[]),
    ('Família Renato', 'Miguel', 'Família noivo', 'Família', 30, array['Renato', 'Helena', 'Lucca', 'Davi']::text[]),
    ('Família Rafael', 'Miguel', 'Família noivo', 'Família', 40, array['Rafael', 'Pâmela', 'Beijamim (criança)', 'Adam (bebê)']::text[]),
    ('Família Rafael Abut', 'Miguel', 'Família noivo', 'Família', 50, array['Rafael', 'Cristiane', 'Ana Clara', 'Daniela']::text[]),
    ('Família Leila', 'Miguel', 'Família noivo', 'Família', 60, array['Leila', 'Jardel', 'Rosângela']::text[]),
    ('Família Leonardo', 'Miguel', 'Família noivo', 'Família', 70, array['Leonardo', 'Josy', 'Maria Eduarda', 'Udson', 'Pedro']::text[]),
    ('Família José', 'Miguel', 'Família noivo', 'Família', 80, array['José', 'Luciana']::text[]),

    ('Lucca, Ana Clara e Jessica', 'Casal', 'Amigos do casal', 'Casal + acompanhante', 110, array['Lucca', 'Ana Clara', 'Jessica (mãe do Lucca)']::text[]),
    ('Arthur, Gabrielle e Thalita', 'Casal', 'Amigos do casal', 'Casal + acompanhante', 120, array['Arthur', 'Gabrielle', 'Thalita (irmã da Gabi)']::text[]),
    ('Victor Viana e Ana', 'Casal', 'Amigos do casal', 'Casal', 130, array['Victor Viana', 'Ana']::text[]),
    ('Gabriel e Emlly', 'Casal', 'Amigos do casal', 'Casal', 140, array['Gabriel', 'Emlly']::text[]),
    ('Rafael e Camila', 'Casal', 'Amigos do casal', 'Casal', 150, array['Rafael', 'Camila']::text[]),
    ('Vinicius e Fernanda', 'Casal', 'Amigos do casal', 'Casal', 160, array['Vinicius', 'Fernanda']::text[]),
    ('Família Ivan', 'Casal', 'Amigos do casal', 'Família', 170, array['Ivan', 'Lara', 'Alice (criança)', 'Helena (criança)']::text[]),
    ('Marsol e Laís', 'Casal', 'Amigos do casal', 'Solteira + acompanhante', 180, array['Marsol', 'Laís']::text[]),
    ('Sthefany', 'Casal', 'Amigos do casal', 'Solteira', 190, array['Sthefany']::text[]),
    ('Ana Beatriz', 'Casal', 'Amigos do casal', 'Solteira', 200, array['Ana Beatriz']::text[]),
    ('Isaac', 'Casal', 'Amigos do casal', 'Solteiro', 210, array['Isaac']::text[]),
    ('Diego', 'Casal', 'Amigos do casal', 'Solteiro', 220, array['Diego']::text[]),
    ('Frederico', 'Casal', 'Amigos do casal', 'Solteiro', 230, array['Frederico']::text[]),
    ('Abraão', 'Casal', 'Amigos do casal', 'Solteiro', 240, array['Abraão']::text[]),
    ('Arthur', 'Casal', 'Amigos do casal', 'Solteiro', 250, array['Arthur']::text[]),
    ('João Victor', 'Casal', 'Amigos do casal', 'Solteiro', 260, array['João Victor']::text[]),
    ('Gesyel', 'Casal', 'Amigos do casal', 'Solteiro', 270, array['Gesyel']::text[]),
    ('Adryele', 'Casal', 'Amigos do casal', 'Solteira', 280, array['Adryele']::text[])
),
upsert_groups as (
  insert into public.guest_groups(display_name, search_name, side, category, group_type, sort_order)
  select
    display_name,
    public.rsvp_search_name(display_name || ' ' || array_to_string(members, ' ')),
    side,
    category,
    group_type,
    sort_order
  from seed_groups
  on conflict (display_name) do update
    set search_name = excluded.search_name,
        side = excluded.side,
        category = excluded.category,
        group_type = excluded.group_type,
        sort_order = excluded.sort_order
  returning id, display_name
)
insert into public.guests(group_id, full_name, attendance_status, guest_order, is_child, is_baby, notes)
select
  gg.id,
  member.member_name,
  'pending',
  member.member_order::integer,
  public.rsvp_search_name(member.member_name) like '%crianca%',
  public.rsvp_search_name(member.member_name) like '%bebe%',
  case
    when public.rsvp_search_name(member.member_name) like '%crianca%' then 'criança'
    when public.rsvp_search_name(member.member_name) like '%bebe%' then 'bebê'
    else null
  end
from seed_groups sg
join public.guest_groups gg on gg.display_name = sg.display_name
cross join lateral unnest(sg.members) with ordinality as member(member_name, member_order)
on conflict (group_id, full_name) do update
  set guest_order = excluded.guest_order,
      is_child = excluded.is_child,
      is_baby = excluded.is_baby,
      notes = excluded.notes;

create or replace view public.rsvp_admin_view as
select
  gg.side as lado,
  gg.category as categoria,
  gg.group_type as tipo_grupo,
  gg.display_name as grupo,
  gg.display_name,
  gg.sort_order as ordem,
  gg.is_confirmed as grupo_ja_respondeu,
  gg.confirmed_at,
  gg.confirmed_at as ultima_atualizacao,
  g.full_name as convidado,
  g.full_name,
  g.attendance_status as status,
  g.attendance_status,
  g.guest_order as ordem_convidado,
  g.created_at as convidado_criado_em,
  g.is_child,
  g.is_baby,
  g.notes
from public.guest_groups gg
join public.guests g on g.group_id = gg.id;

create or replace view public.rsvp_totais_gerais as
select
  count(*) filter (where attendance_status in ('yes', 'going'))::integer as total_vai,
  count(*) filter (where attendance_status in ('no', 'not_going'))::integer as total_nao_vai,
  count(*) filter (where attendance_status = 'pending')::integer as total_pendente,
  count(*)::integer as total_convidados
from public.guests;

create or replace view public.rsvp_totais_por_lado as
select
  gg.side as lado,
  count(*) filter (where g.attendance_status in ('yes', 'going'))::integer as total_vai,
  count(*) filter (where g.attendance_status in ('no', 'not_going'))::integer as total_nao_vai,
  count(*) filter (where g.attendance_status = 'pending')::integer as total_pendente,
  count(*)::integer as total_convidados
from public.guest_groups gg
join public.guests g on g.group_id = gg.id
group by gg.side;

create or replace view public.rsvp_grupos_resumo as
select
  gg.side as lado,
  gg.category as categoria,
  gg.group_type as tipo_grupo,
  gg.display_name as grupo,
  gg.display_name,
  gg.sort_order as ordem,
  gg.is_confirmed as grupo_ja_respondeu,
  gg.confirmed_at,
  count(g.id)::integer as total_convidados,
  count(g.id) filter (where g.attendance_status in ('yes', 'going'))::integer as total_vai,
  count(g.id) filter (where g.attendance_status in ('no', 'not_going'))::integer as total_nao_vai,
  count(g.id) filter (where g.attendance_status = 'pending')::integer as total_pendente
from public.guest_groups gg
left join public.guests g on g.group_id = gg.id
group by gg.id;

create or replace view public.rsvp_grupos_que_vao as
select *
from public.rsvp_grupos_resumo
where total_convidados > 0
  and total_vai = total_convidados;

create or replace view public.rsvp_grupos_que_nao_vao as
select *
from public.rsvp_grupos_resumo
where total_convidados > 0
  and total_nao_vai = total_convidados;

create or replace view public.rsvp_grupos_mistos as
select *
from public.rsvp_grupos_resumo
where total_vai > 0
  and total_nao_vai > 0;

create or replace view public.rsvp_grupos_pendentes as
select *
from public.rsvp_grupos_resumo
where total_pendente > 0;

grant select on
  public.rsvp_admin_view,
  public.rsvp_totais_gerais,
  public.rsvp_totais_por_lado,
  public.rsvp_grupos_resumo,
  public.rsvp_grupos_que_vao,
  public.rsvp_grupos_que_nao_vao,
  public.rsvp_grupos_mistos,
  public.rsvp_grupos_pendentes
to anon, authenticated;

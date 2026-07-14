-- Miguel & Leticia RSVP repair: insert missing guests only.
-- Rode no SQL Editor do Supabase novo se public.guest_groups tem grupos,
-- mas public.guests esta vazia e rsvp_totais_gerais mostra 0 convidados.

create extension if not exists unaccent;

create or replace function public.rsvp_search_name(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(unaccent(coalesce(value, '')), '\s+', ' ', 'g'));
$$;

create unique index if not exists guest_groups_display_name_uidx
  on public.guest_groups(display_name);

create unique index if not exists guests_group_full_name_uidx
  on public.guests(group_id, full_name);

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

select count(*) as total_grupos from public.guest_groups;
select count(*) as total_convidados from public.guests;
select * from public.rsvp_totais_gerais;

-- N33a: grupos de alternativas na vaga ("1 de: AWS, GCP, Azure"; "2 de 4").
--
-- Um grupo junta itens equivalentes da mesma vaga e diz quantos o candidato
-- precisa ter (min_count). No score o grupo vale como UM item: peso = maior peso
-- dos itens, nota = media das min_count melhores notas dos itens. Obrigatorio
-- sem itens suficientes conta como obrigatorio ausente (score pela metade).
-- Os itens herdam o papel do grupo. Determinístico, sem IA (decisao de 06/10).
--
-- TODO(N18): job_skill_groups ganha org_id (ou company_id pelo NOVO-6).

-- ---------------------------------------------------------------------
-- 1) Tabela de grupos
-- ---------------------------------------------------------------------

create table if not exists public.job_skill_groups (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  min_count smallint not null default 1,
  role text not null default 'required',
  created_at timestamptz not null default now(),
  constraint job_skill_groups_min_count_check check (min_count between 1 and 10),
  constraint job_skill_groups_role_check check (role in ('required', 'preferred', 'implicit'))
);

create index if not exists job_skill_groups_job_idx on public.job_skill_groups (job_id);

comment on table public.job_skill_groups is
  'Grupos de alternativas da vaga (N33): o candidato precisa de min_count itens do grupo.';

drop trigger if exists job_skill_groups_audit on public.job_skill_groups;
create trigger job_skill_groups_audit
  after insert or update or delete on public.job_skill_groups
  for each row execute function public.write_audit_log();

alter table public.job_skill_groups enable row level security;

revoke all on public.job_skill_groups from public, anon, authenticated;
grant select, insert, update, delete on public.job_skill_groups to authenticated;

drop policy if exists "Users read groups of visible jobs" on public.job_skill_groups;
create policy "Users read groups of visible jobs"
  on public.job_skill_groups for select to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_skill_groups.job_id
      and (
        j.status = 'active'
        or (j.recruiter_id = (select auth.uid())
          and public.is_approved_recruiter((select auth.uid())))
      )
  ));

drop policy if exists "Approved recruiters manage groups on own jobs" on public.job_skill_groups;
create policy "Approved recruiters manage groups on own jobs"
  on public.job_skill_groups for all to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_skill_groups.job_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ))
  with check (exists (
    select 1 from public.jobs j
    where j.id = job_skill_groups.job_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ));

-- ---------------------------------------------------------------------
-- 2) Item no grupo: mesma vaga e papel do grupo
-- ---------------------------------------------------------------------

alter table public.job_skills
  add column if not exists group_id uuid references public.job_skill_groups (id) on delete set null;

create index if not exists job_skills_group_idx on public.job_skills (group_id)
  where group_id is not null;

-- Mesma regra do N31a, mais o grupo: o item precisa ser da vaga do grupo e
-- herda o papel dele.
create or replace function public.prepare_job_skill()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
  v_group_job uuid;
  v_group_role text;
begin
  select s.kind into v_kind from public.skills s where s.id = new.skill_id;
  if v_kind is not null and v_kind not in ('competency', 'tool') then
    raise exception 'skill_kind_not_scored'
      using errcode = '23514',
            hint = 'Requisito e ponto forte nao entram no score.';
  end if;

  if tg_op = 'INSERT' and new.mandatory and new.role = 'preferred' then
    new.role := 'required';
  elsif tg_op = 'UPDATE'
    and new.mandatory is distinct from old.mandatory
    and new.role is not distinct from old.role then
    new.role := case
      when new.mandatory then 'required'
      when old.role = 'required' then 'preferred'
      else old.role
    end;
  end if;

  if new.group_id is not null then
    select g.job_id, g.role into v_group_job, v_group_role
    from public.job_skill_groups g
    where g.id = new.group_id;

    if v_group_job is distinct from new.job_id then
      raise exception 'skill_group_other_job'
        using errcode = '23514',
              hint = 'O grupo precisa ser da mesma vaga do item.';
    end if;
    new.role := v_group_role;
  end if;

  new.mandatory := (new.role = 'required');
  return new;
end;
$$;

revoke all on function public.prepare_job_skill() from public, anon, authenticated;

-- Mudou o papel do grupo: os itens acompanham.
create or replace function public.sync_group_role_to_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.job_skills
  set role = new.role
  where group_id = new.id and role is distinct from new.role;
  return new;
end;
$$;

revoke all on function public.sync_group_role_to_items() from public, anon, authenticated;

drop trigger if exists job_skill_groups_sync_role on public.job_skill_groups;
create trigger job_skill_groups_sync_role
  after update of role on public.job_skill_groups
  for each row execute function public.sync_group_role_to_items();

-- ---------------------------------------------------------------------
-- 3) Score com grupos (paridade com calculateMatch em TypeScript)
-- ---------------------------------------------------------------------

create or replace function public.calculate_application_match_score(
  _job_id uuid,
  _candidate_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  with items as (
    select
      js.weight,
      js.mandatory,
      js.required_level,
      js.group_id,
      coalesce(
        case
          when cs.evidenced_by_project
            then least(3::numeric, cs.declared_level * 1.15)
          else cs.declared_level::numeric
        end,
        0
      ) as candidate_level
    from public.job_skills js
    left join public.candidate_skills cs
      on cs.skill_id = js.skill_id
      and cs.candidate_id = _candidate_id
    where js.job_id = _job_id
  ),
  ranked as (
    select
      i.*,
      least(i.candidate_level / i.required_level, 1) as ratio,
      row_number() over (
        partition by i.group_id
        order by least(i.candidate_level / i.required_level, 1) desc
      ) as rn,
      count(*) over (partition by i.group_id) as group_size
    from items i
  ),
  units as (
    -- Item fora de grupo: como antes.
    select
      r.weight,
      r.mandatory,
      r.ratio,
      (r.candidate_level = 0) as missing
    from ranked r
    where r.group_id is null
    union all
    -- Grupo: vale como um item, com a media das min_count melhores notas.
    select
      max(r.weight),
      bool_or(r.mandatory),
      sum(r.ratio) filter (where r.rn <= least(g.min_count, r.group_size))
        / least(g.min_count, max(r.group_size)),
      count(*) filter (where r.candidate_level > 0) < least(g.min_count, max(r.group_size))
    from ranked r
    join public.job_skill_groups g on g.id = r.group_id
    group by r.group_id, g.min_count
  ),
  totals as (
    select
      coalesce(sum(weight * ratio), 0) as partial_sum,
      coalesce(sum(weight), 0) as weight_sum,
      coalesce(bool_or(mandatory and missing), false) as missing_mandatory
    from units
  )
  select round(
    case
      when weight_sum = 0 then 0
      when missing_mandatory then (partial_sum / weight_sum) * 50
      else (partial_sum / weight_sum) * 100
    end,
    2
  )
  from totals;
$$;
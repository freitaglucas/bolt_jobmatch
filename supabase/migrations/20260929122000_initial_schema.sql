create type public.app_role as enum ('candidate', 'recruiter');
create type public.skill_category as enum ('hard', 'soft');
create type public.employment_type as enum ('CLT', 'PJ', 'Híbrido');
create type public.job_status as enum ('draft', 'active', 'paused', 'closed');
create type public.application_status as enum (
  'new_application',
  'screening',
  'interview',
  'final_interview',
  'approved',
  'rejected',
  'withdrawn'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.candidate_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_position text,
  location text,
  phone text,
  desired_positions text[] not null default '{}',
  years_of_experience numeric(4, 1) check (
    years_of_experience is null or years_of_experience >= 0
  ),
  seniority_general text,
  bio text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruiter_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  company_id uuid references public.companies (id) on delete restrict,
  position text,
  phone text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  category public.skill_category not null,
  description text,
  created_at timestamptz not null default now()
);

insert into public.skills (name, category) values
  ('Análise de Dados', 'hard'),
  ('AWS', 'hard'),
  ('Apresentações', 'soft'),
  ('Canvas', 'hard'),
  ('CI/CD', 'hard'),
  ('Design Thinking', 'soft'),
  ('Estratégia', 'soft'),
  ('Gestão de Projetos', 'hard'),
  ('Git', 'hard'),
  ('Inovação Aberta', 'soft'),
  ('Liderança', 'soft'),
  ('Mapeamento', 'hard'),
  ('Metodologias Ágeis', 'hard'),
  ('Negociação', 'soft'),
  ('Node.js', 'hard'),
  ('Parcerias', 'soft'),
  ('Pitch', 'soft'),
  ('PostgreSQL', 'hard'),
  ('Relacionamento', 'soft'),
  ('Startups', 'hard')
on conflict (name) do nothing;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.recruiter_profiles (user_id) on delete restrict,
  company_id uuid references public.companies (id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  location text not null default '',
  salary_range text,
  employment_type public.employment_type not null,
  status public.job_status not null default 'draft',
  pipeline_stages text[] not null default array[
    'new_application',
    'screening',
    'interview',
    'final_interview',
    'approved',
    'rejected'
  ],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_skills (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete restrict,
  required_level smallint not null check (required_level between 1 and 5),
  weight numeric(4, 2) not null check (weight between 0 and 10),
  mandatory boolean not null default false,
  created_at timestamptz not null default now(),
  unique (job_id, skill_id)
);

create table public.candidate_skills (
  candidate_id uuid not null references public.candidate_profiles (user_id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete restrict,
  declared_level smallint not null check (declared_level between 1 and 5),
  evidenced_by_project boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (candidate_id, skill_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete restrict,
  candidate_id uuid not null references public.candidate_profiles (user_id) on delete restrict,
  current_stage public.application_status not null default 'new_application',
  status public.application_status not null default 'new_application',
  match_score numeric(5, 2) not null default 0 check (match_score between 0 and 100),
  last_stage_change_at timestamptz not null default now(),
  feedback_sent_at timestamptz,
  silver_medalist boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create table public.application_stages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  previous_stage public.application_status,
  new_stage public.application_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  justification text,
  created_at timestamptz not null default now()
);

create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id uuid not null references public.recruiter_profiles (user_id) on delete restrict,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  sent_to_candidate_at timestamptz
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  consent_type text not null,
  policy_version text not null,
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique (user_id, consent_type, policy_version)
);

create table public.event_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid not null,
  event_type text not null check (
    event_type in ('score_seen', 'swipe_decision', 'application_submitted')
  ),
  target_type text not null check (target_type in ('job', 'application', 'candidate')),
  target_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_role public.app_role,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index jobs_recruiter_status_idx on public.jobs (recruiter_id, status);
create index jobs_active_created_at_idx on public.jobs (created_at desc)
  where status = 'active';
create index job_skills_job_id_idx on public.job_skills (job_id);
create index candidate_skills_skill_id_idx on public.candidate_skills (skill_id);
create index applications_candidate_created_idx on public.applications (candidate_id, created_at desc);
create index applications_job_stage_idx on public.applications (job_id, current_stage);
create index application_stages_application_idx on public.application_stages (application_id, created_at);
create index feedbacks_application_idx on public.feedbacks (application_id, created_at);
create index event_log_user_created_idx on public.event_log (user_id, created_at desc);
create index event_log_event_created_idx on public.event_log (event_type, created_at);
create index audit_logs_actor_created_idx on public.audit_logs (actor_id, created_at desc);

create function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create function public.is_approved_recruiter(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.recruiter_profiles rp on rp.user_id = ur.user_id
    where ur.user_id = _user_id
      and ur.role = 'recruiter'
      and rp.approved_at is not null
  );
$$;

create function public.can_recruiter_view_candidate(_candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.candidate_id = _candidate_id
      and j.recruiter_id = auth.uid()
      and public.is_approved_recruiter(auth.uid())
  );
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.app_role;
  requested_name text;
begin
  requested_role := (new.raw_user_meta_data ->> 'role')::public.app_role;
  requested_name := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');

  if requested_role is null then
    raise exception 'A valid candidate or recruiter role is required';
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, coalesce(requested_name, ''));

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role);

  if requested_role = 'candidate' then
    insert into public.candidate_profiles (user_id) values (new.id);
  else
    insert into public.recruiter_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.record_application_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_stages (
      application_id, previous_stage, new_stage, changed_by
    ) values (new.id, null, new.current_stage, auth.uid());
    return new;
  end if;

  if new.current_stage is distinct from old.current_stage then
    insert into public.application_stages (
      application_id, previous_stage, new_stage, changed_by
    ) values (new.id, old.current_stage, new.current_stage, auth.uid());
  end if;

  return new;
end;
$$;

create function public.set_application_stage_change_time()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.current_stage is distinct from old.current_stage then
    new.last_stage_change_at := now();
  end if;
  return new;
end;
$$;

create trigger applications_set_stage_change_time
  before update of current_stage on public.applications
  for each row execute function public.set_application_stage_change_time();

create trigger applications_record_stage
  after insert or update of current_stage on public.applications
  for each row execute function public.record_application_stage_change();

create function public.calculate_application_match_score(
  _job_id uuid,
  _candidate_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  with factors as (
    select
      js.weight,
      js.mandatory,
      js.required_level,
      coalesce(
        case
          when cs.evidenced_by_project
            then least(5::numeric, cs.declared_level * 1.15)
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
  totals as (
    select
      coalesce(sum(weight * least(candidate_level / required_level, 1)), 0) as partial_sum,
      coalesce(sum(weight), 0) as weight_sum,
      coalesce(bool_or(mandatory and candidate_level = 0), false) as missing_mandatory
    from factors
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

create function public.set_application_match_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.match_score := public.calculate_application_match_score(
    new.job_id,
    new.candidate_id
  );
  return new;
end;
$$;

create trigger applications_calculate_match_score
  before insert on public.applications
  for each row execute function public.set_application_match_score();

create function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  actor_role_value public.app_role;
  affected_row jsonb;
begin
  affected_row := case
    when tg_op = 'DELETE' then to_jsonb(old)
    else to_jsonb(new)
  end;
  target := coalesce(
    nullif(affected_row ->> 'id', '')::uuid,
    nullif(affected_row ->> 'user_id', '')::uuid
  );
  select role into actor_role_value
  from public.user_roles
  where user_id = auth.uid();

  insert into public.audit_logs (
    actor_id, actor_role, action, target_type, target_id, details
  ) values (
    auth.uid(),
    actor_role_value,
    lower(tg_op),
    tg_table_name,
    target,
    jsonb_build_object('schema', tg_table_schema)
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger candidate_profiles_touch_updated_at
  before update on public.candidate_profiles
  for each row execute function public.touch_updated_at();
create trigger recruiter_profiles_touch_updated_at
  before update on public.recruiter_profiles
  for each row execute function public.touch_updated_at();
create trigger jobs_touch_updated_at
  before update on public.jobs
  for each row execute function public.touch_updated_at();
create trigger candidate_skills_touch_updated_at
  before update on public.candidate_skills
  for each row execute function public.touch_updated_at();
create trigger applications_touch_updated_at
  before update on public.applications
  for each row execute function public.touch_updated_at();

create trigger jobs_audit
  after insert or update or delete on public.jobs
  for each row execute function public.write_audit_log();
create trigger companies_audit
  after insert or update or delete on public.companies
  for each row execute function public.write_audit_log();
create trigger recruiter_profiles_audit
  after insert or update or delete on public.recruiter_profiles
  for each row execute function public.write_audit_log();
create trigger job_skills_audit
  after insert or update or delete on public.job_skills
  for each row execute function public.write_audit_log();
create trigger applications_audit
  after insert or update or delete on public.applications
  for each row execute function public.write_audit_log();
create trigger feedbacks_audit
  after insert or update or delete on public.feedbacks
  for each row execute function public.write_audit_log();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.companies enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.recruiter_profiles enable row level security;
alter table public.skills enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
alter table public.candidate_skills enable row level security;
alter table public.applications enable row level security;
alter table public.application_stages enable row level security;
alter table public.feedbacks enable row level security;
alter table public.consents enable row level security;
alter table public.event_log enable row level security;
alter table public.audit_logs enable row level security;

grant usage on type public.app_role, public.skill_category, public.employment_type,
  public.job_status, public.application_status to authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_approved_recruiter(uuid) from public, anon;
revoke all on function public.can_recruiter_view_candidate(uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_approved_recruiter(uuid) to authenticated;
grant execute on function public.can_recruiter_view_candidate(uuid) to authenticated;
revoke all on function public.calculate_application_match_score(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.set_application_match_score()
  from public, anon, authenticated;
revoke all on function public.handle_new_user()
  from public, anon, authenticated;
revoke all on function public.record_application_stage_change()
  from public, anon, authenticated;
revoke all on function public.set_application_stage_change_time()
  from public, anon, authenticated;
revoke all on function public.write_audit_log()
  from public, anon, authenticated;
revoke all on function public.touch_updated_at()
  from public, anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update on public.candidate_profiles to authenticated;
grant select on public.recruiter_profiles to authenticated;
grant insert (user_id, company_id, position, phone)
  on public.recruiter_profiles to authenticated;
grant update (company_id, position, phone)
  on public.recruiter_profiles to authenticated;
grant select on public.skills to authenticated;
grant select, insert, update, delete on public.jobs, public.job_skills to authenticated;
grant select, insert, update, delete on public.candidate_skills to authenticated;
grant select on public.applications to authenticated;
grant insert (job_id, candidate_id) on public.applications to authenticated;
grant update (current_stage, status, last_stage_change_at, feedback_sent_at, silver_medalist)
  on public.applications to authenticated;
grant select on public.application_stages to authenticated;
grant select, insert, update on public.feedbacks to authenticated;
grant select, insert on public.consents to authenticated;
grant select, insert on public.event_log to authenticated;
grant select on public.audit_logs to authenticated;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "Approved recruiters can read applicant profiles"
  on public.profiles for select to authenticated
  using (public.can_recruiter_view_candidate(id));
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users can read own role"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Company owners manage their companies"
  on public.companies for all to authenticated
  using (created_by = (select auth.uid()))
  with check (
    created_by = (select auth.uid())
    and public.has_role((select auth.uid()), 'recruiter')
  );
create policy "Candidates can see companies with active jobs"
  on public.companies for select to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.company_id = companies.id and j.status = 'active'
  ));

create policy "Candidates manage own candidate profile"
  on public.candidate_profiles for all to authenticated
  using (
    user_id = (select auth.uid())
    and public.has_role((select auth.uid()), 'candidate')
  )
  with check (
    user_id = (select auth.uid())
    and public.has_role((select auth.uid()), 'candidate')
  );
create policy "Approved recruiters can view applicants candidate profiles"
  on public.candidate_profiles for select to authenticated
  using (public.can_recruiter_view_candidate(user_id));

create policy "Recruiters read and manage own recruiter profile"
  on public.recruiter_profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Recruiters create own recruiter profile"
  on public.recruiter_profiles for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.has_role((select auth.uid()), 'recruiter')
    and (
      company_id is null
      or exists (
        select 1 from public.companies c
        where c.id = recruiter_profiles.company_id
          and c.created_by = (select auth.uid())
      )
    )
  );
create policy "Recruiters update own non-approval fields"
  on public.recruiter_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and public.has_role((select auth.uid()), 'recruiter')
    and (
      company_id is null
      or exists (
        select 1 from public.companies c
        where c.id = recruiter_profiles.company_id
          and c.created_by = (select auth.uid())
      )
    )
  );

create policy "Authenticated users can read skills"
  on public.skills for select to authenticated using (true);

create policy "Authenticated candidates and recruiters can read active jobs"
  on public.jobs for select to authenticated
  using (
    status = 'active'
    or (
      recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
    )
  );
create policy "Approved recruiters create own jobs"
  on public.jobs for insert to authenticated
  with check (
    recruiter_id = (select auth.uid())
    and public.is_approved_recruiter((select auth.uid()))
  );
create policy "Approved recruiters update own jobs"
  on public.jobs for update to authenticated
  using (
    recruiter_id = (select auth.uid())
    and public.is_approved_recruiter((select auth.uid()))
  )
  with check (
    recruiter_id = (select auth.uid())
    and public.is_approved_recruiter((select auth.uid()))
  );
create policy "Approved recruiters delete own jobs"
  on public.jobs for delete to authenticated
  using (
    recruiter_id = (select auth.uid())
    and public.is_approved_recruiter((select auth.uid()))
  );

create policy "Users read skills for visible jobs"
  on public.job_skills for select to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_skills.job_id
      and (
        j.status = 'active'
        or (j.recruiter_id = (select auth.uid())
          and public.is_approved_recruiter((select auth.uid())))
      )
  ));
create policy "Approved recruiters manage skills on own jobs"
  on public.job_skills for all to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = job_skills.job_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ))
  with check (exists (
    select 1 from public.jobs j
    where j.id = job_skills.job_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ));

create policy "Candidates manage own skills"
  on public.candidate_skills for all to authenticated
  using (
    candidate_id = (select auth.uid())
    and public.has_role((select auth.uid()), 'candidate')
  )
  with check (
    candidate_id = (select auth.uid())
    and public.has_role((select auth.uid()), 'candidate')
  );
create policy "Approved recruiters view skills of applicants"
  on public.candidate_skills for select to authenticated
  using (public.can_recruiter_view_candidate(candidate_id));

create policy "Candidates read own applications"
  on public.applications for select to authenticated
  using (candidate_id = (select auth.uid()));
create policy "Candidates apply to active jobs"
  on public.applications for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and public.has_role((select auth.uid()), 'candidate')
    and exists (
      select 1 from public.jobs j
      where j.id = applications.job_id and j.status = 'active'
    )
  );
create policy "Approved recruiters read applications for own jobs"
  on public.applications for select to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = applications.job_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ));
create policy "Approved recruiters update applications for own jobs"
  on public.applications for update to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = applications.job_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ))
  with check (exists (
    select 1 from public.jobs j
    where j.id = applications.job_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ));

create policy "Participants can read application stage history"
  on public.application_stages for select to authenticated
  using (exists (
    select 1
    from public.applications a
    left join public.jobs j on j.id = a.job_id
    where a.id = application_stages.application_id
      and (
        a.candidate_id = (select auth.uid())
        or (j.recruiter_id = (select auth.uid())
          and public.is_approved_recruiter((select auth.uid())))
      )
  ));

create policy "Candidates read own feedback"
  on public.feedbacks for select to authenticated
  using (exists (
    select 1 from public.applications a
    where a.id = feedbacks.application_id
      and a.candidate_id = (select auth.uid())
  ));
create policy "Approved recruiters manage feedback for own applications"
  on public.feedbacks for all to authenticated
  using (exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.id = feedbacks.application_id
      and j.recruiter_id = (select auth.uid())
      and public.is_approved_recruiter((select auth.uid()))
  ))
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = feedbacks.application_id
        and j.recruiter_id = (select auth.uid())
        and public.is_approved_recruiter((select auth.uid()))
    )
  );

create policy "Users read own consents"
  on public.consents for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users record own consents"
  on public.consents for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users insert own telemetry"
  on public.event_log for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users read own telemetry"
  on public.event_log for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Recruiters read own audit events"
  on public.audit_logs for select to authenticated
  using (
    actor_id = (select auth.uid())
    and public.is_approved_recruiter((select auth.uid()))
  );

revoke all on public.profiles, public.user_roles, public.companies,
  public.candidate_profiles, public.recruiter_profiles, public.skills,
  public.jobs, public.job_skills, public.candidate_skills, public.applications,
  public.application_stages, public.feedbacks, public.consents,
  public.event_log, public.audit_logs from anon;

-- Sprint 1 · Etapa 2 — Onboarding e perfil do candidato
--
-- 1) Novas colunas de preferências em candidate_profiles (continuam visíveis ao
--    recrutador aprovado pela política já existente em 20260929122000):
--    - accepted_contract_types: tipos de contrato aceitos (enum employment_type[])
--    - accepted_work_models: modelos de trabalho aceitos (text[] com check)
--    - willing_to_relocate: aceita mudar de cidade
-- 2) Nova tabela candidate_private_preferences para a pretensão salarial.
--    O salário fica FORA de candidate_profiles porque a política de recrutador lê
--    a linha inteira de candidate_profiles; manter salário em tabela separada
--    impede que o recrutador o veja. RLS ativada SEM política para recrutador —
--    somente o dono (candidato) faz select/insert/update.

alter table public.candidate_profiles
  add column accepted_contract_types public.employment_type[]
  not null default array[]::public.employment_type[];

alter table public.candidate_profiles
  add column accepted_work_models text[] not null default '{}'
  check (accepted_work_models <@ array['presencial', 'hibrido', 'remoto']::text[]);

alter table public.candidate_profiles
  add column willing_to_relocate boolean not null default false;

create table public.candidate_private_preferences (
  user_id uuid primary key references public.candidate_profiles (user_id) on delete cascade,
  salary_expectation numeric(12, 2)
    check (salary_expectation is null or salary_expectation >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.candidate_private_preferences enable row level security;

create trigger candidate_private_preferences_touch_updated_at
  before update on public.candidate_private_preferences
  for each row execute function public.touch_updated_at();

-- Somente o dono (candidato) lê/grava a própria pretensão salarial. Nenhuma
-- política de leitura para recrutador é criada.
create policy "Candidates manage own private preferences"
  on public.candidate_private_preferences for all to authenticated
  using (
    user_id = (select auth.uid())
    and public.has_role((select auth.uid()), 'candidate')
  )
  with check (
    user_id = (select auth.uid())
    and public.has_role((select auth.uid()), 'candidate')
  );

revoke all on public.candidate_private_preferences from anon;
grant select, insert, update on public.candidate_private_preferences to authenticated;

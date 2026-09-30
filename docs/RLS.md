# Políticas de RLS — Matriz de acesso

Este documento descreve, tabela por tabela, quem pode fazer o quê no banco de
dados, de acordo com as políticas de Row Level Security (RLS) definidas em
`supabase/migrations/20260929122000_initial_schema.sql`.

Papéis considerados:

- **Candidato**: usuário autenticado com papel `candidate`.
- **Recrutador aprovado**: usuário autenticado com papel `recruiter` e
  `recruiter_profiles.approved_at` preenchido.
- **Recrutador não aprovado**: usuário autenticado com papel `recruiter`,
  mas ainda sem aprovação (`approved_at is null`).
- **Anon**: visitante sem login.

Legenda: ✅ permitido · ❌ bloqueado · 🔸 permitido apenas sob condição
(detalhada na coluna "Regra").

## profiles

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só o próprio | 🔸 só o próprio; também pode ler perfil de qualquer candidato que já se candidatou a uma vaga sua | ❌ | ❌ | `id = auth.uid()` OU `can_recruiter_view_candidate(id)` |
| insert | ❌ (criado pelo trigger `handle_new_user` no cadastro) | ❌ | ❌ | ❌ | Sem policy de insert; só o trigger `security definer` grava |
| update | 🔸 só o próprio | 🔸 só o próprio | ❌ | ❌ | `id = auth.uid()` |
| delete | ❌ | ❌ | ❌ | ❌ | Nenhuma policy de delete; sem grant |

## user_roles

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só o próprio | 🔸 só o próprio | 🔸 só o próprio | ❌ | `user_id = auth.uid()` |
| insert/update/delete | ❌ | ❌ | ❌ | ❌ | Sem grant; escrito pelo trigger de cadastro |

## companies

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só empresas com pelo menos uma vaga `active` | 🔸 empresas com vaga ativa + as que ele criou | 🔸 empresas com vaga ativa + as que ele criou | ❌ | ver `using` das duas policies de select |
| insert/update/delete | ❌ | 🔸 só as que ele mesmo criou (`created_by = auth.uid()` + papel recruiter) | 🔸 idem (não depende de aprovação, só de ter o papel recruiter) | ❌ | policy `for all` |

## candidate_profiles

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só o próprio | 🔸 só o próprio + de candidatos que se candidataram a vaga sua | ❌ | ❌ | `user_id = auth.uid()` OU `can_recruiter_view_candidate(user_id)` |
| insert/update | 🔸 só o próprio | ❌ | ❌ | ❌ | `user_id = auth.uid()` + papel candidate |
| delete | ❌ (não há caso de uso; `for all` cobre, mas sem UI) | ❌ | ❌ | ❌ | mesma policy `for all` do candidato |

## recruiter_profiles

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | ❌ | 🔸 só o próprio | 🔸 só o próprio | ❌ | `user_id = auth.uid()` |
| insert | ❌ | 🔸 só o próprio registro (papel recruiter) | 🔸 idem | ❌ | criado no cadastro |
| update | ❌ | 🔸 só o próprio; **coluna `approved_at` não é liberada pelo GRANT**, então nem o próprio recrutador consegue se auto-aprovar | 🔸 idem | ❌ | `grant update (company_id, position, phone)` — sem `approved_at` |
| delete | ❌ | ❌ | ❌ | ❌ | sem policy/grant |

## skills

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | ✅ (catálogo público entre autenticados) | ✅ | ✅ | ❌ | `using (true)` |
| insert/update/delete | ❌ | ❌ | ❌ | ❌ | sem grant de escrita |

## jobs

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só vagas com `status = 'active'` | 🔸 vagas ativas + as próprias (qualquer status) | 🔸 só vagas ativas (não vê rascunhos próprios, pois a condição exige `is_approved_recruiter`) | ❌ | `status = 'active' OR (recruiter_id = auth.uid() AND is_approved_recruiter)` |
| insert | ❌ | 🔸 só como dono (`recruiter_id = auth.uid()`) | ❌ (bloqueado por `is_approved_recruiter`) | ❌ | policy de insert |
| update/delete | ❌ | 🔸 só as próprias | ❌ | ❌ | idem, exige `is_approved_recruiter` |

## job_skills

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 skills de vagas ativas | 🔸 skills de vagas ativas + das próprias vagas | 🔸 só de vagas ativas | ❌ | segue visibilidade de `jobs` |
| insert/update/delete | ❌ | 🔸 só em vagas próprias | ❌ | ❌ | `for all` condicionado a `is_approved_recruiter` |

## candidate_skills

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só as próprias | 🔸 só as próprias + de candidatos que se candidataram a vaga sua | ❌ | ❌ | `candidate_id = auth.uid()` OU `can_recruiter_view_candidate` |
| insert/update/delete | 🔸 só as próprias | ❌ | ❌ | ❌ | `for all` do candidato |

## applications

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só as próprias candidaturas | 🔸 só candidaturas de vagas suas | ❌ | ❌ | `candidate_id = auth.uid()` OU vaga própria + aprovado |
| insert | 🔸 só em nome próprio e só para vaga `active` (colunas liberadas: `job_id, candidate_id`) | ❌ | ❌ | ❌ | policy de insert |
| update | ❌ | 🔸 só candidaturas de vagas suas (colunas liberadas: `current_stage, status, last_stage_change_at, feedback_sent_at, silver_medalist`) | ❌ | ❌ | policy de update |
| delete | ❌ | ❌ | ❌ | ❌ | sem grant de delete |

## application_stages (histórico do funil)

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só de candidaturas próprias | 🔸 só de candidaturas de vagas suas | ❌ | ❌ | join com `applications`/`jobs` |
| insert/update/delete | ❌ | ❌ | ❌ | ❌ | sem grant; escrito por trigger |

## feedbacks

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só de candidaturas próprias | 🔸 só de candidaturas de vagas suas | ❌ | ❌ | duas policies de select combinadas |
| insert/update/delete | ❌ | 🔸 só em candidaturas de vagas suas, e só como autor (`author_id = auth.uid()`) | ❌ | ❌ | policy `for all` |

## consents (LGPD)

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só os próprios | 🔸 só os próprios | 🔸 só os próprios | ❌ | `user_id = auth.uid()` |
| insert | 🔸 só em nome próprio | 🔸 idem | 🔸 idem | ❌ | `user_id = auth.uid()` |
| update/delete | ❌ | ❌ | ❌ | ❌ | consentimento é imutável (histórico) |

## event_log (telemetria comportamental)

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | 🔸 só os próprios eventos | 🔸 só os próprios eventos | 🔸 só os próprios eventos | ❌ | `user_id = auth.uid()` |
| insert | 🔸 só em nome próprio | 🔸 idem | 🔸 idem | ❌ | `user_id = auth.uid()` |
| update/delete | ❌ | ❌ | ❌ | ❌ | log é append-only |

## audit_logs (LGPD — ações do recrutador)

| Operação | Candidato | Recrutador aprovado | Recrutador não aprovado | Anon | Regra |
|---|---|---|---|---|---|
| select | ❌ | 🔸 só as próprias ações (`actor_id = auth.uid()`) | ❌ (bloqueado por `is_approved_recruiter`) | ❌ | única policy de select |
| insert/update/delete | ❌ | ❌ (gravado só por trigger `security definer`) | ❌ | ❌ | sem grant de escrita direto |

## Resumo — `anon`

Todas as tabelas de negócio têm `revoke all ... from anon` explícito ao final
da migração (`profiles`, `user_roles`, `companies`, `candidate_profiles`,
`recruiter_profiles`, `skills`, `jobs`, `job_skills`, `candidate_skills`,
`applications`, `application_stages`, `feedbacks`, `consents`, `event_log`,
`audit_logs`). Um visitante sem login não lê nem escreve em nenhuma delas —
confirmado pela seção "M" de `supabase/tests/rls.test.sql`.

## Fontes

- Políticas: `supabase/migrations/20260929122000_initial_schema.sql`
  (linhas 564–819).
- Funções de apoio: `has_role`, `is_approved_recruiter`,
  `can_recruiter_view_candidate` (linhas 219–264 da mesma migração).
- Testes automatizados que validam esta matriz: `supabase/tests/rls.test.sql`
  (rodam via `npm run test:db` / job `db-tests` do CI).

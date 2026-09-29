# Backlog — Job Match

## Sprints

- **Sprint 1 (31 SP):** Auth (1.1–1.4) + Perfil (2.1–2.5)
- **Sprint 2 (29 SP):** Vagas (3.1–3.4) + Match algoritmo (4.1–4.3)
- **Sprint 3 (26 SP):** Match explicado (4.4–4.5) + Swipe (5.1–5.6)
- **Sprint 4 (23 SP):** Kanban (6.1–6.4) + Feedback (7.1–7.2)
- **Sprint 5 (28 SP):** Guia + Log (7.3–7.4) + Tokens (8.1, 8.3) + Parser (11.1–11.2)
- **Sprint 6 (18 SP):** LGPD (10.1–10.3) + Telemetria (12.1–12.2)
- **Pós-validação:** Dashboard executivo, Billing, Tokens avançados

## Próximos Passos Imediatos

### Fase 0 — Fundação conceitual (antes de codar)
- [ ] Definir hipóteses + critérios GO/NO-GO (seção 23)
- [ ] Construir taxonomia de skills (seção 24)
- [ ] Preparar TCLE (seção 25)
- [ ] Definir cronograma do sandbox (seção 26)

### Fase 1 — Setup técnico
- [ ] Setup do Aider — `.aider.conf.yml`, `.aiderignore`, `AGENTS.md`
- [ ] Criar arquivos de contexto no repo (`.github/copilot-instructions.md`, `AGENTS.md`, `.github/ISSUE_TEMPLATE/agent-task.md`)
- [ ] Primeira missão do Sprint 1: corrigir ordem do Match Score em `JobSwipe.tsx`
- [ ] Validar loop: issue → agente → PR → revisão
- [ ] Criar CI (`.github/workflows/ci.yml`): lint + typecheck + test
- [ ] Implementar schema — migrations Supabase (incluindo `event_log`)

### Fase 2 — Preparação do sandbox
- [ ] Seed da taxonomia de skills (80–120)
- [ ] Seed das 50 vagas (com ground truth de skills para o parser)
- [ ] Construir fallback determinístico do parser
- [ ] Construir parser IA
- [ ] Recrutar os 50 testers
# Job Match — Guia para Agentes

## Produto
ATS humanizada. Transparência para o candidato (Match Score explicado)
+ retorno no prazo ao candidato: prazo por candidato, meta de 90%,
selo público e desconto simulado no beta.
Concorrentes: Gupy, Greenhouse, Tako.

## Estágio atual
Validação acadêmica. Sandbox com ~50 testers e 50 vagas seedadas.
Sem cliente-âncora. Avaliação por 3 professores (2 Produto, 1 Gestão Org).
Beta do MVP planejado para janeiro de 2027.

## Stack
Vite + React 18 + TS + shadcn-ui + Tailwind + Framer Motion + Supabase
(Postgres + Auth + Edge Functions Deno) + TanStack Query + Zod.
Deploy: Vercel. CI: GitHub Actions.

## Estrutura
src/features/<feature>/{api.ts,hooks.ts,schemas.ts,components/,types.ts}
src/shared/{ui,lib,hooks,types}

## Regras invioláveis
1. NUNCA supabase.from() em componente. Sempre via features/<x>/api.ts.
2. NUNCA any. Tipos em shared/types/database.ts.
3. NUNCA mock data em prod. Marcar // TODO(mock).
4. Match score SEMPRE retorna { score, factors[] }.
5. Toda ação de recrutador gera audit_log (LGPD).
6. Swipe usa hook único useSwipeDeck.
7. Textos ao usuário em PT-BR, código em EN.
8. Rodar antes de PR: npm run lint && npm run typecheck && npm test.
9. Conventional Commits.
10. Não editar: .env, migrations aplicadas, src/shared/ui/**.
11. Parser de vaga NUNCA define nível ou peso — só estrutura competências.
12. Todo evento de comportamento vira event_log.
13. Toda tabela nova tem RLS e teste pgTAP em supabase/tests.
14. Tabela nova de dado de empresa leva org_id a partir do N18 (até lá, marque TODO(N18)).
15. Texto ao usuário nunca fala de "token", "protótipo" ou "mockado".
16. Função pública (anon) devolve o mínimo e nunca dado de pessoa.

## Domínio
- Match Score: 0–100, por competências. Determinístico, não LLM.
- Token: saldo legado do recrutador. Não paga nada desde 08/10; o extrato fica como histórico.
- Retorno no prazo: todo candidato ativo tem prazo de retorno (feedback_deadlines). A tela "Retorno no prazo" mostra a meta de 90% e o desconto simulado.
- Guia de Entrevista: gerado ao agendar.
- Medalhista de prata: candidato aprovado mas não contratado.
- Assistente de Estruturação de Vaga: IA que estrutura texto livre em competências.

## Comandos
npm run dev | npm run build | npm run lint | npm run typecheck | npm test
npx supabase gen types typescript --project-id XXX > src/shared/types/database.ts
npx supabase migration new <nome>
npx supabase db push

## O que NUNCA fazer
- Expor chaves de API no client
- Rodar service_role no frontend
- Fazer match score sem explicar fatores
- Deixar candidato sem feedback
- Usar IA generativa para cálculo de match
- Deixar IA definir nível/peso de vaga
- Editar src/shared/ui/**
- Tocar em migrations já aplicadas
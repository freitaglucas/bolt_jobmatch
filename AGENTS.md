# Job Match — Guia para Agentes

## Produto
ATS humanizada. Transparência para candidato (Match Score explicado)
+ tokens para recrutador (feedback no prazo).
Concorrentes: Gupy, Greenhouse, Tako.

## Estágio atual
Validação acadêmica. Sandbox com ~50 testers e 50 vagas seedadas.
Sem cliente-âncora. Avaliação por 3 professores (2 Produto, 1 Gestão Org).

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

## Domínio
- Match Score: 0–100, por competências. Determinístico, não LLM.
- Tokens: moeda interna do recrutador.
- Jornada do Recrutamento: painel de tokens.
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
# Job Match

ATS (sistema de recrutamento) para pequenas e médias empresas. A promessa central: **todo candidato recebe retorno no prazo, com motivo**.

- O candidato vê a compatibilidade com cada vaga, explicada por competência, e acompanha o prazo do próximo retorno.
- A recrutadora tem prazo de retorno por candidato (5 dias, com até 2 adiamentos por etapa), retorno em lote com motivo, aviso automático de mudança de etapa e uma meta de 90% de retornos no prazo.
- Quem cumpre a meta ganha selo público na vaga e desconto na mensalidade (simulado durante o beta).

## Stack

Vite, React 18, TypeScript, Tailwind e shadcn/ui, TanStack Query, Zod, Supabase (Postgres com RLS, Auth e Edge Functions em Deno), e-mail pelo Resend, deploy na Vercel e CI no GitHub Actions.

## Como rodar

1. `npm ci`
2. Crie um arquivo `.env` na raiz com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (os valores estão em Project Settings > API, no painel do Supabase). Nunca versione esse arquivo.
3. `npm run dev`

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento (Vite) |
| `npm run build` | Gera a versão de produção |
| `npm run lint` | Roda o ESLint em todo o projeto |
| `npm run typecheck` | Verifica os tipos TypeScript (`tsc --noEmit`) |
| `npm test` | Executa a suíte de testes (Vitest) |
| `npm run test:coverage` | Executa os testes e gera relatório de cobertura em `coverage/` |
| `npm run test:db` | Executa os testes pgTAP (RLS, prazos, meta, selo), requer Supabase CLI e Docker |

## Estrutura

- `src/features/<feature>/`: regras, acesso ao banco (`api.ts`), hooks e componentes de cada área.
- `src/screens/`: telas do candidato e da recrutadora.
- `src/shared/`: tipos do banco, cliente do Supabase e componentes base.
- `supabase/migrations/`: migrations (nunca edite uma já aplicada; crie uma nova).
- `supabase/tests/`: testes pgTAP.
- `supabase/functions/`: Edge Functions (`send-email`).
- `docs/`: documentação (RLS, competências, auditoria de usabilidade).

## Para quem desenvolve

- Leia o `AGENTS.md`: regras do projeto, domínio e o que nunca fazer.
- Antes de abrir PR: `npm run lint && npm run typecheck && npm test`.
- Commits em Conventional Commits, em português.

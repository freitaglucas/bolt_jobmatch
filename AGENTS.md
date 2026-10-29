# Job Match — Guia para Agentes

Leia este arquivo antes de cada tarefa. A fonte de verdade do produto é o guia
"Job Match — Premissas e guia de produto" (26/10/2026) e o backlog v4, resumido
em `BACKLOG.md`. Se o prompt da tarefa discordar deste arquivo, siga o prompt e
avise no relatório final.

## Produto
ATS para PMEs que contratam do operacional à gerência. O Job Match põe os
candidatos mais aderentes no topo da fila, explica por quê e usa o mesmo match
para dar ao candidato um retorno com motivo.

- Recrutadora: a fila chega ordenada por compatibilidade, com o porquê; o
  requisito sim/não filtra antes; o retorno em lote sai com motivo pronto.
- Gestor dono da vaga: decide pelo e-mail, sem login (Pós-beta, N85).
- Gestora de RH (quem compra): menos tempo de vaga aberta e prova de que
  contratou certo (pulso de 90 dias ligado ao score, Pós-beta, N12).
- Candidato: sabe logo se a vaga faz sentido (faixa, não número) e recebe o que
  falta, no prazo.

Fora do público: alto escalão (diretoria, sócios, conselho) e microempresas que
contratam só por indicação.

## Estágio atual
Beta (backlog v4, 26/10/2026), com recrutadoras de PMEs como testers. O Beta
termina quando quatro premissas estiverem medidas: M1 (o match ordena como a
recrutadora ordenaria), M3 (candidatura pelo link em até 3 minutos no
celular), N2 (a PME paga R$ 499 pelo Basic) e G2 (o gestor decide pelo e-mail).
Não há painel para professores nem validação acadêmica: saíram do produto em
26/10.

Ordem de construção do Beta: B0 base para os agentes → B1 match v2 e catálogo
→ B2 do link à candidatura → B3 retorno com motivo → B4 pronto para testers.
Siga a coluna "Ordem" do `BACKLOG.md`, sem antecipar itens.

## Stack
Vite + React 18 + TS + shadcn/ui + Tailwind + Framer Motion + Supabase
(Postgres + Auth + Edge Functions Deno) + TanStack Query + Zod.
E-mail pelo Resend. Deploy: Vercel. CI: GitHub Actions (lint, typecheck,
vitest e pgTAP).

## Estrutura
- `src/features/<feature>/{api.ts,hooks.ts,schemas.ts,types.ts,components/}`
- `src/screens/`: telas do candidato e da recrutadora.
- `src/components/`: componentes do app (GateShell, Layout, Logo...).
- `src/components/ui/`: componentes shadcn (não editar).
- `src/lib/`: lógica pura com teste vitest ao lado (`*.test.ts`).
- `src/shared/lib/supabase.ts` (cliente) e `src/shared/types/database.ts` (tipos).
- `supabase/migrations`, `supabase/tests` (pgTAP), `supabase/functions`
  (`send-email` e `_shared`), `supabase/seeds`, `supabase/scripts`.

## Princípios de produto (não negociáveis)
Uma feature que fere um destes não entra, mesmo que um cliente peça.
1. Compatibilidade primeiro: sem perfil não há match. Candidatura pelo link em
   até 3 minutos pelo celular: currículo lido, uma tela de revisão
   pré-preenchida, conta no fim. Sem PDF, três perguntas bastam.
2. IA sugere, regra decide: a IA só lê e sugere; uma pessoa confirma. Mesma
   vaga + mesmo candidato = mesmo score, auditável.
3. Requisito filtra antes do score: sim/não elimina antes; obrigatório 1,0,
   implícito 0,5, desejável soma até +15%; sinônimos, famílias e grupos
   "1 de" evitam falso negativo.
4. Faixa para o candidato, número para o recrutador: o candidato nunca vê
   número nem ranking. Vale no banco, não só na tela.
5. Motivo ligado à vaga: todo retorno cita um requisito da vaga, nunca algo
   pessoal.
6. Responder é grátis; cumprir o prazo é premiado: nada no trabalho manual é
   cobrado ou bloqueado. 90% no prazo dá selo e desconto.
7. O gestor age onde está: decisão por e-mail, sem login. O painel mostra onde
   trava, nunca um placar de pessoas.
8. Contratar certo é métrica do recrutamento: acompanhar os 90 dias depois da
   contratação e ligar o resultado ao score.

Regras de 26/10:
- O que está no currículo vale mais do que o que é acrescentado: competência só
  existe dentro de uma experiência; item acrescentado pelo candidato vale 0,7;
  o nível sai de uma regra de tempo e recência; cada candidatura usa a foto do
  perfil daquele momento. O candidato vê só "o que está no seu currículo conta
  mais"; o recrutador vê a origem de cada item. Sem reputação que acompanhe a
  pessoa entre empresas e sem IA acusando fraude.
- Comportamento é indicação de perfil, não score: 3 pontos fortes de uma lista
  fechada, fora do score. Prática comportamental observável (ex.: negociação
  comercial) é competência e pontua com evidência.

Regra de operação: configuração, nunca código por cliente.

## Regras invioláveis
1. NUNCA `supabase.from()` em componente ou tela. Acesso ao banco só em
   `src/features/<x>/api.ts` (ou `*.api.ts`).
2. NUNCA `any`. Tipos do banco em `src/shared/types/database.ts`, editados à
   mão junto da migration.
3. NUNCA mock data em prod. Marcar `// TODO(mock)`.
4. Match score SEMPRE retorna `{ score, factors[] }`, por regra
   determinística, com paridade TS × SQL testada no CI
   (`match_parity.test.sql`). Mudou a fórmula, mudam os dois lados e o teste.
5. O candidato nunca recebe o número do score, nem na tela nem na leitura do
   banco: ele vê a faixa com o motivo. Código novo não mostra número ao
   candidato; as telas que ainda mostram saem no N36.
6. IA só lê e sugere; uma pessoa confirma. IA nunca calcula nem ajusta score,
   nunca define nível exigido ou peso da vaga e nunca avalia candidato.
   Exceção: no currículo, a IA sugere itens e o nível chega pré-preenchido
   (por regra de tempo e recência, N90); o candidato confirma. Baixar o nível
   é livre; subir vira "acrescentado". Sinônimos e famílias do catálogo: a IA
   propõe, o PO aprova, o match só usa o aprovado (N93, N94).
7. Ação de recrutador fica em `audit_logs`, pelo trigger `write_audit_log`.
   Tabela nova com dado de empresa ou ação de recrutador ganha esse trigger na
   mesma migration.
8. Toda tabela nova tem RLS e teste pgTAP em `supabase/tests`.
9. Tabela nova de dado de empresa marca `-- TODO(N18)` (org_id e RLS por
   empresa chegam no N18). Depois do NOVO-6, ela também leva `company_id`,
   preenchido por trigger a partir da vaga.
10. Função pública (anon) devolve o mínimo e nunca dado de pessoa.
11. Todo evento de comportamento vira `event_log`. Tipo novo de evento exige
    migration no check `event_log_event_type_check`.
12. Swipe fica no código como navegação do candidato, com o hook único
    `useSwipeDeck`, sem evoluir e sem aparecer em texto de produto. Quem chega
    pelo link vai à página da vaga (NOVO-1).
13. Texto ao usuário em PT-BR, código em EN. Glossário: candidatura, retorno,
    prazo, etapa, vaga, "Job Match" (com espaço); "feedback" só em código.
    Nunca "token", "protótipo", "mockado", "swipe" ou número fictício em texto
    ao usuário.
14. Motivo de retorno sempre ligado a requisito da vaga; nunca número, score ou
    algo pessoal na mensagem.
15. Reserva é interna: a palavra "reserva" só aparece para o recrutador. O
    candidato lê apenas que está na fase final e a data do próximo retorno.
16. Não editar: migrations já aplicadas, `.env*`, `supabase/seeds/**`,
    `supabase/scripts/**`, `src/components/ui/**`, `.clinerules`.
17. Mudança de banco = migration nova com teste pgTAP.
18. Lógica pura em `.ts` com vitest. Teste de tela usa jsdom e Testing Library,
    com `// @vitest-environment jsdom` na primeira linha do arquivo (o padrão
    continua `node`). `src/App.test.tsx` confere os gates por papel: quem
    mexer em gate ou no `App.tsx` roda e amplia esse teste.
19. Antes de PR: `npm run lint && npm run typecheck && npm test`.
20. Conventional Commits, em português.

## Domínio
- Régua de nível: sempre 3 níveis, 1 básico, 2 intermediário, 3 avançado (N30),
  com descritor em `src/features/skills/levels.ts`. Não existe nível 4 ou 5.
- Tipo do item (`skills.kind`, N31): `competency` (inclui prática
  comportamental observável), `tool`, `requirement` (sim/não) e `trait` (ponto
  forte, nunca pontua). Só `competency` e `tool` entram em `job_skills` e
  `candidate_skills`; os catálogos das telas filtram por `SCORED_KINDS`
  (`src/features/skills/item-kinds.ts`).
- Papel na vaga (`job_skills.role`, N31): `required`, `preferred` ou `implicit`
  (`src/features/jobs/item-roles.ts`). `mandatory` é derivado de `role` por
  gatilho; até o N32 o implícito pontua como desejável.
- Requisito sim/não (`job_requirements`, N31): filtra antes do score. A empresa
  marca se é excludente. A candidatura nasce só por `apply_to_job` (nunca
  insert direto em `applications`), com uma resposta por requisito; "não" num
  excludente recusa na hora, com retorno de motivo ligado à vaga e sem prazo
  (fora da meta e do selo). Na tela, `handleApply` (App.tsx) abre o
  `RequirementsDialog` quando a vaga tem requisito e o
  `ApplicationRejectedDialog` na recusa. O candidato nunca vê se o requisito é
  excludente.
- Match score: 0–100 por item da vaga, determinístico. Hoje: régua de 3 níveis
  e `job_skills.weight` (vaga nova grava 1,0; a importância saiu da tela no
  N35). Fórmula v2 no B1 (N32): o papel decide o peso (obrigatório 1,0,
  implícito 0,5, desejável até +15%), com grupos "1 de", sinônimos e famílias.
- Faixa de compatibilidade (o que o candidato vê): altíssima, alta, compatível,
  não compatível, pela cobertura das obrigatórias (N36).
- Origem do item: "do currículo" (1,0) ou "acrescentado" (0,7) (N90).
- Foto do perfil: cada candidatura guarda o perfil daquele momento; o score só
  é recalculado quando muda o catálogo ou a vaga (NOVO-3).
- Pontos fortes: 3 traços de uma lista fechada, fora do score; o recrutador vê
  "x de 3 em comum com a vaga" (N96).
- Retorno no prazo: todo candidato ativo (Em análise, Triagem, Entrevista,
  Final) tem prazo em `feedback_deadlines`. SLA de 5 dias (`SLA_HOURS = 120`),
  até 2 adiamentos por etapa, até 14 dias. No prazo = `met_at <= due_at`.
  Meta de 90%, desconto de 10% simulado. Selo público: mínimo de 30 retornos
  com prazo em 90 dias e 90% ou mais, arredondado para baixo, nunca negativo.
- Reserva: só na etapa Final, 14 dias + 1 renovação, interna.
- Token: regra encerrada em 08/10. A tabela `token_ledger` fica no banco só como
  histórico; não há saldo, crédito nem tela de tokens. O prazo padrão está em
  `src/features/deadlines/sla.ts` (`SLA_HOURS`, `SLA_DAYS`).

## Comandos
npm run dev | npm run build | npm run lint | npm run typecheck | npm test
npm run test:db (pgTAP; requer Supabase CLI e Docker)
npx supabase migration new <nome>
npx supabase db push (só o PO roda; agentes não rodam comandos do Supabase)

## O que NUNCA fazer
- Expor chaves de API no client
- Rodar service_role no frontend
- Fazer match score sem explicar fatores
- Mostrar número ou ranking ao candidato
- Deixar candidato sem retorno ou sem prazo
- Usar IA generativa para calcular ou ajustar o match
- Deixar a IA definir nível exigido, peso de vaga ou avaliar candidato
- Cobrar ou bloquear trabalho manual do recrutador
- Editar `src/components/ui/**`
- Tocar em migrations já aplicadas

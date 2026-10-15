# Auditoria de front-end e usabilidade — Job Match (N72)

Data: 15/10/2026 · Base: `main` em `3ce022d` (inclui N64) · Escopo: telas de `src/screens`, gates, Layout e os 2 e-mails ao candidato.
Método: app rodando localmente (Vite + Supabase local com migrations e seeds), screenshots com Playwright em 1280×800 e 390×844 nos temas escuro e claro, verificação automática com axe-core (WCAG 2 A/AA) e leitura do código. Evidências em [`docs/ux-audit-151026/`](ux-audit-151026/).

Convenção dos screenshots: `<tela>-<desktop|mobile>-<escuro|claro>.png`. As telas principais têm as 4 combinações. Os estados (erro, vazio, carregando, sucesso) têm só `desktop-escuro` e `mobile-claro`, para não inflar o repositório.

---

## 1. Resumo

1. **A primeira impressão vende outro produto.** A Landing fala de match, swipe, tokens como gamificação e drag & drop, e mostra números fictícios (92%, 3x, 340 tokens). Não diz uma palavra sobre o retorno no prazo, que hoje é o centro do produto. "Sou recrutador" abre o login na aba Candidato.
2. **O app real ainda se apresenta como protótipo.** Rodapé com "Protótipo visual - dados mockados", título da aba "Job Match Visual Prototype" e a tela Pós-contratação inteira com dados falsos ("+330 Tokens ganhos") sem aviso.
3. **O retorno chega mal ao candidato.** Os e-mails são texto puro, sem marca, sem botão e sem o prazo em destaque. No app, a candidatura mostra o prazo, mas o candidato não vê a promessa de prazo antes de se candidatar.
4. **Impacto no beta:** recrutadores de PME podem não entender a proposta ou entrar no fluxo errado. Candidatos podem tratar o e-mail como spam ou não saber onde acompanhar. E o produto passa a impressão de não estar pronto, o que mina o selo e a meta de 90%.
5. **Base de acessibilidade fraca e erros técnicos à mostra:** 177 botões sem nome acessível (incluindo os 3 botões do Swipe), contraste insuficiente sobretudo no tema claro, nenhum respeito a `prefers-reduced-motion`, `lang="en"`. Os erros de login aparecem em inglês e o cadastro pode exibir JSON cru.

## 2. Top 5 antes do beta (prioridade do PO)

| # | O que fazer | Achados | Backlog | Esforço |
|---|---|---|---|---|
| 1 | **Reescrever a Landing em torno do retorno no prazo**, com "para quem é" e o primeiro passo de cada lado; passar o papel escolhido para o Auth. | A01, A02, A03, A04, A05 | N4 (limpeza) + **N73** (nova Landing) | M |
| 2 | **Remover todo texto de protótipo e mock do app:** rodapé, `<title>`, Pós-contratação (aviso ou esconder do menu), bloco de "tokens ganhos" em Vagas. | A06, A07, A08, A09 | N4, N11 | P |
| 3 | **E-mail ao candidato com marca, prazo em destaque e botão "Ver minha candidatura"**, legível no celular. | A10, A11, A12 | **N74** | M |
| 4 | **Erros de autenticação em português, sem vazamento técnico, e gates com saída:** botão Sair em todos os gates e nada de Landing piscando para quem já está logado. | A13, A14, A15, A16, A17 | **N75**, **N76** | M |
| 5 | **Acessibilidade mínima:** nomes nos botões de ícone (Swipe, menu, tema, sair), `lang="pt-BR"`, `prefers-reduced-motion`, contraste dos textos e badges no tema claro. | A30–A38 | **N77**, **N78** | M |

Fora do Top 5, mas já planejado: os achados do Dashboard e da Jornada (A19, A20, A21) viram critérios de aceite do **N16**, o próximo item da F3.

---

## 3. Achados

Severidade: **bloqueia beta**, **alta**, **média**, **baixa**. Esforço: P ≈ 5h, M ≈ 20h, G ≈ 50h.

| ID | Tela | Tipo | Severidade | Evidência | Recomendação | Backlog | Esforço |
|---|---|---|---|---|---|---|---|
| A01 | Landing → Auth | bug | bloqueia beta | `src/screens/Auth.tsx:25` começa em `'candidate'`; `src/App.tsx:170-174` não passa `role`. Screenshot `auth-login-apos-sou-recrutador-desktop-escuro.png` | Passar o papel escolhido como prop inicial do Auth; no cadastro, mostrar o papel em destaque. | N4 / novo N73 | P |
| A02 | Auth (login) | usabilidade | média | `Auth.tsx:50` só valida e-mail e senha; o papel vem de `user_roles` (`features/auth/api.ts:27-39`) | No login, esconder a escolha Candidato/Recrutador, que é ignorada, ou avisar quando a conta é do outro papel. | novo N73 | P |
| A03 | Landing | texto desatualizado | bloqueia beta | `Landing.tsx:52-54` "Jornada com Tokens… Gamificação"; `:234` "Ganhe tokens por contratações"; `:233` "drag & drop" (o Pipeline não tem arrastar, item 4.1) | Trocar os pilares e o "Como funciona" pela promessa de retorno no prazo, a meta de 90% e o selo. | N4 / novo N73 | M |
| A04 | Landing | texto desatualizado | alta | `Landing.tsx:145-148` (92%, 3x, 50+, 340 tokens); `:263` "Experimente o protótipo"; `:294` "Protótipo visual"; `:271` "Explarar". Screenshot `landing-paginainteira-sem-rolar-desktop-escuro.png` | Remover os números fictícios ou trocar por compromissos do produto ("retorno em até 5 dias"); corrigir o erro de digitação. | N4 | P |
| A05 | Landing | usabilidade | bloqueia beta | Busca por "retorno" e "prazo" em `Landing.tsx`: 0 ocorrências. A headline `:110-116` fala de "match perfeito" e "Swipe" | Headline e subtítulo devem dizer o que é (ATS para PMEs), a promessa (todo candidato recebe retorno no prazo) e o próximo passo por papel. | novo N73 | M |
| A06 | Layout (todas as telas logadas) | texto desatualizado | bloqueia beta | `src/components/Layout.tsx:154` "Protótipo visual - dados mockados - JobMatch 2026". Screenshot `rodape-prototipo-desktop-escuro.png` | Trocar por rodapé real (marca, termos, privacidade, contato). | N4 | P |
| A07 | Global | texto desatualizado | alta | `index.html:7` `<title>Job Match Visual Prototype</title>`; nenhuma tela define `document.title` | Título "Job Match", com o nome da tela por rota. | N4 | P |
| A08 | Pós-contratação | texto desatualizado | bloqueia beta | `PostHire.tsx:26-28` (TODO(mock) e `mock-data`); `:72-75` "+330 Tokens ganhos", "R$ 4.7k". Screenshot `pos-contratacao-mobile-escuro.png` | Esconder do menu e do card do Dashboard (`Dashboard.tsx:202-213`) até o N11; se ficar, mostrar a faixa "Dados de exemplo". | N11 | P |
| A09 | Vagas (recrutador) | texto desatualizado | média | `JobsManagement.tsx:243-299` "Tokens ganhos", "Custo por contratação"; `job.hire` só é preenchido por `src/lib/mock-data.ts` (código morto com dados reais) | Remover o bloco ou reaproveitá-lo no N11. | N4 / N11 | P |
| A10 | E-mails ao candidato | visual | bloqueia beta | `supabase/functions/_shared/stage-update.ts:43-63` e `batch-feedback.ts:193-205`: `<div>` com estilo inline, sem logo, cor ou largura máxima. Screenshots `email-mudanca-etapa-600px.png`, `email-retorno-lote-600px.png` | Template com cabeçalho da marca, nome da empresa, bloco do prazo e rodapé padrão, com largura máxima de 600px. | novo N74 | M |
| A11 | E-mails ao candidato | usabilidade | alta | Nenhum link ou `APP_URL` em `supabase/functions/send-email/index.ts` nem em `_shared/` | Botão "Ver minha candidatura" que leva a Candidaturas. | novo N74 | P |
| A12 | E-mails ao candidato | usabilidade | alta | O prazo vem no meio da frase: "…da vaga X. Próximo retorno até 20/10/2026." (`stage-update.ts:58-59`) | Prazo em bloco próprio e no assunto ("Próximo retorno até 20/10"). | novo N74 | P |
| A13 | Auth | bug | alta | Erros do Supabase saem em inglês (`Auth.tsx:88-91`). Screenshot `auth-login-erro-credencial-mobile-claro.png` ("Invalid login credentials") | Mapear os códigos de erro do Supabase para mensagens em PT-BR com próximo passo. | novo N75 | P |
| A14 | Auth (cadastro) | bug | alta | Nome só com espaços exibe o JSON cru do Zod (`Auth.tsx:79-91`, `schemas.ts:11`). Screenshot `auth-cadastro-erro-nome-vazio-desktop-escuro.png` | Mostrar o erro por campo usando `error.issues`, nunca `error.message`. | novo N75 | P |
| A15 | Auth (cadastro) | usabilidade | média | Regra de senha invisível: o cliente só valida `min(1)` (`schemas.ts:7`) e o HTML usa `minLength=6` (`Auth.tsx:278`) | Dica abaixo do campo ("mínimo de 6 caracteres") e validação no Zod com mensagem em PT-BR. | novo N75 | P |
| A16 | Gates (TCLE, onboarding do candidato, formulário e "falta empresa" do recrutador) | usabilidade | alta | Não há botão Sair em `TcleConsentGate.tsx`, `CandidateOnboardingGate.tsx` nem `RecruiterOnboardingGate.tsx`, salvo no estado "pending" (`:289-301`). Screenshots `recrutador-gate-falta-empresa-desktop-escuro.png`, `recrutador-seed-apos-login-desktop-escuro.png` | Cabeçalho mínimo com logo e "Sair" em todos os gates. | N59 / novo N76 | P |
| A17 | App (carregamento da sessão) | bug | alta | `App.tsx:31` começa em `'landing'`, então o usuário logado vê a Landing enquanto a sessão carrega. Screenshot `carregando-inicial-desktop-escuro.png` | Estado inicial "carregando" com splash neutro até `auth.isLoading` ser falso. | N59 / novo N76 | P |
| A18 | Aguardando aprovação | usabilidade | média | `RecruiterOnboardingGate.tsx:271-301`: sem prazo de análise nem contato; "Verificar aprovação" sem feedback quando nada muda. Screenshot `recrutador-gate-aguardando-aprovacao-mobile-claro.png` | Informar o prazo esperado ("até 1 dia útil"), um contato e um toast "Ainda em análise". | novo N76 | P |
| A19 | Dashboard | usabilidade | alta | Nenhum dado de prazo, vencendo ou atrasado (`Dashboard.tsx`); só o card-link "Jornada do recrutamento" (`:220-236`). Screenshot `dashboard-desktop-escuro.png` | Critério do N16: mostrar "vencem hoje / atrasados / % no prazo" com link para o Pipeline filtrado. | N16 (critério) | — |
| A20 | Dashboard vazio | usabilidade | média | Com zero vagas, só aparecem cartões com 0 e "Nenhuma candidatura recebida ainda." (`Dashboard.tsx:248-252`). Screenshot `dashboard-vazio-desktop-escuro.png` | Critério do N16: estado vazio "Publique sua primeira vaga", com CTA e explicação de 1 linha sobre o prazo. | N16 (critério) | — |
| A21 | Jornada (menu) | texto desatualizado | média | `Layout.tsx:44` "Jornada" (chave `'tokens'`); "Jornada" tem 4 sentidos no app (Tokens, PostHire `:249`, JobsManagement `:295`, Auth `:198`). Screenshot `jornada-desktop-escuro.png` | Critério do N16: renomear para "Retorno no prazo" (menu e título) e tirar a promessa "Em breve o painel…" quando o painel existir. | N16 (critério) | — |
| A22 | Jornada × Retorno em lote | texto desatualizado | média | `Tokens.tsx:17` "no máximo 14 dias" vs `BatchFeedbackDialog.tsx:309` "Até 13 dias" (`MAX_POSTPONE_DAYS_PICKER = 13`) | Alinhar a regra num único texto vindo da mesma constante. | N16 (critério) | P |
| A23 | Retorno em lote, Jornada | texto desatualizado | baixa | `BatchFeedbackDialog.tsx:224-225` "É grátis e nunca trava."; `Tokens.tsx:27` "gratuitos e nunca travam" (resquício de quando o token pagava). Screenshot `retorno-em-lote-dialogo-desktop-escuro.png` | Remover; sem tokens, "grátis" não informa nada. | N4 | P |
| A24 | Swipe, Vaga (JobDetail) | usabilidade | alta | O candidato não vê o prazo de retorno antes de se candidatar (`Swipe.tsx:160-192`, `JobDetail.tsx:128-145`) | Selo "Retorno em até 5 dias" no card e na página da vaga. | N65 / 3.5 (critério) | — |
| A25 | Swipe | bug | média | Vagas já candidatadas voltam ao deck (`features/jobs/api.ts:11-16` não filtra); "Voltar" do JobDetail reinicia o deck (`App.tsx:36`, `206`). Só pelo código: o seed tem 5 vagas com o mesmo título, o que impediu provar pela tela | Filtrar as vagas com candidatura e preservar a posição do deck. | novo N80 | P |
| A26 | Pipeline | usabilidade | média | Mover de etapa fecha o modal sem confirmação (`Pipeline.tsx:445`) | Toast "Ana movida para Entrevista · aviso enviado por e-mail". | novo N79 | P |
| A27 | Perfil, Minha empresa, onboarding do candidato | usabilidade | média | Os erros de carregamento não têm botão de tentar de novo (`Profile.tsx:126-132`, `Company.tsx:49-55`, `CandidateOnboardingGate.tsx:19-25`) | Botão "Tentar de novo" igual ao das outras telas. | novo N79 | P |
| A28 | Onboarding do candidato | texto desatualizado | baixa | O título é "Editar perfil" no primeiro acesso (`CandidateProfileForm.tsx:261-262`, porque `getMyCandidateProfile` sempre retorna um objeto). Screenshot `candidato-apos-cadastro-onboarding-desktop-escuro.png` | Usar "Complete seu perfil" quando `isCandidateProfileComplete` for falso. | novo N79 | P |
| A29 | Global | consistência | média | "retorno" × "feedback" no mesmo fluxo (`Pipeline.tsx:195` × `:524`; `Applications.tsx:90` × `:116`); "JobMatch" × "Job Match" (`Logo.tsx:21` × e-mails/TCLE); "Tentar de novo" × "Tentar novamente"; "Dashboard", "Pipeline" e "Swipe" em inglês | Glossário curto (candidatura, retorno, prazo, etapa, vaga) aplicado em todas as telas e e-mails. | N4 / novo N81 | M |
| A30 | Swipe | acessibilidade | bloqueia beta | Os botões Passar, Candidatar e Detalhes não têm nome acessível (`Swipe.tsx:446-470`); o axe aponta `button-name` em 32 telas, com 177 ocorrências | `aria-label` em todos os botões só com ícone: Swipe, tema, sair, menu (`Layout.tsx:97-122`), compartilhar, kebab. | novo N77 | P |
| A31 | Global | acessibilidade | alta | `index.html:2` `lang="en"` com a interface em PT-BR | `lang="pt-BR"`. | novo N77 | P |
| A32 | Landing e telas animadas | acessibilidade | alta | Não há `useReducedMotion`/`MotionConfig` em `src/`; os pilares e o CTA só aparecem com `whileInView` (`Landing.tsx:153`, `179`, `252`). Screenshot `landing-paginainteira-sem-rolar-desktop-escuro.png` (blocos vazios) × `landing-paginainteira-apos-rolar-desktop-escuro.png` | `<MotionConfig reducedMotion="user">` na raiz e conteúdo visível sem depender da animação. | novo N77 | P |
| A33 | Tema claro | acessibilidade | alta | O axe acusa 156 falhas de contraste no claro × 86 no escuro. Cores `jm-*` fixas no branco: teal 2,49:1, laranja 2,80:1, vermelho 3,76:1 (`tailwind.config.js:68-74`); badges `text-slate-400` em `Applications.tsx:28`. Screenshots `swipe-desktop-claro.png`, `candidaturas-desktop-claro.png` | Variantes escuras das cores `jm-*` no `.light` e badges com texto ≥ 4,5:1. | novo N78 | M |
| A34 | Global | acessibilidade | média | Texto branco sobre o gradiente roxo→teal (CTAs, abas do Auth) fica em 2,49:1 na ponta teal; avatares brancos sobre teal e laranja (`recruiter-applications.ts:51`) | Escurecer a ponta teal do gradiente e a paleta dos avatares. | novo N78 | P |
| A35 | Mobile (Layout, Swipe, Pipeline, diálogos) | acessibilidade | média | Alvos < 44px: hambúrguer de cerca de 24×15 (`Layout.tsx:113`), chips de filtro de cerca de 24px (`JobFiltersBar.tsx:118`), "Selecionar todos" e "Limpar filtros" de cerca de 16px, X dos diálogos com 16px (`dialog.tsx:218`), checkboxes `h-4`. Screenshot `swipe-mobile-escuro.png` | Área clicável mínima de 44×44 nos controles do mobile (padding, não o ícone). | novo N77 | M |
| A36 | Dashboard, Pós-contratação, Vagas | acessibilidade | média | Cards clicáveis sem `role` nem `tabIndex` (`Dashboard.tsx:184-223`, `PostHire.tsx:91-98`); menu kebab sem Esc nem foco (`JobsManagement.tsx:186-225`) | Usar `<button>` ou `<a>` e um menu acessível (shadcn DropdownMenu). | novo N77 | P |
| A37 | Formulários | acessibilidade | baixa | Campos sem label associado: cargo desejado (`CandidateProfileForm.tsx:442-454`), switch Obrigatória (`JobCreate.tsx:578`), grupos de botões sem `aria-pressed` (`JobCreate.tsx:302-326`); barras de progresso sem nome (axe `aria-progressbar-name`) | Associar labels e estados. | novo N77 | P |
| A38 | Global | acessibilidade | baixa | O foco visível depende do padrão do navegador em cerca de 40 `<button>` nativos; o `ring-1` do shadcn é fino; `outline-none` no select do Pipeline (`Pipeline.tsx:201`) | Classe utilitária `focus-visible:ring-2` comum a todos os botões nativos. | novo N77 | P |
| A39 | Vaga (JobDetail) | bug | baixa | O botão Compartilhar não faz nada (`JobDetail.tsx:214-216`) | Remover ou implementar (copiar link). | N36–N38 (só bug) | P |
| A40 | Pipeline | visual | baixa | A 5ª coluna (e as seguintes) fica escondida atrás da rolagem horizontal no desktop de 1280px. Screenshot `pipeline-desktop-claro.png` | Colunas mais estreitas ou um resumo por etapa no topo. | 4.1 (parcial) | P |
| A41 | Auth (cadastro) e TCLE | texto desatualizado | alta | "RASCUNHO: revisar juridicamente" visível (`Auth.tsx:352-354`, `features/consents/content.ts:6`). Screenshot `auth-cadastro-desktop-escuro.png` | Fechar o texto jurídico antes do beta e remover o aviso. | novo N82 | P (dev) |
| A42 | Diálogos | consistência | baixa | O botão fechar dos diálogos tem nome "Close" em inglês (`src/components/ui/dialog.tsx:218-221`) | Traduzir para "Fechar". | novo N77 | P |

Achados já confirmados no briefing:

| # do briefing | Situação | Achados |
|---|---|---|
| 1 | Confirmado | A01, A02 |
| 2 | Confirmado | A03, A04, A05 |
| 3 | Confirmado | A06 |
| 4 | Confirmado | A10–A12 |
| 5 | Confirmado | A21 |
| 6 | Confirmado | A08 |

---

## 4. Itens novos sugeridos para o backlog

| ID | Epic/Área | Item | Tamanho | MoSCoW | Fase sugerida | Observação |
|---|---|---|---|---|---|---|
| N73 | Aquisição / Landing | Nova Landing centrada no retorno no prazo: o que é, para quem, como funciona em cada lado, CTA por papel com o papel levado ao Auth | M | Must | F3 | Cobre A01–A05. O N4 faz só a limpeza de texto; este item muda a mensagem. |
| N74 | Comunicação com o candidato | Template de e-mail com marca, prazo em destaque, botão "Ver minha candidatura" e versão texto equivalente | M | Must | F3 | Cobre A10–A12. Depende de uma `APP_URL` nas functions. A versão texto já existe (`email-core.ts:6-10`). |
| N75 | Auth | Mensagens de erro de autenticação em PT-BR, erros por campo e regra de senha visível | P | Must | F3 | Cobre A13–A15. |
| N76 | Gates / Sessão | "Sair" em todos os gates, splash de sessão sem Landing e informações na espera da aprovação | P | Must | F3 | Cobre A16–A18. Relacionado ao N59. |
| N77 | Acessibilidade | Base de acessibilidade: nomes em botões de ícone, `lang`, reduced motion, alvos de 44px, foco visível, labels, menus acessíveis | M | Must | F3 | Cobre A30–A32, A35–A38, A42. Sugestão: rodar o axe no CI. |
| N78 | Design system | Contraste AA no tema claro e no gradiente da marca | M | Should | F3 | Cobre A33–A34. Ajustar `index.css` e `tailwind.config.js`, sem tocar em `src/shared/ui`. |
| N79 | Estados de tela | Feedback de sucesso no Pipeline, "tentar de novo" em todos os erros e título correto no onboarding | P | Should | F3 | Cobre A26–A28. |
| N80 | Swipe | Não reexibir vagas já candidatadas e manter a posição do deck ao voltar da vaga | P | Should | F3 | Cobre A25. É bug, não redesenho (F5 intacta). |
| N81 | Conteúdo | Glossário de termos e tom (retorno, prazo, etapa, candidatura; marca "Job Match") aplicado em telas e e-mails | M | Should | F3 | Cobre A29. Pode ser feito junto com o N4. |
| N82 | LGPD / Jurídico | Texto final de Termos e Política e remoção do aviso "RASCUNHO" | P (dev) | Must | F3 | Cobre A41. Depende de revisão jurídica externa. |

Itens existentes que recebem critérios de aceite desta auditoria:
- **N16 (painel de meta)**
  - A19: indicadores de prazo no Dashboard.
  - A20: estado vazio com a primeira vaga.
  - A21: renomear "Jornada".
  - A22: regra única de adiamento (13 × 14 dias).
- **N65 / 3.5 (selo de retorno na página da vaga)**
  - A24: mostrar o prazo de retorno no card do Swipe e na página da vaga, antes de o candidato se candidatar.
- **N11 (Pós-contratação)**
  - A08: esconder do menu e do Dashboard até existir dado real.
  - A09: remover o bloco de contratação em Vagas.
- **N4 (textos de protótipo)**
  - Absorve A04, A06, A07, A09 e A23.

---

## 5. O que não foi verificado na tela, e por quê

| Item | Motivo | Como foi auditado |
|---|---|---|
| E-mails em clientes reais (Gmail, Outlook, celular) e o remetente real | As Edge Functions estavam paradas no Supabase local e o envio depende do Resend | Renderizei o HTML com as funções reais (`renderBatchFeedbackEmail`, `renderStageUpdateEmail`) em 600px e 360px. Assunto, remetente (`"<Empresa> via Job Match"`, `batch-feedback.ts:168-175`), `reply_to` e versão texto foram vistos no código. |
| Confirmação de e-mail no cadastro | `enable_confirmations = false` no `supabase/config.toml:225` local | Pelo código: mensagem "Conta criada. Confirme seu e-mail…" (`Auth.tsx:71`), sem botão de reenviar. |
| Redefinição de senha com link válido | Exige o link do e-mail de recuperação | Testei só o estado "link inválido" (`reset-password-link-invalido-*`) e o sucesso do pedido (`auth-recuperar-senha-sucesso-*`). |
| Envio efetivo de retorno em lote, "Não avançou", "Avançou" e conclusão do encerramento de vaga | Dispara e-mails pelas Edge Functions, que estavam paradas localmente | Capturei os diálogos abertos (`retorno-em-lote-dialogo-*`, `encerrar-vaga-dialogo-*`). Estados de progresso e resultado só pelo código. |
| Badges "Vence em Xh" e "Atrasado há…" | Exigiria avançar o relógio ou editar prazos | Pelo código (`stage-deadline.ts:94-114`); o badge "5 dias para responder" aparece em `pipeline-*`. |
| Foco visível percorrendo com Tab e leitor de tela | Não fiz navegação manual por teclado nem teste com NVDA | Pelo código e pelo axe-core. |
| `prefers-reduced-motion` | Não emulei | Pelo código: não há tratamento algum (A32). |
| Alvos de toque | Medidos pelas classes CSS, não com medição de pixels | Pelas classes Tailwind e shadcn (A35). |
| Fluxo do perfil do candidato na tela (passos 2 e 3 do onboarding) | Para economizar tempo, completei o perfil via SQL no banco local | Capturei o passo 1 (`candidato-apos-cadastro-onboarding-*`); o resto pelo código. |
| Publicação completa de uma vaga (JobCreate até "Vaga publicada!") | Capturei só o passo 1 e a validação | Os passos seguintes pelo código (`JobCreate.tsx:148-158`, `706-748`). |

Notas sobre o ambiente:
- O banco local tinha só a primeira migration aplicada (volume antigo do Docker). Rodei `supabase migration up --local` e reapliquei os seeds antes das capturas, e nenhum achado vem desse estado.
- Para entrar como recrutador, defini uma senha local para `recrutador.teste@jobmatch.dev` e registrei o aceite do TCLE.
- O seed 02 não traz consentimento, então esse usuário cai no gate de TCLE (`recrutador-seed-apos-login-*`).
- Nenhum arquivo do app nem `.env` foi alterado.

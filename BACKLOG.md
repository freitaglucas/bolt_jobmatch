# Backlog — Job Match (v4, 26/10/2026)

Espelho da planilha `productbacklog_261026_v4.xlsx` (aba "Backlog v4"). A planilha é a fonte;
as observações de cada item (auditoria de 26/10 e decisões) estão lá. A régua de produto é o guia
"Job Match — Premissas e guia de produto"; as regras para agentes estão no `AGENTS.md`.

Como usar:
- Construa na ordem da coluna "Ordem", um item por PR, sem antecipar itens.
- Ao fazer o merge de um item, marque `[x]` aqui e atualize o status na planilha.
- Nenhum item novo de código entra antes do merge do anterior.

## Beta (~471 h)

Fase atual. Saída: premissas M1, M3 (candidatura em até 3 minutos), N2 e G2 medidas.

### B0 · Base para os agentes (~21 h)

- [x] **1. N1A** (Governança): AGENTS.md alinhado ao guia de premissas e ao backlog v3 — 2 h · Must · concluído no PR do N1A + N1
- [x] **2. N1** (Governança): Unificar backlog e CONTEXTO com o código — 4 h · Must · concluído no PR do N1A + N1
- [ ] **3. NOVO-5** (Fundação): Ambiente do Beta conferido: migrations de 21/10 e 22/10 e send-email em produção, APP_URL, EMAIL_FROM, plano do Resend, confirmação de e-mail, região do Supabase — 4 h · Must
- [x] **4. NOVO-7** (Governança): Limpeza dos restos de tokens — 3 h · Should
- [ ] **5. N59** (Qualidade): Teste de renderização do App: gates montados por papel — 8 h · Should

### B1 · Match v2 e catálogo (~228 h)

- [ ] **6. N30** (Match): Régua de 3 níveis (básico, intermediário, avançado) com descritor por nível — 25 h · Must
- [ ] **7. N31** (Match): Tipos de item: competência (inclui prática comportamental com evidência), ferramenta, requisito sim/não e traço comportamental (fora do score); papel na vaga: obrigatório, desejável ou implícito — 30 h · Must
- [ ] **8. N35** (Match): Importância em 3 níveis (substitui 1–5) — parcial · 2 h · Must
- [ ] **9. N33** (Match): Grupos de alternativas ("1 de: AWS, GCP, Azure"; "2 de 4") — 25 h · Must
- [ ] **10. N93** (Match): Catálogo com sinônimos (skill_aliases) e famílias (pai e filhos): sinônimos valem o mesmo item; vaga que pede o pai aceita qualquer filho — 20 h · Must
- [ ] **11. N41** (Fundação): Catálogo v1: itens atômicos do estudo de 100 vagas (competências, ferramentas, requisitos, traços), com sinônimos e famílias, curados antes do Beta — 40 h · Must
- [ ] **12. N94** (Match): Fila e curadoria do catálogo: termo novo vai para skill_catalog_queue; job semanal (curate-catalog, em lote) propõe sinônimo, filho ou item novo; o PO aprova (planilha no Beta) — 15 h · Must
- [ ] **13. N32** (Match): Fórmula v2: obrigatório 1,0 · implícito 0,5 · desejável soma até +15%; item acrescentado pelo candidato vale 0,7; traços fora do score — 25 h · Must
- [ ] **14. N34** (Vagas): Composição da vaga: técnicas sem limite; até 3 pontos fortes da lista fechada; aviso acima de ~10 obrigatórias — 5 h · Must
- [ ] **15. NOVO-3** (Match): Foto do perfil em cada candidatura; recalcular o score só quando muda o catálogo (curadoria) ou a vaga — 8 h · Must
- [ ] **16. N36** (Match): Faixas de compatibilidade para o candidato (altíssima, alta, compatível, não compatível) pela cobertura do núcleo; score numérico com fatores para o recrutador — 20 h · Must
- [ ] **17. N39** (Match): Senioridade como rótulo da empresa, fora do score — parcial · 1 h · Should
- [ ] **18. N90** (Match): Origem de cada item em duas classes (veio do currículo × acrescentado pelo candidato) e nível sugerido por regra de tempo e recência — 12 h · Should

### B2 · Do link à candidatura (~172 h)

- [ ] **19. NOVO-4** (Compliance): LGPD do currículo: consentimento próprio para a IA ler o texto, não guardar o PDF (leitura no navegador) e política de retenção — 5 h · Must
- [ ] **20. NOVO-1** (Vagas): Página pública da vaga com rota por URL (/vaga/<id>), leitura anônima mínima, prévia no LinkedIn e evento "abriu a vaga" sem login — 15 h · Must
- [ ] **21. 3.5** (Vagas): Página completa da vaga — parcial · 3 h · Should
- [ ] **22. N95** (Candidato): Currículo por experiência: candidate_experiences, itens por experiência com trecho de evidência, formação e idiomas; tempo por competência pela união de períodos — 30 h · Must
- [ ] **23. N88** (Match): Leitura do currículo: layout do PDF do LinkedIn no navegador (sem IA), edge function enrich-cv (uma chamada de IA por currículo) e map-skills (sinônimo exato → semelhança de texto → IA escolhe entre 5 → fila) — 55 h · Must
- [ ] **24. N96** (Candidato): Pontos fortes: 3 slots, lista fechada de ~15 traços com descrição curta, pré-preenchidos pelo currículo ou pela função anterior; o candidato troca com um toque; fora do score; o recrutador vê "x de 3 em comum" e pode filtrar — 12 h · Must
- [ ] **25. N89** (Match): Candidatura em até 3 minutos pelo celular: página da vaga → currículo → uma tela de revisão pré-preenchida (experiências, competências, pontos fortes, requisitos sim/não da vaga) → conta no fim → candidatar — 35 h · Must
- [ ] **26. N98** (Candidato): Candidatura sem PDF: três perguntas (última função, tempo nela, requisitos sim/não da vaga) já geram match — 8 h · Must
- [ ] **27. 1.1** (Autenticação): Login com Google — 5 h · Must
- [ ] **28. N84** (Telemetria): Eventos do funil do candidato: abriu a vaga, começou o perfil, enviou currículo, completou o perfil, candidatou-se — parcial · 4 h · Must

### B3 · Retorno com motivo (~21 h)

- [ ] **29. N67** (Retorno): Ritmo fixo de retorno ("toda sexta") — 10 h · Should
- [ ] **30. N29** (Integração): Exportar CSV (candidatos, etapa, tempo em etapa, responsável) — 6 h · Should
- [ ] **31. N42** (Telemetria): Eventos feedback_viewed e mudança de competência/nível no perfil — 5 h · Should

### B4 · Pronto para testers (~29 h)

- [ ] **32. N82** (Compliance): Texto final de Termos e Política e remoção do aviso "RASCUNHO" — 3 h · Must
- [ ] **33. N21** (Equipe): Vaga com recrutador responsável e requisitante — 6 h · Must
- [ ] **34. NOVO-6** (Empresa): Dado já marcado com a empresa no Beta: jobs.company_id obrigatório para vaga ativa; company_id em applications, feedback_deadlines, application_reserves e email_log, preenchido por trigger a partir da vaga; tabelas do v2 penduradas em job_id — 6 h · Should
- [ ] **35. 6.2** (Telemetria): Log de eventos — parcial · 5 h · Must
- [ ] **36. N79** (Qualidade): Feedback de sucesso no Pipeline, "tentar de novo" em todos os erros e título correto do onboarding — parcial · 4 h · Should
- [ ] **37. N87** (Aquisição): Landing v2: compatibilidade para os dois lados + retorno com motivo gerado pelo match + gestor no prazo; preço visível e pedido de piloto pago — 5 h · Should

## Pós-beta / MVP (~613 h)

Saída: pentest sem gap crítico, LGPD revisada, clientes pagando com org_id, primeiro pedido Enterprise.

### P1 · Cobrar e proteger (LGPD, pentest, empresa) (~210 h)

- [ ] **38. N18** (Empresa): Empresa como unidade de isolamento (org_id + RLS) — 50 h · Must
- [ ] **39. N44** (Planos): Planos e direitos no banco (licenças por papel, módulos, meta e desconto) — 20 h · Must
- [ ] **40. N45** (Planos): Cobrança recorrente — 50 h · Must
- [ ] **41. 6.1** (Compliance): LGPD granular — 20 h · Should
- [ ] **42. 4.4** (Compliance): Logs de auditoria — parcial · 5 h · Must
- [ ] **43. N61** (Governança): Marca e domínio: checar INPI e cotar jobmatch.com — 5 h · Should
- [ ] **44. N77** (Acessibilidade): Base de acessibilidade: nomes nos botões de ícone, lang pt-BR, reduced motion, alvos de 44px, foco e labels — 20 h · Must
- [ ] **45. N78** (Design system): Contraste AA no tema claro e no gradiente da marca — 20 h · Should
- [ ] **46. N81** (Conteúdo): Glossário de termos e tom aplicado em telas e e-mails — 20 h · Should

### P2 · Gestor no prazo (~200 h)

- [ ] **47. N85** (Equipe): Ação do gestor sem login: e-mail "N candidatos esperam você até <data>" com botões avançar, reprovar com motivo e adiar uma vez — 20 h · Must
- [ ] **48. N23** (Pipeline): Etapas com responsável e SLA próprio (padrão do admin, ajustável por vaga) — 20 h · Must
- [ ] **49. N22** (Equipe): Visão do requisitante (candidatos da vaga, perfil, currículo, ficha, notas, decisão na etapa dele) — 20 h · Must
- [ ] **50. N51** (Equipe): Requisitante como convidado grátis, com acesso a uma vaga ou a um conjunto de vagas liberado — 50 h · Must
- [ ] **51. N19** (Equipe): Papéis pagos e convites: admin (gestor de RH) e recrutador — 20 h · Must
- [ ] **52. N20** (Equipe): RLS por empresa e papel, com testes pgTAP de acesso negado — 20 h · Must
- [ ] **53. 6.5** (Comunicação): E-mails de aviso de SLA à equipe — 20 h · Must
- [ ] **54. N68** (Retorno): Atingimento da meta por responsável da etapa (separar o atraso do gestor) — 5 h · Should
- [ ] **55. N86** (Retorno): Média de dias até o retorno no selo público da vaga — 5 h · Should
- [ ] **56. N27** (Telemetria): Painel do admin em três subjanelas: Candidatos, Pipeline da vaga, Painel geral — 20 h · Must
- [ ] **57. N13** (Produto): Arquitetura multi-equipe com SLAs (gerente de RH, dono da vaga) — Must

### P3 · Contratar certo e acabamento (~105 h)

- [ ] **58. N12** (Produto): Pós-contratação real (3 meses de experiência) — 20 h · Could
- [ ] **59. N11** (Aviso): Aviso "Dados de exemplo" na tela PostHire — parcial · 5 h · Could
- [ ] **60. N37** (Match): Ficha de compatibilidade completa (núcleo, alternativas, desejáveis) — 20 h · Should
- [ ] **61. 3.6** (Match): Competências bônus — 5 h · Could
- [ ] **62. 4.1** (Pipeline): Pipeline Kanban — parcial · 5 h · Could
- [ ] **63. N70** (Retorno): Modelos de retorno salvos por empresa e "este retorno foi útil?" para o candidato — 20 h · Could
- [ ] **64. N8** (Qualidade): Atomicidade feedback + mover etapa (hoje são duas chamadas) — 5 h · Could
- [ ] **65. N9** (Qualidade): Reenvio não pode duplicar feedback — 5 h · Could
- [ ] **66. N80** (Swipe): Não reexibir vagas já candidatadas e manter a posição do deck ao voltar da vaga — 5 h · Should
- [ ] **67. NOVO-8** (Retorno): Reserva visível ao candidato: estado "Em reserva" na linha do tempo, saída com um clique, validade ligada ao fechamento da vaga — 15 h · Could

### P4 · Vaga e currículo mais ricos (~98 h)

- [ ] **68. P1** (Vagas): Parser de vaga: pré-preenche o formulário a partir do texto colado; o formulário vence o texto e avisa quando discordam — 30 h · Should
- [ ] **69. N99** (Vagas): Relação "afim" sugerida ao recrutador ao criar a vaga ("aceitar também Tableau?"); se aceitar, vira grupo "1 de" — 10 h · Should
- [ ] **70. N100** (Candidato): Segmento e porte: taxonomia de 20 segmentos nas experiências (deduzido pela IA, confirmado pelo candidato) e exigência de segmento na vaga, com tempo por segmento — 20 h · Should
- [ ] **71. N101** (Empresa): Cadastro de empresa com segmento, porte e grupo (marcas e CNPJs) — 8 h · Should
- [ ] **72. N102** (Vagas): Profissões regulamentadas e certificados com validade e carga horária (OAB, COREN, NR-10, CNH por categoria) — 20 h · Could
- [ ] **73. N103** (Vagas): Remuneração em partes: fixo, variável, regime (CLT, PJ, MEI, temporário) e base de cálculo — 10 h · Could

## Produto (~535 h)

Roadmap.

### R1 · Enterprise e integrações (~205 h)

- [ ] **74. N46** (Integração): API de leitura, webhooks de mudança de etapa e conector MCP — 50 h · Should
- [ ] **75. N55** (Integração): Integrações sob demanda (Gold): conectores por cliente sobre a API e os webhooks — 50 h · Could
- [ ] **76. N54** (Match): Ajuste fino dos descritores por empresa (Gold) — 20 h · Could
- [ ] **77. N28** (Empresa): Configurações da empresa: rótulos de senioridade, modelo de etapas, SLA padrão — 20 h · Should
- [ ] **78. N49** (Empresa): Vários modelos de etapas por empresa; recrutador que atende várias empresas — 20 h · Could
- [ ] **79. N43** (Empresa): Competência criada pela empresa (catálogo vivo com curadoria) — 20 h · Could
- [ ] **80. N66** (Planos): Desconto real na fatura por atingimento da meta de retorno no prazo — 5 h · Could
- [ ] **81. 6.4** (Compliance): Painel de auditoria — 20 h · Could

### R2 · Relacionamento e volume (~165 h)

- [ ] **82. N47** (Comunicação): Automações por WhatsApp — 50 h · Could
- [ ] **83. N52** (Pipeline): Linha do tempo de relacionamento com o candidato (contatos, mensagens, entrevistas, notas, retornos) — 20 h · Should
- [ ] **84. N53** (Pipeline): Banco de talentos (reaproveitar candidatos em vagas futuras) — 20 h · Could
- [ ] **85. N24** (Pipeline): Entrevistas: link da gravação, notas estruturadas e decisão — 20 h · Must
- [ ] **86. N48** (Pipeline): Gravação hospedada e transcrição de entrevistas — 50 h · Could
- [ ] **87. N26** (Comunicação): Escalonar SLA vencido ao admin — 5 h · Could

### R3 · Lado do candidato (~165 h)

- [ ] **88. N91** (Carreira): Objetivo de Carreira: o candidato trava até 3 vagas-meta por um período — 50 h · Could
- [ ] **89. N92** (Carreira): Certificações de competências e integração com cursos online (ex.: Alura) como evidência de nível — 50 h · Could
- [ ] **90. N7** (Match): Match por perguntas comportamentais — Could
- [ ] **91. N40** (Vagas): Campo "resultado esperado da vaga" — 5 h · Could
- [ ] **92. N50** (Match): Famílias e equivalências de competências com crédito parcial — 50 h · Could
- [ ] **93. 3.4** (Vagas): Favoritos — 5 h · Could
- [ ] **94. N6** (Performance): Code-splitting do bundle — 5 h · Could

## Feito (48 itens)

- [x] **95. N74** (Retorno): E-mail ao candidato com marca, prazo em destaque e botão "Ver minha candidatura"
- [x] **96. N83** (Retorno): Estado "Em reserva": candidato informado, validade ligada ao fechamento da vaga ou a um teto de dias (1 renovação avisada), saída com um clique, retorno final no encerramento · regra de 22/10: reserva interna, só na etapa Final; a versão visível ao candidato é o NOVO-8
- [x] **97. N75** (Autenticação): Erros de login e cadastro em PT-BR, erro por campo e regra de senha visível
- [x] **98. N76** (Autenticação): Botão Sair em todos os gates, splash de sessão e informações na espera da aprovação
- [x] **99. 0.1** (Fundação): CI/CD (lint, typecheck, testes)
- [x] **100. 0.2** (Fundação): Políticas RLS
- [x] **101. 0.3** (Fundação): Seed de competências
- [x] **102. 0.4** (Fundação): Seed de 50 vagas
- [x] **103. 1.2** (Autenticação): Login e-mail/senha
- [x] **104. 1.3** (Onboarding): Onboarding do candidato
- [x] **105. 1.4** (Onboarding): Onboarding do recrutador
- [x] **106. 1.5** (Compliance): TCLE no cadastro
- [x] **107. 2.1** (Vagas): Criar vaga
- [x] **108. 2.2** (Vagas): Listar vagas (candidato)
- [x] **109. 2.3** (Match): Cálculo do Match Score
- [x] **110. 2.4** (Vagas): Candidatar-se
- [x] **111. 2.5** (Vagas): Detalhe da vaga (recrutador)
- [x] **112. 3.1** (Match): Swipe (useSwipeDeck)
- [x] **113. 3.2** (Match): Match explicado (visual)
- [x] **114. 3.3** (Pipeline): Etapas do funil
- [x] **115. 4.2** (Pipeline): Registrar feedback
- [x] **116. 4.3** (Pipeline): Enviar feedback ao candidato
- [x] **117. 4.5** (Pipeline): Perfil do candidato no pipeline
- [x] **118. 4.6** (Pipeline): Rejeitar candidatura
- [x] **119. 5.1** (Tokens): SLA de 5 dias
- [x] **120. 5.2** (Tokens): Débito de token
- [x] **121. 5.3** (Tokens): Crédito por feedback no prazo
- [x] **122. 5.4** (Tokens): Paywall em saldo zero
- [x] **123. 5.5** (Tokens): Contador de prazo
- [x] **124. N2** (Match): Teste de paridade do score TS × SQL
- [x] **125. N3** (Fundação): Recrutador de teste aprovado no seed
- [x] **126. N4** (Governança): README e limpeza do repo
- [x] **127. N5** (Tokens): Extrato de tokens com saldo derivado
- [x] **128. N14** (Tokens): Tirar o débito de token ao mover etapa
- [x] **129. N15** (Retorno): Retorno em lote ao candidato, grátis: decisão com motivo ou atualização honesta com nova data
- [x] **130. N16** (Retorno): Atingimento da meta de retorno no prazo (por vaga e recrutadora) + desconto simulado no painel
- [x] **131. N17** (Comunicação): Infra de e-mail transacional (edge function + provedor)
- [x] **132. N56** (Equipe): Recrutador aprovado sem empresa e gate de cadastro fora do App (bug)
- [x] **133. N57** (Empresa): Tela Minha empresa (editar empresa, cargo e telefone)
- [x] **134. N58** (Vagas): Lista completa de competências e filtro por categoria ao criar vaga
- [x] **135. N60** (Comunicação): Domínio e e-mail oficial: jobmatchrh.com (Zoho, DNS, Resend)
- [x] **136. N62** (Retorno): Motivos estruturados na tela de lote: 5 motivos fixos, agrupamento automático, lacunas e pontos fortes por candidato, prévia de 3 mensagens
- [x] **137. N63** (Retorno): Prazo de retorno por candidato: data de próximo retorno, atualização honesta e limite de adiamentos
- [x] **138. N64** (Retorno): Encerrar a vaga pede o retorno final a todos os pendentes
- [x] **139. N65** (Retorno): Selo público de resposta na página da vaga
- [x] **140. N71** (Retorno): Aviso automático ao candidato na mudança de etapa (in-app e e-mail)
- [x] **141. N72** (Qualidade): Auditoria de front-end e usabilidade antes do beta
- [x] **142. N73** (Aquisição): Nova Landing centrada no retorno no prazo, com papel levado ao cadastro

## Removido (11 itens)

Fora do backlog de produto; voltam só com evidência nova (ver "Fora de escopo" no guia).

- ~~N38: Botão "Tenho essa competência" na tela de match~~
- ~~6.3: Painel para professores (reusa o painel do admin)~~
- ~~N10: Medir abuso de atualização sem decisão ("ainda em análise")~~
- ~~N25: Flags do requisitante: alta prioridade, prioridade, banco~~
- ~~N69: Destaque no swipe para empresas que atingem a meta de retorno no prazo~~
- ~~D1: Piloto manual do gestor no prazo: 1 ou 2 vagas reais da R03, com prazo por etapa e aviso ao gestor feito à mão (WhatsApp ou e-mail)~~
- ~~D2: Teste de mensagens com 10 a 15 candidatos recentes: 3 versões de rejeição (genérica, com motivo, completa) e 2 de "em reserva"~~
- ~~D3: Entrevistas com 10 a 15 gestoras de RH de PME (50 a 500 pessoas) sobre o passado~~
- ~~D4: Teste cego da premissa 5 com a R01: os 5 favoritos dela numa vaga × o top 5 do score~~
- ~~D5: Teste de títulos da Landing: compatibilidade × retorno × combinação~~
- ~~D6: Funil do perfil numa vaga real: de quem abre o link, quantos completam o perfil e se candidatam, e em que faixa~~

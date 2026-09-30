# Taxonomia de Competências (Skills)

Este documento descreve a taxonomia de competências usada pelo Match Score e
explica como interpretar os níveis. Ele existe porque o schema do banco
**não guarda nível dentro da tabela `skills`** — o nível é sempre relativo a
um contexto: quanto uma vaga exige (`job_skills.required_level`) ou quanto um
candidato declara possuir (`candidate_skills.declared_level`). A tabela
`skills` guarda só o nome, a categoria (`hard`/`soft`) e uma descrição.

> Regra do produto (inviolável): o parser de vaga nunca define nível ou peso
> de competência — isso é sempre uma decisão humana do recrutador.

## Escala de nível (1 a 5)

Usada em `job_skills.required_level` (o quanto a vaga exige) e em
`candidate_skills.declared_level` (o quanto o candidato diz que tem).

| Nível | Descritor | O que significa |
|-------|-----------|------------------|
| 1 | Básico | Já teve contato, entende o conceito, precisa de apoio constante para aplicar. |
| 2 | Em desenvolvimento | Consegue aplicar em tarefas simples e supervisionadas. |
| 3 | Intermediário | Aplica com autonomia no dia a dia, resolve problemas comuns sozinho(a). |
| 4 | Avançado | Domina a competência, resolve problemas complexos e ajuda outras pessoas. |
| 5 | Referência | É referência técnica/organizacional nessa competência, define padrões para o time. |

### Correspondência sugerida com senioridade (uso interno, não é regra de schema)

Esta correspondência é só uma referência para calibrar `required_level` ao
escrever vagas — **não existe coluna de senioridade em `jobs`** (isso está
previsto para o item 2.1 do backlog, ainda não implementado). Nas vagas de
teste do seed, a senioridade aparece apenas no **título** da vaga.

| Senioridade da vaga | `required_level` sugerido |
|----------------------|---------------------------|
| Júnior | 1 a 3 |
| Pleno | 2 a 4 |
| Sênior | 3 a 5 |
| Lead / Especialista | 5 |

## Competências cadastradas

A lista abaixo inclui as competências já existentes desde a migração inicial
(`20260929122000_initial_schema.sql`) **mais** as adicionadas pelo seed
`supabase/seeds/01_skills.sql`. Os nomes usam termos em português quando há
uso corrente no mercado brasileiro; nomes de tecnologia ficam no idioma
original (ex.: "React").

### Hard skills

**Já existentes na migração inicial:**
Análise de Dados, AWS, Canvas, CI/CD, Gestão de Projetos, Git, Mapeamento,
Metodologias Ágeis, Node.js, PostgreSQL, Startups.

**Base comum (adicionadas pelo seed):**
Testes Automatizados, Docker, Kubernetes, Linux, Observabilidade e
Monitoramento, Segurança da Informação, Arquitetura de Software, Modelagem
de Dados, SQL, Documentação Técnica, Clean Code, Shell Script, Google Cloud
Platform, Microsoft Azure, Terraform, Engenharia de Dados, ETL (Extração,
Transformação e Carga), Business Intelligence, Versionamento Semântico.

**Time Backend (adicionadas pelo seed):**
Python, Java, C#, Go, Ruby, PHP, NestJS, Express.js, Django, Flask, Spring
Boot, GraphQL, APIs REST, gRPC, Redis, MongoDB, RabbitMQ, Kafka,
Microsserviços, ORMs (Prisma/TypeORM).

**Time Frontend (adicionadas pelo seed):**
React, Vue.js, Angular, TypeScript, JavaScript, HTML5, CSS3, Sass, Tailwind
CSS, Next.js, Redux, Cypress, Playwright, Acessibilidade Web (a11y),
Performance Web, Design Responsivo, Vite, Webpack, Storybook, Progressive
Web Apps (PWA).

> Vagas de Full-Stack combinam competências dos times Backend e Frontend
> (não há uma lista separada de hard skills só para Full-Stack).

### Soft skills

**Já existentes na migração inicial:**
Apresentações, Design Thinking, Estratégia, Inovação Aberta, Liderança,
Negociação, Parcerias, Pitch, Relacionamento.

**Adicionadas pelo seed:**
Comunicação Clara, Trabalho em Equipe, Resolução de Problemas, Pensamento
Crítico, Adaptabilidade, Proatividade, Gestão do Tempo, Empatia, Feedback
Construtivo, Mentoria, Colaboração Multidisciplinar, Resiliência,
Organização, Curiosidade Técnica, Autonomia, Foco no Usuário, Escuta Ativa,
Gestão de Conflitos, Aprendizado Contínuo, Ética Profissional, Tomada de
Decisão.

## Totais

| Categoria | Existentes na migração | Novas no seed | Total |
|-----------|------------------------:|---------------:|------:|
| Hard      | 11                      | 59             | 70    |
| Soft      | 9                       | 21             | 30    |
| **Total** | **20**                  | **80**         | **100** |

Os totais acima são conferidos automaticamente pelo `raise notice` no final
de `supabase/seeds/01_skills.sql` e pelo teste pgTAP
`supabase/tests/seeds.test.sql`.

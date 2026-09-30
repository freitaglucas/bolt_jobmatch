-- Seed 01: skills (competências)
--
-- Adiciona competências novas à tabela public.skills, mantendo as 20
-- competências já inseridas pela migração inicial
-- (20260929122000_initial_schema.sql). Nenhuma competência existente é
-- alterada ou removida.
--
-- Idempotência: public.skills.name tem constraint UNIQUE (ver migração),
-- então usamos `on conflict (name) do nothing` em todo insert.
--
-- Proporção final esperada: 70 hard / 30 soft = 100 competências no total
-- (11 hard + 9 soft já existentes + 59 hard + 21 soft novas aqui).
--
-- Categorias usam o enum existente public.skill_category ('hard' | 'soft'),
-- nenhuma categoria nova foi criada.

-- ---------------------------------------------------------------------
-- Hard skills — base comum (Git, testes automatizados, cloud, dados)
-- ---------------------------------------------------------------------
insert into public.skills (name, category, description) values
  ('Testes Automatizados', 'hard', 'Escrever e manter testes que validam o comportamento do sistema automaticamente.'),
  ('Docker', 'hard', 'Empacotar aplicações e suas dependências em containers portáveis.'),
  ('Kubernetes', 'hard', 'Orquestrar, escalar e operar containers em produção.'),
  ('Linux', 'hard', 'Operar e administrar sistemas baseados em Linux no dia a dia de desenvolvimento.'),
  ('Observabilidade e Monitoramento', 'hard', 'Instrumentar sistemas com métricas, logs e alertas para acompanhar a saúde em produção.'),
  ('Segurança da Informação', 'hard', 'Aplicar boas práticas de segurança no desenvolvimento e na operação de sistemas.'),
  ('Arquitetura de Software', 'hard', 'Projetar a estrutura técnica de sistemas considerando escalabilidade e manutenção.'),
  ('Modelagem de Dados', 'hard', 'Desenhar estruturas de dados que representem bem o domínio do negócio.'),
  ('SQL', 'hard', 'Consultar, manipular e otimizar dados em bancos relacionais.'),
  ('Documentação Técnica', 'hard', 'Registrar decisões técnicas e instruções de forma clara para o time.'),
  ('Clean Code', 'hard', 'Escrever código legível, simples de manter e fácil de revisar.'),
  ('Shell Script', 'hard', 'Automatizar tarefas de linha de comando com scripts.'),
  ('Google Cloud Platform', 'hard', 'Provisionar e operar serviços na nuvem do Google.'),
  ('Microsoft Azure', 'hard', 'Provisionar e operar serviços na nuvem da Microsoft.'),
  ('Terraform', 'hard', 'Descrever e versionar infraestrutura como código.'),
  ('Engenharia de Dados', 'hard', 'Construir pipelines que movem e transformam dados entre sistemas.'),
  ('ETL (Extração, Transformação e Carga)', 'hard', 'Extrair dados de origens diversas, transformá-los e carregá-los em destinos de análise.'),
  ('Business Intelligence', 'hard', 'Transformar dados em relatórios e indicadores que apoiam decisões de negócio.'),
  ('Versionamento Semântico', 'hard', 'Nomear versões de software de forma consistente e previsível.')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- Hard skills — time Backend
-- ---------------------------------------------------------------------
insert into public.skills (name, category, description) values
  ('Python', 'hard', 'Desenvolver aplicações e scripts utilizando a linguagem Python.'),
  ('Java', 'hard', 'Desenvolver aplicações utilizando a linguagem Java.'),
  ('C#', 'hard', 'Desenvolver aplicações utilizando a linguagem C#.'),
  ('Go', 'hard', 'Desenvolver aplicações utilizando a linguagem Go.'),
  ('Ruby', 'hard', 'Desenvolver aplicações utilizando a linguagem Ruby.'),
  ('PHP', 'hard', 'Desenvolver aplicações utilizando a linguagem PHP.'),
  ('NestJS', 'hard', 'Construir APIs Node.js estruturadas com o framework NestJS.'),
  ('Express.js', 'hard', 'Construir APIs Node.js com o framework Express.'),
  ('Django', 'hard', 'Construir aplicações web em Python com o framework Django.'),
  ('Flask', 'hard', 'Construir APIs leves em Python com o framework Flask.'),
  ('Spring Boot', 'hard', 'Construir aplicações Java com o framework Spring Boot.'),
  ('GraphQL', 'hard', 'Projetar e consumir APIs usando a linguagem de consulta GraphQL.'),
  ('APIs REST', 'hard', 'Projetar e consumir APIs seguindo os princípios REST.'),
  ('gRPC', 'hard', 'Construir comunicação eficiente entre serviços usando gRPC.'),
  ('Redis', 'hard', 'Usar cache e estruturas de dados em memória com Redis.'),
  ('MongoDB', 'hard', 'Modelar e consultar dados em um banco orientado a documentos.'),
  ('RabbitMQ', 'hard', 'Integrar sistemas de forma assíncrona usando filas de mensagens.'),
  ('Kafka', 'hard', 'Processar fluxos de eventos em larga escala com Kafka.'),
  ('Microsserviços', 'hard', 'Projetar sistemas divididos em serviços independentes e coesos.'),
  ('ORMs (Prisma/TypeORM)', 'hard', 'Mapear objetos para tabelas usando ferramentas de ORM.')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- Hard skills — time Frontend
-- ---------------------------------------------------------------------
insert into public.skills (name, category, description) values
  ('React', 'hard', 'Construir interfaces reativas com a biblioteca React.'),
  ('Vue.js', 'hard', 'Construir interfaces reativas com o framework Vue.js.'),
  ('Angular', 'hard', 'Construir interfaces com o framework Angular.'),
  ('TypeScript', 'hard', 'Escrever código JavaScript com tipagem estática usando TypeScript.'),
  ('JavaScript', 'hard', 'Programar para web utilizando JavaScript.'),
  ('HTML5', 'hard', 'Estruturar páginas e aplicações web com HTML5.'),
  ('CSS3', 'hard', 'Estilizar interfaces web com CSS3.'),
  ('Sass', 'hard', 'Escrever estilos com o pré-processador Sass.'),
  ('Tailwind CSS', 'hard', 'Estilizar interfaces rapidamente usando classes utilitárias do Tailwind CSS.'),
  ('Next.js', 'hard', 'Construir aplicações React com renderização híbrida usando Next.js.'),
  ('Redux', 'hard', 'Gerenciar estado de aplicações front-end com Redux.'),
  ('Cypress', 'hard', 'Escrever testes end-to-end de interface com Cypress.'),
  ('Playwright', 'hard', 'Escrever testes end-to-end de interface com Playwright.'),
  ('Acessibilidade Web (a11y)', 'hard', 'Construir interfaces utilizáveis por pessoas com diferentes necessidades.'),
  ('Performance Web', 'hard', 'Otimizar tempo de carregamento e fluidez de aplicações web.'),
  ('Design Responsivo', 'hard', 'Construir interfaces que se adaptam a diferentes tamanhos de tela.'),
  ('Vite', 'hard', 'Configurar e otimizar o build de aplicações front-end com Vite.'),
  ('Webpack', 'hard', 'Configurar e otimizar o empacotamento de aplicações front-end com Webpack.'),
  ('Storybook', 'hard', 'Documentar e testar componentes de interface de forma isolada com Storybook.'),
  ('Progressive Web Apps (PWA)', 'hard', 'Construir aplicações web com características de aplicativos nativos.')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- Soft skills
-- ---------------------------------------------------------------------
insert into public.skills (name, category, description) values
  ('Comunicação Clara', 'soft', 'Transmitir ideias de forma objetiva e compreensível para diferentes públicos.'),
  ('Trabalho em Equipe', 'soft', 'Colaborar com outras pessoas em prol de um objetivo comum.'),
  ('Resolução de Problemas', 'soft', 'Identificar causas e propor soluções diante de situações complexas.'),
  ('Pensamento Crítico', 'soft', 'Analisar informações e decisões de forma estruturada antes de agir.'),
  ('Adaptabilidade', 'soft', 'Ajustar-se rapidamente a mudanças de contexto, prioridade ou ferramenta.'),
  ('Proatividade', 'soft', 'Antecipar necessidades e agir sem esperar ser acionado(a).'),
  ('Gestão do Tempo', 'soft', 'Organizar prioridades e prazos de forma eficiente.'),
  ('Empatia', 'soft', 'Compreender e considerar a perspectiva de outras pessoas.'),
  ('Feedback Construtivo', 'soft', 'Dar e receber retornos de forma respeitosa e orientada a melhoria.'),
  ('Mentoria', 'soft', 'Apoiar o desenvolvimento técnico e profissional de outras pessoas do time.'),
  ('Colaboração Multidisciplinar', 'soft', 'Trabalhar bem com áreas diferentes, como produto, design e negócio.'),
  ('Resiliência', 'soft', 'Manter-se produtivo(a) e equilibrado(a) diante de pressão e contratempos.'),
  ('Organização', 'soft', 'Manter processos, tarefas e informações estruturados no dia a dia.'),
  ('Curiosidade Técnica', 'soft', 'Buscar aprender continuamente novas tecnologias e abordagens.'),
  ('Autonomia', 'soft', 'Conduzir tarefas e decisões do próprio trabalho sem necessitar supervisão constante.'),
  ('Foco no Usuário', 'soft', 'Priorizar decisões que melhoram a experiência de quem usa o produto.'),
  ('Escuta Ativa', 'soft', 'Ouvir com atenção antes de responder ou propor soluções.'),
  ('Gestão de Conflitos', 'soft', 'Mediar divergências de forma equilibrada e construtiva.'),
  ('Aprendizado Contínuo', 'soft', 'Buscar evoluir constantemente as próprias competências.'),
  ('Ética Profissional', 'soft', 'Agir com integridade e responsabilidade no ambiente de trabalho.'),
  ('Tomada de Decisão', 'soft', 'Avaliar opções e escolher o melhor caminho diante de incertezas.')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- Conferência final: total de skills por categoria
-- ---------------------------------------------------------------------
do $$
declare
  hard_count integer;
  soft_count integer;
  total_count integer;
begin
  select count(*) into hard_count from public.skills where category = 'hard';
  select count(*) into soft_count from public.skills where category = 'soft';
  total_count := hard_count + soft_count;

  raise notice 'Seed de skills aplicado: % hard, % soft, % no total', hard_count, soft_count, total_count;

  if total_count < 80 or total_count > 120 then
    raise warning 'Total de skills (%) fora da faixa esperada (80 a 120).', total_count;
  end if;
end $$;

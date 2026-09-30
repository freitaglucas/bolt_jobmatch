-- Seed 02: recrutador de teste, empresa de teste e 50 vagas
--
-- Cria (de forma idempotente) um recrutador de teste já aprovado, a empresa
-- de teste vinculada a ele, e 50 vagas distribuídas em 3 times (Backend,
-- Frontend, Full-Stack) x 3 níveis de senioridade (Júnior, Pleno, Sênior),
-- cada uma com 3 a 5 competências (job_skills) coerentes com a senioridade.
--
-- Nenhuma coluna ou tabela nova é criada. A senioridade da vaga NÃO existe
-- como coluna em public.jobs (prevista só para o item 2.1 do backlog) —
-- por isso ela aparece apenas no TÍTULO da vaga, nunca em uma coluna.
--
-- IDs fixos e documentados:
--   Recrutador de teste (auth.users.id):        5eed0000-0000-4000-8000-000000000001
--   Empresa de teste (public.companies.id):      5eed0000-0000-4000-8000-0000000000c0
--   Vagas (public.jobs.id):                      5eed0000-0000-4000-8001-<índice em hex, 12 dígitos>
--     (ex.: a primeira vaga é 5eed0000-0000-4000-8001-000000000001, a
--     quinquagésima é 5eed0000-0000-4000-8001-000000000032)
--
-- Idempotência:
--   - auth.users: on conflict (id) do nothing (evita disparar de novo o
--     trigger handle_new_user, que já criou profiles/user_roles/
--     recruiter_profiles na primeira execução).
--   - companies: on conflict (id) do nothing.
--   - recruiter_profiles: approved_at só é preenchido se ainda estiver nulo
--     (coalesce(approved_at, now())), para não sobrescrever a data real de
--     aprovação em execuções futuras.
--   - jobs: on conflict (id) do nothing.
--   - job_skills: on conflict (job_id, skill_id) do nothing (constraint
--     unique já existente na migração inicial).
--
-- Observação sobre audit_logs: as tabelas jobs, companies, recruiter_profiles
-- e job_skills têm triggers de auditoria (write_audit_log). A coluna
-- audit_logs.actor_id é nullable (references auth.users on delete set null)
-- e a função usa auth.uid(), que retorna null fora de um contexto
-- autenticado (como este seed, rodado como superuser/service role). Ou
-- seja, os inserts deste seed geram audit_logs com actor_id = null, o que é
-- aceito pelo schema sem quebrar nada.

do $$
declare
  v_recruiter_id constant uuid := '5eed0000-0000-4000-8000-000000000001';
  v_company_id constant uuid := '5eed0000-0000-4000-8000-0000000000c0';

  -- time | nível | quantidade de vagas (soma = 50, distribuição 5x6 + 4x5)
  v_combos text[] := array[
    'Backend|Júnior|6',
    'Backend|Pleno|6',
    'Backend|Sênior|6',
    'Frontend|Júnior|6',
    'Frontend|Pleno|6',
    'Frontend|Sênior|5',
    'Full-Stack|Júnior|5',
    'Full-Stack|Pleno|5',
    'Full-Stack|Sênior|5'
  ];

  v_cities text[] := array[
    'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR',
    'Porto Alegre, RS', 'Recife, PE', 'Salvador, BA', 'Florianópolis, SC',
    'Fortaleza, CE', 'Brasília, DF', 'Campinas, SP', 'Goiânia, GO',
    'Vitória, ES', 'Natal, RN', 'Belém, PA'
  ];

  v_employment_types public.employment_type[] := array['CLT', 'PJ', 'Híbrido']::public.employment_type[];

  v_desc_templates text[] := array[
    'Buscamos %s para atuar em squad multidisciplinar, com foco em qualidade e entrega contínua. O time trabalha em ciclos ágeis com apoio de colegas experientes.',
    'Vaga para %s participar de projetos desafiadores, colaborando com produto e design desde a concepção até a entrega. Ambiente colaborativo e com autonomia.',
    'Oportunidade para %s integrar um time que valoriza aprendizado contínuo e boas práticas de engenharia, com processo seletivo humanizado e feedback rápido.'
  ];

  v_backend_skills text[] := array[
    'Node.js', 'Python', 'PostgreSQL', 'SQL', 'APIs REST', 'Docker', 'Git',
    'Testes Automatizados', 'Redis', 'GraphQL', 'Microsserviços', 'MongoDB',
    'CI/CD', 'AWS', 'NestJS'
  ];
  v_frontend_skills text[] := array[
    'React', 'TypeScript', 'JavaScript', 'CSS3', 'HTML5', 'Tailwind CSS', 'Git',
    'Testes Automatizados', 'Design Responsivo', 'Next.js', 'Redux', 'Cypress',
    'Acessibilidade Web (a11y)', 'Performance Web', 'Vite'
  ];
  v_fullstack_skills text[] := array[
    'React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'Testes Automatizados',
    'APIs REST', 'Docker', 'PostgreSQL', 'CI/CD', 'Next.js', 'JavaScript',
    'Design Responsivo', 'Redis', 'CSS3'
  ];
  v_soft_pool text[] := array[
    'Comunicação Clara', 'Trabalho em Equipe', 'Proatividade', 'Autonomia',
    'Aprendizado Contínuo', 'Colaboração Multidisciplinar', 'Organização',
    'Adaptabilidade', 'Mentoria', 'Liderança'
  ];

  v_level_ranges jsonb := '{"Júnior": [1,2,3], "Pleno": [2,3,4], "Sênior": [3,4,5]}'::jsonb;
  v_salary_ranges jsonb := '{
    "Júnior": ["R$ 3.500 – R$ 5.000", "R$ 3.800 – R$ 5.200"],
    "Pleno": ["R$ 6.000 – R$ 8.500", "R$ 6.500 – R$ 9.000"],
    "Sênior": ["R$ 10.000 – R$ 14.000", "R$ 11.000 – R$ 15.000"]
  }'::jsonb;
  v_weight_options numeric[] := array[0.5, 0.6, 0.7, 0.85, 1.0];

  v_combo text;
  v_parts text[];
  v_team text;
  v_level text;
  v_qty int;
  v_job_index int := 0;
  v_i int;
  v_k int;
  v_job_id uuid;
  v_title text;
  v_description text;
  v_location text;
  v_salary_opts text[];
  v_salary_range text;
  v_emp_type public.employment_type;
  v_num_skills int;
  v_include_soft boolean;
  v_needed_hard int;
  v_pool text[];
  v_skill_name text;
  v_skill_id uuid;
  v_level_arr int[];
  v_req_level int;
  v_weight numeric;
  v_total_jobs int;
begin
  -- -----------------------------------------------------------------
  -- 1) Recrutador de teste (auth.users) — sem senha utilizável, só para
  --    os dados aparecerem no banco. O trigger handle_new_user cria
  --    profiles/user_roles/recruiter_profiles automaticamente.
  -- -----------------------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, invited_at,
    confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at,
    email_change_token_new, email_change, email_change_sent_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at,
    email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_recruiter_id, 'authenticated', 'authenticated',
    'recrutador.teste@jobmatch.dev', '',
    now(), null,
    '', null,
    '', null,
    '', '', null,
    null, '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"recruiter","full_name":"Recrutador Teste"}'::jsonb,
    false, now(), now(),
    null, null, '', '', null,
    '', 0,
    '', null
  )
  on conflict (id) do nothing;

  -- -----------------------------------------------------------------
  -- 2) Empresa de teste, vinculada ao recrutador de teste
  -- -----------------------------------------------------------------
  insert into public.companies (id, created_by, name)
  values (v_company_id, v_recruiter_id, 'Empresa Teste Job Match')
  on conflict (id) do nothing;

  -- -----------------------------------------------------------------
  -- 3) Aprovação do recrutador de teste (nasce aprovado para poder criar
  --    as 50 vagas no próprio seed). approved_at só é preenchido se ainda
  --    estiver nulo, para não sobrescrever a data real de aprovação numa
  --    reexecução do seed.
  -- -----------------------------------------------------------------
  update public.recruiter_profiles
  set company_id = v_company_id,
      approved_at = coalesce(approved_at, now())
  where user_id = v_recruiter_id;

  -- -----------------------------------------------------------------
  -- 4) 50 vagas, distribuídas em 3 times x 3 níveis de senioridade
  -- -----------------------------------------------------------------
  foreach v_combo in array v_combos loop
    v_parts := string_to_array(v_combo, '|');
    v_team := v_parts[1];
    v_level := v_parts[2];
    v_qty := v_parts[3]::int;

    v_level_arr := array(
      select value::int from jsonb_array_elements_text(v_level_ranges -> v_level) as value
    );

    v_pool := case v_team
      when 'Backend' then v_backend_skills
      when 'Frontend' then v_frontend_skills
      else v_fullstack_skills
    end;

    v_salary_opts := array(
      select value from jsonb_array_elements_text(v_salary_ranges -> v_level) as value
    );

    for v_i in 1..v_qty loop
      v_job_index := v_job_index + 1;
      v_job_id := ('5eed0000-0000-4000-8001-' || lpad(to_hex(v_job_index), 12, '0'))::uuid;

      v_title := 'Desenvolvedor(a) ' || v_team || ' ' || v_level;
      v_description := format(
        v_desc_templates[((v_job_index - 1) % array_length(v_desc_templates, 1)) + 1],
        v_title
      );
      v_location := v_cities[((v_job_index - 1) % array_length(v_cities, 1)) + 1];
      v_salary_range := v_salary_opts[((v_job_index - 1) % array_length(v_salary_opts, 1)) + 1];
      v_emp_type := v_employment_types[((v_job_index - 1) % array_length(v_employment_types, 1)) + 1];

      -- 3, 4 ou 5 job_skills por vaga, ciclando.
      v_num_skills := 3 + ((v_job_index - 1) % 3);
      -- Metade das vagas (índices pares) inclui 1 soft skill entre as
      -- competências, sem sair da faixa de 3 a 5 no total.
      v_include_soft := (v_job_index % 2 = 0);
      v_needed_hard := case when v_include_soft then v_num_skills - 1 else v_num_skills end;

      insert into public.jobs (
        id, recruiter_id, company_id, title, description, location,
        salary_range, employment_type, status
      ) values (
        v_job_id, v_recruiter_id, v_company_id, v_title, v_description, v_location,
        v_salary_range, v_emp_type, 'active'
      )
      on conflict (id) do nothing;

      -- Competências hard: a primeira (k = 1) é sempre obrigatória,
      -- garantindo pelo menos 1 obrigatória e pelo menos 1 opcional por vaga
      -- (v_needed_hard é sempre >= 2).
      for v_k in 1..v_needed_hard loop
        v_skill_name := v_pool[((v_job_index + v_k - 2) % array_length(v_pool, 1)) + 1];
        select id into v_skill_id from public.skills where name = v_skill_name;

        if v_skill_id is not null then
          v_req_level := v_level_arr[((v_k - 1) % array_length(v_level_arr, 1)) + 1];
          v_weight := v_weight_options[((v_k - 1) % array_length(v_weight_options, 1)) + 1];

          insert into public.job_skills (job_id, skill_id, required_level, weight, mandatory)
          values (v_job_id, v_skill_id, v_req_level, v_weight, (v_k = 1))
          on conflict (job_id, skill_id) do nothing;
        end if;
      end loop;

      -- Soft skill opcional (metade das vagas).
      if v_include_soft then
        v_skill_name := v_soft_pool[((v_job_index - 1) % array_length(v_soft_pool, 1)) + 1];
        select id into v_skill_id from public.skills where name = v_skill_name;

        if v_skill_id is not null then
          v_req_level := v_level_arr[(array_length(v_level_arr, 1) / 2) + 1];
          v_weight := v_weight_options[(v_needed_hard % array_length(v_weight_options, 1)) + 1];

          insert into public.job_skills (job_id, skill_id, required_level, weight, mandatory)
          values (v_job_id, v_skill_id, v_req_level, v_weight, false)
          on conflict (job_id, skill_id) do nothing;
        end if;
      end if;
    end loop;
  end loop;

  -- -----------------------------------------------------------------
  -- 5) Conferência final: total de vagas por time e por nível
  -- -----------------------------------------------------------------
  foreach v_combo in array v_combos loop
    v_parts := string_to_array(v_combo, '|');
    v_team := v_parts[1];
    v_level := v_parts[2];

    select count(*) into v_qty
    from public.jobs
    where recruiter_id = v_recruiter_id
      and title = 'Desenvolvedor(a) ' || v_team || ' ' || v_level;

    raise notice 'Vagas % %: %', v_team, v_level, v_qty;
  end loop;

  select count(*) into v_total_jobs from public.jobs where recruiter_id = v_recruiter_id;
  raise notice 'Total de vagas do recrutador de teste: %', v_total_jobs;

  if v_total_jobs <> 50 then
    raise warning 'Total de vagas do recrutador de teste (%) diferente do esperado (50).', v_total_jobs;
  end if;
end $$;

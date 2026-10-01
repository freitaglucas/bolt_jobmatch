-- Sprint 1 · Item 1.5 — LGPD/TCLE no cadastro
--
-- Com a confirmação de e-mail ligada, o cadastro não tem sessão; por isso a
-- RLS bloquearia um INSERT em consents feito pelo cliente. O consentimento é
-- gravado aqui, dentro do trigger security definer que já cria o perfil.
--
-- Preserva TODO o comportamento atual de handle_new_user() (exigência de
-- raw_user_meta_data->>'role', criação de profiles, user_roles e
-- candidate/recruiter_profiles). A única adição: se o metadado tcle_version
-- vier preenchido, registra o aceite em consents.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.app_role;
  requested_name text;
  requested_tcle_version text;
begin
  requested_role := (new.raw_user_meta_data ->> 'role')::public.app_role;
  requested_name := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  requested_tcle_version := nullif(trim(new.raw_user_meta_data ->> 'tcle_version'), '');

  if requested_role is null then
    raise exception 'A valid candidate or recruiter role is required';
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, coalesce(requested_name, ''));

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role);

  if requested_tcle_version is not null then
    insert into public.consents (user_id, consent_type, policy_version, accepted_at)
    values (new.id, 'tcle', requested_tcle_version, now())
    on conflict (user_id, consent_type, policy_version) do nothing;
  end if;

  if requested_role = 'candidate' then
    insert into public.candidate_profiles (user_id) values (new.id);
  else
    insert into public.recruiter_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

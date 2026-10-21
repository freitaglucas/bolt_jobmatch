# send-email (N17, N15a)

Envia e-mail transacional pelo Resend. Templates:

- `test` (N17): e-mail de teste ao proprio recrutador aprovado. Limite de 5 por hora.
- `batch_feedback` (N15a): retorno em lote ao candidato, gratis (sem token). Corpo:

      { "template": "batch_feedback",
        "items": [ { "application_id": "<uuid>", "kind": "decision" | "update",
                     "reason_code": "<um dos 5 motivos ou omitido>",
                     "message": "<texto pronto, 10 a 1500 caracteres (update: ate 1000)>",
                     "new_due_at": "<ISO, so em update, ate 14 dias>" } ] }

  Ate 25 itens por chamada. Resposta: `{ sent, failed, skipped_duplicate, skipped_limit, results }`.
  Para cada item: confere que a candidatura e de vaga do recrutador, registra o
  retorno no app (`feedbacks`; cumpre o prazo; em `update` chama `postpone_feedback`
  com o token do recrutador) e envia como "<Empresa> via Job Match" com Reply-To do
  recrutador. A mesma decisao nao e enviada duas vezes por e-mail na mesma
  candidatura e etapa. Limite proprio: 300 envios por hora por recrutador.

- `stage_update` (N71): aviso automatico de mudanca de etapa ao candidato, gratis e
  sem texto livre. Corpo: `{ "template": "stage_update", "application_id": "<uuid>" }`.
  A funcao confere que a candidatura e de vaga do recrutador e que a etapa atual e
  Triagem, Entrevista ou Final, monta "Voce avancou para a etapa X da vaga Y. Proximo
  retorno ate Z." (Z = prazo de retorno aberto) e envia como "<Empresa> via Job Match"
  com Reply-To do recrutador. Resposta: `{ status, error? }` com status `sent`,
  `failed`, `skipped_duplicate` ou `skipped`. O mesmo aviso nao sai duas vezes na
  mesma candidatura e etapa. Limite proprio: 300 por hora por recrutador. A tela chama
  so depois de mudar a etapa; falha no e-mail nao desfaz a mudanca.

Layout (N74): os e-mails ao candidato (`batch_feedback` e `stage_update`) usam
`_shared/email-layout.ts`: largura maxima de 600px, cabecalho "Job Match" com o nome
da empresa, bloco com a etapa ("Voce chegou a etapa Entrevista") e "Proximo retorno
ate DD/MM", botao "Ver minha candidatura" (abre o app em Candidaturas pelo link
`<APP_URL>/?tela=candidaturas`) e rodape "Voce recebeu este e-mail porque se
candidatou a vaga X na empresa Y". O assunto leva o prazo quando houver. Todo
e-mail tem versao texto equivalente. O remetente e "<Nome>, da <Empresa> via Job
Match" quando o recrutador tem nome no perfil (senao "<Empresa> via Job Match"),
sempre com Reply-To do recrutador. O layout aceita um bloco opcional de citacao
(frase do gestor), que so sera preenchido a partir do N85.

O template de aviso a equipe (6.5) entra depois.

## Segredos (Supabase, Edge Functions > Secrets)
- `RESEND_API_KEY`: chave do Resend (permissao "Sending access").
- `EMAIL_FROM` (opcional): remetente, ex.: `Job Match <avisos@seudominio.com.br>`.
  Sem ela, usa `Job Match <onboarding@resend.dev>`, que so entrega para o e-mail
  da conta do Resend.
- `APP_URL` (opcional, N74): endereco de producao do app, ex.: `https://jobmatchrh.com`
  (https, sem barra no fim). Usada no botao "Ver minha candidatura". Sem ela, ou
  com valor invalido, o e-mail sai sem o botao e nada quebra.

      npx supabase secrets set APP_URL=https://SEU_DOMINIO --project-ref SEU_PROJECT_REF

## Deploy
    npx supabase login
    npx supabase functions deploy send-email --no-verify-jwt --use-api --project-ref SEU_PROJECT_REF

O `--no-verify-jwt` e proposital: a funcao confere o usuario por conta propria
(`auth.getUser`) e so aceita recrutador aprovado. Use sempre a mesma flag ao
publicar de novo.

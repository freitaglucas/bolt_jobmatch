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

Os templates de aviso a equipe (6.5) e de mudanca de etapa (N71) entram depois.

## Segredos (Supabase, Edge Functions > Secrets)
- `RESEND_API_KEY`: chave do Resend (permissao "Sending access").
- `EMAIL_FROM` (opcional): remetente, ex.: `Job Match <avisos@seudominio.com.br>`.
  Sem ela, usa `Job Match <onboarding@resend.dev>`, que so entrega para o e-mail
  da conta do Resend.

## Deploy
    npx supabase login
    npx supabase functions deploy send-email --no-verify-jwt --use-api --project-ref SEU_PROJECT_REF

O `--no-verify-jwt` e proposital: a funcao confere o usuario por conta propria
(`auth.getUser`) e so aceita recrutador aprovado. Use sempre a mesma flag ao
publicar de novo.

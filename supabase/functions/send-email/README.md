# send-email (N17)

Envia e-mail transacional pelo Resend. Hoje so existe o template `test`, enviado
ao proprio recrutador aprovado. Os templates de producao entram no N15 (retorno em
lote ao candidato) e no 6.5 (avisos de SLA a equipe).

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

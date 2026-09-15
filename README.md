# Meta Webhook Hub

Roteador self-hosted de webhooks da Meta. Valida HMAC-SHA256, enfileira no Redis, distribui para destinos ativos e mantém histórico no PostgreSQL.

## Docker

1. Copie `.env.example` para `.env` e defina uma `NUXT_AUTHENTICATION_API_KEY` forte e aleatória.
2. Ajuste `NUXT_PUBLIC_BASE_URL` para a URL pública usada pela Meta.
3. Execute `docker compose up --build`.

Abra `http://localhost:3000` e informe a `NUXT_AUTHENTICATION_API_KEY` para acessar. As migrações são aplicadas automaticamente.

Todas as configurações da aplicação usam o prefixo `NUXT_` e podem ser sobrescritas quando o container inicia: `NUXT_DATABASE_URL`, `NUXT_REDIS_URL`, `NUXT_AUTHENTICATION_API_KEY`, `NUXT_APP_ENCRYPTION_KEY`, `NUXT_DELIVERY_LOG_RETENTION_DAYS`, `NUXT_IGNORE_META_EVENTS_BEFORE` e `NUXT_PUBLIC_BASE_URL`. O Prisma CLI também consome `NUXT_DATABASE_URL` durante as migrações.

Para confirmar retentativas antigas da Meta sem enfileirá-las, defina `NUXT_IGNORE_META_EVENTS_BEFORE` com uma data RFC 3339 que inclua timezone, por exemplo `2026-09-14T14:30:00-04:00`. Deixe a variável vazia para desabilitar o filtro. A variável pode ser removida depois de oito dias, quando a janela máxima de retentativas antigas terminar.

## Chatwoot com WhatsApp Cloud API

O hub preserva o corpo bruto recebido da Meta e encaminha o header `X-Hub-Signature-256`, permitindo que o Chatwoot valide a assinatura com o mesmo App Secret.

1. Cadastre no hub o App Secret da aplicação Meta usada pelo número.
2. Configure na Meta o callback do número para a URL de ingress exibida pelo hub e use o verify token do hub.
3. Cadastre como destino a URL de webhook WhatsApp fornecida pelo Chatwoot, por exemplo `https://chatwoot.exemplo.com/webhooks/whatsapp/%2B5565999999999`.
4. Confirme que o Chatwoot usa o mesmo App Secret da aplicação Meta.

O Embedded Signup do Chatwoot pode criar um override de callback específico para o número apontando diretamente para o Chatwoot. Depois de concluir o cadastro da inbox, substitua esse override pela URL de ingress do hub; caso contrário, os eventos não passarão pelo fanout.

## Desenvolvimento

```bash
docker compose -f docker-compose.dev.yml up -d
cp .env.example .env
npm install
npm run db:deploy
npm run dev
```

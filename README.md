# Meta Webhook Hub

Roteador self-hosted de webhooks da Meta. Valida HMAC-SHA256, enfileira no Redis, distribui para destinos ativos e mantém histórico no PostgreSQL.

## Docker

1. Copie `.env.example` para `.env` e defina uma `NUXT_AUTHENTICATION_API_KEY` forte e aleatória.
2. Ajuste `NUXT_PUBLIC_BASE_URL` para a URL pública usada pela Meta.
3. Execute `docker compose up --build`.

Abra `http://localhost:3000` e informe a `NUXT_AUTHENTICATION_API_KEY` para acessar. As migrações são aplicadas automaticamente.

Todas as configurações da aplicação usam o prefixo `NUXT_` e podem ser sobrescritas quando o container inicia: `NUXT_DATABASE_URL`, `NUXT_REDIS_URL`, `NUXT_AUTHENTICATION_API_KEY`, `NUXT_APP_ENCRYPTION_KEY`, `NUXT_DELIVERY_LOG_RETENTION_DAYS`, `NUXT_IGNORE_META_EVENTS_BEFORE` e `NUXT_PUBLIC_BASE_URL`. O Prisma CLI também consome `NUXT_DATABASE_URL` durante as migrações.

Para confirmar retentativas antigas da Meta sem enfileirá-las, defina `NUXT_IGNORE_META_EVENTS_BEFORE` com uma data RFC 3339 que inclua timezone, por exemplo `2026-09-14T14:30:00-04:00`. Deixe a variável vazia para desabilitar o filtro. A variável pode ser removida depois de oito dias, quando a janela máxima de retentativas antigas terminar.

## Desenvolvimento

```bash
docker compose -f docker-compose.dev.yml up -d
cp .env.example .env
npm install
npm run db:deploy
npm run dev
```

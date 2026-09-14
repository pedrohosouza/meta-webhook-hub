# Meta Webhook Hub

Roteador self-hosted de webhooks da Meta. Valida HMAC-SHA256, enfileira no Redis, distribui para destinos ativos e mantém histórico no PostgreSQL.

## Docker

1. Copie `.env.example` para `.env` e defina uma `NUXT_AUTHENTICATION_API_KEY` forte e aleatória.
2. Ajuste `NUXT_PUBLIC_BASE_URL` para a URL pública usada pela Meta.
3. Execute `docker compose up --build`.

Abra `http://localhost:3000` e informe a `NUXT_AUTHENTICATION_API_KEY` para acessar. As migrações são aplicadas automaticamente.

Todas as configurações da aplicação usam o prefixo `NUXT_` e podem ser sobrescritas quando o container inicia: `NUXT_DATABASE_URL`, `NUXT_REDIS_URL`, `NUXT_AUTHENTICATION_API_KEY`, `NUXT_APP_ENCRYPTION_KEY`, `NUXT_DELIVERY_LOG_RETENTION_DAYS` e `NUXT_PUBLIC_BASE_URL`. O Prisma CLI também consome `NUXT_DATABASE_URL` durante as migrações.

## Desenvolvimento

```bash
docker compose -f docker-compose.dev.yml up -d
cp .env.example .env
npm install
npm run db:deploy
npm run dev
```

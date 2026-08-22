# Meta Webhook Hub

Roteador self-hosted de webhooks da Meta. Valida HMAC-SHA256, enfileira no Redis, distribui para destinos ativos e mantém histórico no PostgreSQL.

## Docker

1. Copie `.env.example` para `.env` e defina uma `AUTHENTICATION_API_KEY` forte e aleatória.
2. Ajuste `NUXT_PUBLIC_BASE_URL` para a URL pública usada pela Meta.
3. Execute `docker compose up --build`.

Abra `http://localhost:3000` e informe a `AUTHENTICATION_API_KEY` para acessar. As migrações são aplicadas automaticamente.

## Desenvolvimento

```bash
docker compose -f docker-compose.dev.yml up -d
cp .env.example .env
npm install
npm run db:deploy
npm run dev
```

# Meta Webhook Hub

Roteador self-hosted de webhooks da Meta. Valida HMAC-SHA256, enfileira no Redis, distribui para destinos ativos e mantém histórico no PostgreSQL.

## Docker

1. Copie `.env.example` para `.env` e defina uma `NUXT_AUTHENTICATION_API_KEY` forte e aleatória.
2. Ajuste `NUXT_PUBLIC_BASE_URL` para a URL pública usada pela Meta.
3. Execute `docker compose up --build`.

Abra `http://localhost:3000` e informe a `NUXT_AUTHENTICATION_API_KEY` para acessar. As migrações são aplicadas automaticamente.

Todas as configurações da aplicação usam o prefixo `NUXT_` e podem ser sobrescritas quando o container inicia: `NUXT_DATABASE_URL`, `NUXT_REDIS_URL`, `NUXT_REDIS_PREFIX`, `NUXT_AUTHENTICATION_API_KEY`, `NUXT_APP_ENCRYPTION_KEY`, `NUXT_DELIVERY_LOG_RETENTION_DAYS`, `NUXT_IGNORE_META_EVENTS_BEFORE` e `NUXT_PUBLIC_BASE_URL`. O Prisma CLI também consome `NUXT_DATABASE_URL` durante as migrações.

Para confirmar retentativas antigas da Meta sem enfileirá-las, defina `NUXT_IGNORE_META_EVENTS_BEFORE` com uma data RFC 3339 que inclua timezone, por exemplo `2026-09-14T14:30:00-04:00`. Deixe a variável vazia para desabilitar o filtro. A variável pode ser removida depois de oito dias, quando a janela máxima de retentativas antigas terminar.

As chaves do BullMQ no Redis usam o prefixo `NUXT_REDIS_PREFIX` (padrão `meta-webhook-hub`), por exemplo `meta-webhook-hub:meta-webhook-deliveries:wait`. Não inclua o `:` final. Ao trocar o prefixo, jobs pendentes sob o prefixo antigo (o padrão anterior do BullMQ era `bull`) deixam de ser processados.

## Regras e destinos

Uma regra reúne condições sobre o payload (por exemplo `entry[*].changes[*].field` igual a `leadgen`), e uma mesma regra pode valer para vários destinos. Cada destino tem no máximo uma regra. Ao criar ou editar uma regra, o editor ouve os webhooks em tempo real: escolha os atributos do payload recebido e marque os destinos. Também dá para criar a regra já ao adicionar um destino. O destino recebe o payload inteiro, com a assinatura original da Meta.

- Destino sem regra, ou com regra sem condições, recebe todos os eventos, como antes das regras existirem.
- Um payload que a regra de um destino não aceita não é entregue a ele; se nenhum destino aceitar, não é entregue a ninguém.
- Dentro da regra as condições combinam por "todas" ou "qualquer uma".
- Excluir uma regra deixa seus destinos sem regra, e eles voltam a receber todos os eventos.

## Desenvolvimento

```bash
docker compose -f docker-compose.dev.yml up -d
cp .env.example .env
npm install
npm run db:deploy
npm run dev
```

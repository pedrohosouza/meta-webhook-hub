# Diretrizes do Repositório

## 1. Contexto do Projeto
Você está desenvolvendo o **Meta Webhook Hub**, uma aplicação *self-hosted* projetada para atuar como roteador (fanout) de webhooks da Meta (WhatsApp, Instagram, Messenger). O objetivo é receber eventos da Meta em uma única rota, enfileirar e distribuir (fazer POST) rapidamente para múltiplos endpoints destinos cadastrados pelo usuário.

## 2. Stack Tecnológica Obrigatória
- **Framework:** Nuxt 4 (Frontend Vue 3 + Backend Nitro)
- **UI:** Nuxt UI (baseado em Tailwind CSS e Headless UI)
- **Banco de Dados:** PostgreSQL 
- **ORM:** Prisma
- **Filas e Jobs:** Redis + BullMQ
- **Autenticação:** Sessões baseadas em cookies (via utilitários do H3/Nitro) + Bcrypt para hash de senha.
- **Infraestrutura:** Docker e Docker Compose (App + Postgres + Redis).

## 3. Regras de Arquitetura e Código
1. **Frontend:**
   - Utilize Composition API com `<script setup>` em todos os componentes e páginas.
   - Use os componentes nativos do Nuxt UI para formulários, botões, modais, e tabelas.
2. **Backend (Nitro Engine):**
   - Todas as rotas da API devem ser criadas dentro de `server/api/`.
   - O worker do BullMQ e as filas devem ser inicializados como plugins do servidor em `server/plugins/`.
3. **Segurança (CRÍTICO):**
   - A rota de recebimento (Ingress) DEVE validar obrigatoriamente a assinatura `x-hub-signature-256` enviada pela Meta utilizando o `app_secret` cadastrado. Utilize o módulo `crypto` nativo do Node.js.
4. **Tratamento Assíncrono:**
   - A rota de Ingress deve apenas validar a requisição, salvar o job no Redis (BullMQ) e retornar HTTP 200 IMEDIATAMENTE (evitando timeouts da Meta). O envio para os endpoints é feito pelo worker em background.
5. **Setup Inicial (First-Run):**
   - Garanta a implementação de um middleware no Nuxt que verifique se existe um usuário criado no banco. Se não existir, libere apenas a rota `/setup` e bloqueie o resto. Após o primeiro cadastro, bloqueie `/setup` e exija `/login`.

## 4. Banco de Dados e Migrations
- Sempre modifique a estrutura através do `prisma/schema.prisma`.
- Sempre versione as migrações.
- Nunca assuma que serviços externos estão rodando no ambiente de dev além dos definidos no `docker-compose.yml`.
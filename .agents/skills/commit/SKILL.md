---
name: commit
description: Use when preparing, reviewing, or suggesting git commit messages or pull request titles, or before creating a commit.
---

# Convenções de commits e títulos de PR

Mensagens de commit e títulos de PR devem seguir o padrão **Conventional Commits**.

Quando uma mudança envolver várias áreas, prefira o tipo que melhor representa a intenção principal da alteração.

## Tipos

- `fix:` Correção de bug.
- `feat:` Nova funcionalidade relevante para o usuário.
- `refactor:` Refatoração sem mudança significativa de comportamento.
- `style:` Alteração visual, de UI ou UX, sem mudança relevante de lógica.
- `docs:` Atualização de documentação.
- `chore:` Tarefas internas, manutenção, configuração ou mudanças que não afetam diretamente o produto.
- `perf:` Melhoria de performance.
- `test:` Adição ou alteração de testes.
- `build:` Alterações no processo de build ou dependências.
- `ci:` Alterações em pipelines ou configuração de CI/CD.

## Antes de criar o commit

Sempre revise o diff e remova logs de debug, arquivos temporários, código comentado de experimentos e outros artefatos temporários antes de criar o commit.

## Depois de abrir uma PR

Nunca faça amend em commits que já fazem parte de uma PR aberta.

Envie correções adicionais como novos commits para preservar o histórico da revisão e os comentários existentes.

## Formato

Use um título curto e direto:

```text
fix: corrige redirecionamento do convite
feat: adiciona filtro por status
refactor: simplifica helpers de schema
style: melhora layout do formulário
docs: atualiza instruções de setup
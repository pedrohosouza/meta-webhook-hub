---
name: ui
description: Use this skill whenever you need to build or modify frontend components. It defines the project's UI best practices for Nuxt and Nuxt UI.
---

- Mantenha simples. Use a menor quantidade possível de classes Tailwind.
- Use componentes do **Nuxt UI** sempre que possível. Não recrie componentes que já existem no Nuxt UI.
- Prefira props, variants, slots e configurações de tema do Nuxt UI antes de adicionar classes customizadas.
- Evite classes customizadas em componentes do Nuxt UI. Use apenas como último recurso para exceções muito locais.
- Prefira Flexbox para layouts. Em vez de `w-full`, use `flex-1` quando a intenção for ocupar o espaço restante.
- Evite elementos HTML genéricos como `div` e `span` quando existir um elemento semântico adequado. Prefira `main`, `section`, `article`, `header`, `nav`, `footer`, `form`, `ul`, `li`, etc.
- Para elementos interativos, prefira componentes do Nuxt UI como `UButton`, `UInput`, `USelect`, `UForm`, `UModal` e `UDropdownMenu`.
- Para navegação, prefira componentes do Nuxt UI com `to`, `ULink` ou `NuxtLink`.
- Use `<script setup lang="ts">`.
- Prefira `computed` para valores derivados. Não use `watch` ou `watchEffect` quando o valor puder ser derivado.
- Use `watch` apenas para efeitos colaterais reais, como sincronização com storage, APIs do DOM ou bibliotecas externas.
- Prefira `useFetch` e `useAsyncData` para data fetching em vez de buscar dados manualmente em `onMounted`.
- Considere SSR por padrão. Não acesse `window`, `document` ou `localStorage` sem um contexto client-safe.
- Use `cn()` ao aplicar classes Tailwind condicionais que possam entrar em conflito.
- Nunca adicione tipos explícitos em parâmetros de callbacks quando o TypeScript conseguir inferi-los.
- Mantenha expressões do template simples. Mova lógica complexa para `computed` ou funções nomeadas.
- Sempre use chaves estáveis em `v-for`. Não use o índice do array quando houver um identificador estável.
- Não duplique estado que possa ser derivado de props, rota, stores ou outro estado existente.
- Prefira slots em vez de adicionar muitas props apenas para controlar markup.
- Não crie wrappers para componentes do Nuxt UI sem adicionar comportamento de domínio, composição reutilizável ou lógica relevante.
- Em componentes Vue, organize as declarações nesta ordem:
  1. Hooks de contexto e composables (`useRoute`, `useNuxtApp`, stores, etc.)
  2. Props, emits, models e slots
  3. `ref` / `reactive`
  4. `useFetch` / `useAsyncData` / queries
  5. Mutations / actions
  6. Handlers
  7. `computed`
  8. `watch` / `watchEffect`
  9. Lifecycle hooks
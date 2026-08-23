<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const isNotFound = computed(() => props.error.statusCode === 404)
const statusCode = computed(() => props.error.statusCode || 500)
const eyebrow = computed(() => isNotFound.value ? 'Rota não encontrada' : 'Falha inesperada')
const title = computed(() => isNotFound.value ? 'Este destino não existe.' : 'O hub encontrou um problema.')
const description = computed(() => isNotFound.value
  ? 'O endereço pode ter mudado, sido removido ou nunca ter feito parte deste console.'
  : 'Não foi possível concluir esta solicitação. Volte ao console e tente novamente.')

useHead({
  title: computed(() => `${statusCode.value} — Meta Webhook Hub`)
})

async function returnToConsole() {
  await clearError({ redirect: '/' })
}
</script>

<template>
  <UApp>
    <main class="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-default px-5 py-10 sm:px-8">
      <section class="surface-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <section class="relative w-full max-w-3xl">
        <header class="mb-12 flex items-center justify-between gap-4">
          <NuxtLink to="/" class="flex items-center gap-3">
            <span class="flex size-10 items-center justify-center rounded-xl bg-inverted text-inverted shadow-sm">
              <AppLogoMark class="size-6" />
            </span>
            <span class="leading-tight">
              <strong class="block text-sm font-bold tracking-tight">Meta Webhook Hub</strong>
              <small class="font-mono text-[10px] tracking-wider text-muted">CONSOLE OPERACIONAL</small>
            </span>
          </NuxtLink>
          <UColorModeButton color="neutral" variant="ghost" aria-label="Alternar tema" />
        </header>

        <section class="panel-shell">
          <article class="panel-core relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
            <span class="absolute right-5 top-3 select-none font-mono text-[7rem] font-semibold leading-none tracking-[-0.09em] text-muted/10 sm:right-9 sm:text-[10rem]" aria-hidden="true">
              {{ statusCode }}
            </span>

            <section class="relative max-w-xl">
              <span class="mb-8 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <UIcon :name="isNotFound ? 'i-lucide-route-off' : 'i-lucide-triangle-alert'" class="size-6" />
              </span>

              <p class="eyebrow mb-3">Erro {{ statusCode }} · {{ eyebrow }}</p>
              <h1 class="page-heading max-w-lg">{{ title }}</h1>
              <p class="mt-4 max-w-lg text-sm leading-relaxed text-muted sm:text-base">{{ description }}</p>

              <nav class="mt-8 flex flex-col gap-3 sm:flex-row" aria-label="Ações da página de erro">
                <UButton label="Voltar à visão geral" icon="i-lucide-arrow-left" size="lg" @click="returnToConsole" />
                <UButton v-if="isNotFound" to="/logs" label="Ver entregas" icon="i-lucide-list-checks" color="neutral" variant="soft" size="lg" />
                <UButton v-else label="Tentar novamente" icon="i-lucide-refresh-cw" color="neutral" variant="soft" size="lg" @click="returnToConsole" />
              </nav>
            </section>
          </article>
        </section>

        <footer class="mt-5 flex items-center gap-2 px-1 font-mono text-[10px] tracking-wider text-muted">
          <span class="size-2 rounded-full bg-success ring-4 ring-success/10" />
          HUB ONLINE · O EVENTO NÃO FOI AFETADO
        </footer>
      </section>
    </main>
  </UApp>
</template>

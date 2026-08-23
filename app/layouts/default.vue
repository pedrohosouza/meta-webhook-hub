<script setup lang="ts">
const route = useRoute()
const toast = useToast()

const links = computed(() => [
  { label: 'Visão geral', description: 'Métricas e apps', icon: 'i-lucide-chart-no-axes-combined', to: '/', active: route.path === '/' || route.path.startsWith('/apps/') },
  { label: 'Entregas', description: 'Histórico e respostas', icon: 'i-lucide-list-checks', to: '/logs', active: route.path.startsWith('/logs') }
])

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  toast.add({ title: 'Sessão encerrada' })
  await navigateTo('/login')
}
</script>

<template>
  <section class="min-h-[100dvh] bg-muted/30 lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
    <aside class="sticky top-0 hidden h-[100dvh] flex-col bg-default shadow-[inset_-1px_0_var(--ui-border)] lg:flex">
      <header class="flex h-20 items-center px-6">
        <NuxtLink to="/" class="flex items-center gap-3">
          <span class="flex size-9 items-center justify-center rounded-lg bg-inverted text-inverted shadow-sm">
            <AppLogoMark class="size-6" />
          </span>
          <span class="leading-tight">
            <strong class="block text-sm font-bold tracking-tight">Meta Webhook Hub</strong>
            <small class="font-mono text-[10px] tracking-wider text-muted">CONSOLE OPERACIONAL</small>
          </span>
        </NuxtLink>
      </header>

      <nav class="flex flex-1 flex-col gap-1.5 px-4 py-5" aria-label="Principal">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :class="[
            'group flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 transition-[color,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]',
            link.active ? 'bg-elevated text-highlighted shadow-sm ring-1 ring-default' : 'text-muted hover:bg-elevated/70 hover:text-default'
          ]"
        >
          <UIcon :name="link.icon" class="size-5 shrink-0" />
          <span class="min-w-0">
            <strong class="block text-sm font-semibold">{{ link.label }}</strong>
            <small class="block truncate text-xs text-muted">{{ link.description }}</small>
          </span>
        </NuxtLink>
      </nav>

      <footer class="border-t border-default p-4">
        <section class="mb-2 flex items-center gap-3 rounded-xl bg-elevated/70 px-3 py-3 ring-1 ring-default">
          <span class="relative flex size-8 items-center justify-center rounded-lg bg-accented text-muted">
            <UIcon name="i-lucide-radio-tower" class="size-4" />
            <span class="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-success ring-2 ring-default" aria-label="Hub online" />
          </span>
          <span>
            <strong class="block text-xs font-semibold">Hub operacional</strong>
            <small class="font-mono text-[10px] text-success">ONLINE</small>
          </span>
          <UColorModeButton size="xs" color="neutral" variant="ghost" class="ml-auto" />
        </section>
        <UButton label="Encerrar sessão" icon="i-lucide-log-out" color="neutral" variant="ghost" block class="justify-start" @click="logout" />
      </footer>
    </aside>

    <section class="min-w-0">
      <header class="sticky top-0 z-20 flex min-h-16 items-center border-b border-default bg-default/90 px-4 backdrop-blur lg:hidden">
        <NuxtLink to="/" class="flex flex-1 items-center gap-2 font-bold tracking-tight">
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary text-inverted"><AppLogoMark class="size-5" /></span>
          Meta Webhook
        </NuxtLink>
        <nav class="flex gap-1" aria-label="Principal">
          <UButton v-for="link in links" :key="link.to" :to="link.to" :icon="link.icon" :label="link.label" :variant="link.active ? 'soft' : 'ghost'" color="neutral" size="sm" />
        </nav>
        <UColorModeButton color="neutral" variant="ghost" aria-label="Alternar tema" />
      </header>

      <main id="main-content" class="px-4 py-7 sm:px-6 lg:px-10 lg:py-10 xl:px-14">
        <section class="mx-auto max-w-[1320px]"><slot /></section>
      </main>
    </section>
  </section>
</template>

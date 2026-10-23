<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const collapsed = useCookie<boolean>('sidebar-collapsed', { default: () => false })

const links = computed(() => [
  { label: 'Visão geral', icon: 'i-lucide-chart-no-axes-combined', to: '/', active: route.path === '/' },
  { label: 'Aplicativos', icon: 'i-lucide-webhook', to: '/apps', active: route.path.startsWith('/apps') },
  { label: 'Entregas', icon: 'i-lucide-list-checks', to: '/logs', active: route.path.startsWith('/logs') }
])

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  toast.add({ title: 'Sessão encerrada' })
  await navigateTo('/login')
}
</script>

<template>
  <section :class="['min-h-[100dvh] bg-muted/30 lg:grid lg:transition-[grid-template-columns] lg:duration-200 lg:ease-[cubic-bezier(0.32,0.72,0,1)]', collapsed ? 'lg:grid-cols-[76px_minmax(0,1fr)]' : 'lg:grid-cols-[272px_minmax(0,1fr)]']">
    <aside class="sticky top-0 hidden h-[100dvh] flex-col bg-default shadow-[inset_-1px_0_var(--ui-border)] lg:flex">
      <header :class="['flex items-center', collapsed ? 'flex-col justify-center gap-2 py-4' : 'h-20 justify-between gap-2 px-6']">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-3">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-inverted text-inverted shadow-sm">
            <AppLogoMark class="size-6" />
          </span>
          <span v-if="!collapsed" class="leading-tight">
            <strong class="block truncate text-sm font-bold tracking-tight">Meta Webhook Hub</strong>
          </span>
        </NuxtLink>
        <UTooltip :text="collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'" :content="{ side: 'right' }">
          <UButton
            :icon="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
            size="sm"
            color="neutral"
            variant="ghost"
            :aria-label="collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'"
            :aria-expanded="!collapsed"
            @click="collapsed = !collapsed"
          />
        </UTooltip>
      </header>

      <nav :class="['flex flex-1 flex-col gap-1.5 py-5', collapsed ? 'px-3' : 'px-4']" aria-label="Principal">
        <UTooltip v-for="link in links" :key="link.to" :text="link.label" :disabled="!collapsed" :content="{ side: 'right' }">
          <NuxtLink
            :to="link.to"
            :aria-label="link.label"
            :class="[
              'group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 transition-[color,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]',
              collapsed ? 'justify-center' : '',
              link.active ? 'bg-elevated text-highlighted shadow-sm ring-1 ring-default' : 'text-muted hover:bg-elevated/70 hover:text-default'
            ]"
          >
            <UIcon :name="link.icon" class="size-5 shrink-0" />
            <strong v-if="!collapsed" class="block truncate text-sm font-semibold">{{ link.label }}</strong>
          </NuxtLink>
        </UTooltip>
      </nav>

      <footer :class="['flex flex-col gap-2 border-t border-default', collapsed ? 'items-center p-3' : 'p-4']">
        <section v-if="!collapsed" class="flex items-center gap-3 rounded-xl bg-elevated/70 px-3 py-3 ring-1 ring-default">
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
        <UColorModeButton v-else size="sm" color="neutral" variant="ghost" />
        <UButton v-if="!collapsed" label="Encerrar sessão" icon="i-lucide-log-out" color="neutral" variant="ghost" block class="justify-start" @click="logout" />
        <UTooltip v-else text="Encerrar sessão" :content="{ side: 'right' }"><UButton icon="i-lucide-log-out" color="neutral" variant="ghost" aria-label="Encerrar sessão" @click="logout" /></UTooltip>
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

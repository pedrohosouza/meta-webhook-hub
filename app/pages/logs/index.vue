<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const allAppsValue = '__all__'
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const appId = computed(() => typeof route.query.appId === 'string' ? route.query.appId : '')
const selectedApp = computed(() => appId.value || allAppsValue)
const { data: apps } = await useFetch('/api/apps')
const { data: logs, status, error } = await useFetch('/api/logs', { query: { page, appId } })
const appOptions = computed(() => [{ label: 'Todos os apps', value: allAppsValue }, ...(apps.value || []).map(app => ({ label: app.name, value: app.id }))])

function setFilter(value: string) {
  router.push({ query: { ...(value !== allAppsValue ? { appId: value } : {}), page: 1 } })
}

function statusColor(code: number | null) {
  if (code && code >= 200 && code < 300) return 'success'
  if (code) return 'error'
  return 'warning'
}

function statusLabel(code: number | null) {
  if (!code) return 'Falha de conexão'
  if (code >= 200 && code < 300) return `${code} Entregue`
  return `${code} Recusado`
}
</script>

<template>
  <section class="flex flex-col gap-8">
    <header class="flex flex-col gap-5 border-b border-default pb-8 sm:flex-row sm:items-end sm:justify-between">
      <section>
        <p class="mb-2 font-mono text-[11px] font-medium text-primary">DELIVERY OBSERVABILITY</p>
        <h1 class="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Entregas</h1>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted">Inspecione cada tentativa de fanout, o tempo de execução e a resposta do destino.</p>
      </section>
      <UFormField label="App">
        <USelect :model-value="selectedApp" :items="appOptions" icon="i-lucide-list-filter" size="lg" class="min-w-60" @update:model-value="setFilter" />
      </UFormField>
    </header>

    <section class="flex items-center justify-between rounded-xl border border-default bg-default px-5 py-4">
      <section class="flex items-center gap-3">
        <span class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><UIcon name="i-lucide-activity" class="size-4" /></span>
        <span><strong class="block font-mono text-lg leading-none">{{ logs?.total || 0 }}</strong><small class="text-xs text-muted">registros encontrados</small></span>
      </section>
      <span class="hidden font-mono text-[10px] text-muted sm:block">PAGE {{ logs?.page || page }} / {{ logs?.pages || 1 }}</span>
    </section>

    <section class="overflow-hidden rounded-xl border border-default bg-default shadow-sm shadow-neutral-950/5">
      <section v-if="status === 'pending'" class="p-5 sm:p-6">
        <section v-for="item in 6" :key="item" class="flex items-center gap-5 border-b border-default py-4 last:border-b-0"><USkeleton class="h-4 w-32" /><USkeleton class="h-4 flex-1" /><USkeleton class="h-6 w-24" /></section>
      </section>
      <UAlert v-else-if="error" title="Não foi possível carregar as entregas" :description="error.statusMessage" icon="i-lucide-triangle-alert" color="error" variant="subtle" class="m-5" />
      <section v-else-if="logs?.items.length" class="overflow-x-auto">
        <table class="w-full min-w-[820px] text-left text-sm">
          <thead class="border-b border-default bg-elevated/50 text-[11px] font-semibold text-muted">
            <tr><th class="px-5 py-3.5 sm:px-6">App</th><th class="px-5 py-3.5">Destino</th><th class="px-5 py-3.5">Resultado</th><th class="px-5 py-3.5 text-right">Tempo</th><th class="px-5 py-3.5 text-right sm:px-6">Recebido em</th></tr>
          </thead>
          <tbody>
            <tr v-for="log in logs.items" :key="log.id" class="border-b border-default transition-colors last:border-b-0 hover:bg-elevated/40">
              <td class="px-5 py-4 sm:px-6"><NuxtLink :to="`/logs/${log.id}`" class="font-semibold text-highlighted hover:text-primary">{{ log.app.name }}</NuxtLink></td>
              <td class="max-w-80 truncate px-5 py-4 font-mono text-xs text-muted">{{ log.endpoint.url }}</td>
              <td class="px-5 py-4"><UBadge :color="statusColor(log.statusCode)" variant="subtle">{{ statusLabel(log.statusCode) }}</UBadge></td>
              <td class="px-5 py-4 text-right font-mono text-xs">{{ log.executionTimeMs }} ms</td>
              <td class="whitespace-nowrap px-5 py-4 text-right font-mono text-xs text-muted sm:px-6">{{ new Date(log.createdAt).toLocaleString('pt-BR') }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section v-else class="relative px-6 py-16 text-center">
        <div class="surface-grid absolute inset-0 opacity-30" />
        <section class="relative mx-auto max-w-sm">
          <span class="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-elevated text-muted"><UIcon name="i-lucide-inbox" class="size-6" /></span>
          <h2 class="font-semibold tracking-tight">Nenhuma entrega registrada</h2>
          <p class="mt-2 text-sm leading-relaxed text-muted">Os resultados aparecerão aqui depois que um app receber seu primeiro evento.</p>
        </section>
      </section>
    </section>
    <footer v-if="logs && logs.pages > 1" class="flex justify-center">
      <UPagination :page="page" :total="logs.total" :items-per-page="logs.pageSize" @update:page="router.push({ query: { ...route.query, page: $event } })" />
    </footer>
  </section>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const route = useRoute()
const router = useRouter()
const allValue = '__all__'
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const pageSize = computed(() => Math.min(100, Math.max(10, Number(route.query.pageSize) || 25)))
const appId = computed(() => typeof route.query.appId === 'string' ? route.query.appId : '')
const result = computed(() => typeof route.query.status === 'string' ? route.query.status : '')
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const attempt = computed(() => Math.max(0, Number(route.query.attempt) || 0))
const selectedApp = computed(() => appId.value || allValue)
const selectedResult = computed(() => result.value || allValue)
const { data: apps } = await useFetch('/api/apps', { query: { pageSize: 100 } })
const { data: logs, status, error } = await useFetch('/api/logs', {
  query: { page, pageSize, appId, status: result, search: computed(() => route.query.search || ''), attempt }
})
const appOptions = computed(() => [{ label: 'Todos os apps', value: allValue }, ...(apps.value?.items || []).map(app => ({ label: app.name, value: app.id }))])
const resultOptions = [
  { label: 'Todos os resultados', value: allValue }, { label: 'Entregues', value: 'success' },
  { label: 'Erro HTTP', value: 'http_error' }, { label: 'Sem conexão', value: 'connection_error' }
]
const pageSizeOptions = [{ label: '25 por página', value: 25 }, { label: '50 por página', value: 50 }, { label: '100 por página', value: 100 }]
const attemptOptions = [{ label: 'Todas as tentativas', value: 0 }, ...Array.from({ length: 5 }, (_, index) => ({ label: `Tentativa ${index + 1}`, value: index + 1 }))]
type DeliveryRow = NonNullable<typeof logs.value>['items'][number]
const columns: TableColumn<DeliveryRow>[] = [
  { accessorKey: 'createdAt', header: 'Horário' }, { id: 'result', header: 'Resultado' },
  { id: 'route', header: 'Rota de entrega' }, { accessorKey: 'attemptCount', header: 'Tentativa' }, { accessorKey: 'executionTimeMs', header: 'Latência' }, { id: 'actions', header: '' }
]

function updateQuery(values: Record<string, string | number | undefined>) {
  router.push({ query: { ...route.query, ...values, page: 1 } })
}
function setApp(value: string) { updateQuery({ appId: value === allValue ? undefined : value }) }
function setResult(value: string) { updateQuery({ status: value === allValue ? undefined : value }) }
function submitSearch() { updateQuery({ search: search.value.trim() || undefined }) }
function clearFilters() { search.value = ''; router.push({ query: {} }) }
function statusColor(code: number | null) {
  if (code && code >= 200 && code < 300) return 'success'
  if (code) return 'error'
  return 'warning'
}
function statusLabel(code: number | null) {
  if (!code) return 'Sem conexão'
  if (code >= 200 && code < 300) return `${code} Entregue`
  return `${code} Erro HTTP`
}
function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 border-b border-default pb-6 sm:flex-row sm:items-end sm:justify-between">
      <section>
        <p class="eyebrow mb-3">Observabilidade</p>
        <h1 class="page-heading">Entregas</h1>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Histórico operacional dos eventos reais distribuídos pelo hub. Chamadas de teste não aparecem aqui.</p>
      </section>
      <section class="flex items-center gap-3 text-sm text-muted" aria-live="polite">
        <span class="size-2 rounded-full bg-success" aria-hidden="true" />
        <strong class="font-mono text-lg text-highlighted">{{ (logs?.total || 0).toLocaleString('pt-BR') }}</strong><span>entregas</span>
      </section>
    </header>

    <section class="panel-shell">
      <section class="panel-core">
        <header class="flex flex-col gap-3 border-b border-default bg-elevated/30 p-4 lg:flex-row lg:items-end">
          <form class="flex flex-1 flex-col gap-3 sm:flex-row" role="search" @submit.prevent="submitSearch">
            <UFormField label="Buscar destino" class="flex-1"><UInput v-model="search" icon="i-lucide-search" placeholder="URL ou domínio" class="w-full" /></UFormField>
            <UButton type="submit" label="Buscar" color="neutral" variant="soft" class="self-end" />
          </form>
          <section class="grid gap-3 sm:grid-cols-3 lg:flex">
            <UFormField label="App"><USelect :model-value="selectedApp" :items="appOptions" class="min-w-48" @update:model-value="setApp" /></UFormField>
            <UFormField label="Resultado"><USelect :model-value="selectedResult" :items="resultOptions" class="min-w-48" @update:model-value="setResult" /></UFormField>
            <UFormField label="Tentativa"><USelect :model-value="attempt" :items="attemptOptions" class="min-w-44" @update:model-value="updateQuery({ attempt: $event || undefined })" /></UFormField>
          </section>
          <UButton v-if="appId || result || route.query.search || attempt" label="Limpar" icon="i-lucide-x" color="neutral" variant="ghost" class="self-end" @click="clearFilters" />
        </header>

        <UAlert v-if="error" title="Não foi possível carregar as entregas" :description="error.statusMessage" icon="i-lucide-triangle-alert" color="error" variant="subtle" class="m-4" />
        <section v-else class="overflow-x-auto" tabindex="0" aria-label="Tabela de entregas">
          <UTable :data="logs?.items || []" :columns="columns" :loading="status === 'pending'" class="min-w-[860px]">
            <template #createdAt-cell="{ row }"><time :datetime="String(row.original.createdAt)" class="whitespace-nowrap font-mono text-xs text-muted">{{ formatDate(row.original.createdAt) }}</time></template>
            <template #result-cell="{ row }">
              <UBadge :color="statusColor(row.original.statusCode)" variant="subtle"><UIcon :name="row.original.statusCode && row.original.statusCode >= 200 && row.original.statusCode < 300 ? 'i-lucide-check' : 'i-lucide-triangle-alert'" class="size-3.5" aria-hidden="true" />{{ statusLabel(row.original.statusCode) }}</UBadge>
            </template>
            <template #route-cell="{ row }"><section class="max-w-md"><p class="truncate text-sm font-semibold text-highlighted">{{ row.original.app.name }}</p><p class="truncate font-mono text-xs text-muted" :title="row.original.endpoint.url">{{ row.original.endpoint.url }}</p></section></template>
            <template #attemptCount-cell="{ row }"><UBadge color="neutral" variant="outline">{{ row.original.attemptCount }} / 5</UBadge></template>
            <template #executionTimeMs-cell="{ row }"><span class="whitespace-nowrap font-mono text-xs" :class="row.original.executionTimeMs > 3000 ? 'text-warning' : 'text-muted'">{{ row.original.executionTimeMs.toLocaleString('pt-BR') }} ms</span></template>
            <template #actions-cell="{ row }"><UButton :to="`/logs/${row.original.id}`" label="Inspecionar" trailing-icon="i-lucide-arrow-right" color="neutral" variant="ghost" size="sm" /></template>
            <template #empty><section class="flex flex-col items-center px-6 py-16 text-center"><UIcon name="i-lucide-inbox" class="mb-4 size-8 text-dimmed" aria-hidden="true" /><h2 class="font-semibold">Nenhuma entrega encontrada</h2><p class="mt-1 max-w-sm text-sm text-muted">Ajuste os filtros ou aguarde a chegada de um evento real.</p></section></template>
          </UTable>
        </section>

        <footer v-if="logs" class="flex flex-col gap-3 border-t border-default p-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-muted">Página {{ logs.page }} de {{ logs.pages }} · até {{ logs.pageSize }} registros por vez</p>
          <section class="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <USelect :model-value="pageSize" :items="pageSizeOptions" @update:model-value="updateQuery({ pageSize: $event })" />
            <UPagination :page="page" :total="logs.total" :items-per-page="logs.pageSize" @update:page="router.push({ query: { ...route.query, page: $event } })" />
          </section>
        </footer>
      </section>
    </section>
  </section>
</template>

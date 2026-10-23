<script setup lang="ts">
const { data: totals, refresh: refreshTotals } = await useFetch('/api/apps', { query: { pageSize: 1 } })
const { data: metrics, error: metricsError, refresh: refreshMetrics } = await useFetch('/api/metrics')
const { live } = useLiveRefresh(() => Promise.all([refreshMetrics(), refreshTotals()]))
const maxVolume = computed(() => Math.max(1, ...(metrics.value?.daily.map(item => item.total) || [])))
const maxLatency = computed(() => Math.max(1, ...(metrics.value?.daily.map(item => item.averageLatencyMs) || [])))
const successAngle = computed(() => `${metrics.value?.summary.successRate || 0}%`)
function formatDay(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(value)).replace('.', '')
}
</script>

<template>
  <section class="flex flex-col gap-8">
    <header class="flex items-center justify-between gap-4 border-b border-default pb-6">
      <h1 class="page-heading">Visão geral</h1>
      <span class="flex items-center gap-2 text-xs text-muted" role="status">
        <span :class="['size-2 rounded-full', live ? 'bg-success' : 'bg-warning']" aria-hidden="true" />
        {{ live ? 'Ao vivo' : 'Reconectando' }}
      </span>
    </header>

    <section class="panel-core grid sm:grid-cols-3" aria-label="Resumo da operação">
      <article class="border-b border-default p-5 sm:border-b-0 sm:border-r">
        <p class="text-xs font-medium text-muted">Apps configurados</p>
        <p class="mt-2 font-mono text-2xl font-semibold tracking-tight">{{ totals?.total || 0 }}</p>
      </article>
      <article class="border-b border-default p-5 sm:border-b-0 sm:border-r">
        <p class="text-xs font-medium text-muted">Destinos configurados</p>
        <p class="mt-2 font-mono text-2xl font-semibold tracking-tight">{{ totals?.totalEndpoints || 0 }}</p>
      </article>
      <article class="p-5">
        <p class="text-xs font-medium text-muted">Entregas registradas</p>
        <p class="mt-2 font-mono text-2xl font-semibold tracking-tight">{{ (totals?.totalDeliveries || 0).toLocaleString('pt-BR') }}</p>
      </article>
    </section>

    <section aria-label="Métricas de entrega" class="flex flex-col gap-4">
      <UAlert v-if="!metrics && metricsError" title="Não foi possível carregar as métricas" :description="metricsError.statusMessage" icon="i-lucide-triangle-alert" color="error" variant="subtle" />
      <section v-else-if="!metrics" class="grid gap-4 lg:grid-cols-3" aria-label="Carregando métricas">
        <USkeleton v-for="item in 3" :key="item" class="h-64 rounded-xl" />
      </section>
      <section v-else-if="metrics" class="grid gap-4 lg:grid-cols-12">
        <article class="panel-core flex min-h-64 flex-col p-5 lg:col-span-5">
          <header class="flex items-start justify-between gap-4">
            <section><p class="text-xs font-medium text-muted">Volume processado</p><p class="mt-1 font-mono text-3xl font-semibold tracking-tight">{{ metrics.summary.total.toLocaleString('pt-BR') }}</p></section>
            <UBadge color="neutral" variant="subtle">7 dias</UBadge>
          </header>
          <ul class="mt-auto flex h-32 items-end gap-2" aria-label="Volume diário de entregas">
            <li v-for="item in metrics.daily" :key="item.date" class="flex flex-1 flex-col items-center justify-end gap-2">
              <span class="font-mono text-[10px] text-muted">{{ item.total }}</span>
              <span class="w-full min-w-3 rounded-sm bg-primary/80 transition-[height]" :style="{ height: `${Math.max(3, item.total / maxVolume * 88)}px` }" :title="`${item.total} entregas`" />
              <span class="font-mono text-[10px] uppercase text-muted">{{ formatDay(item.date) }}</span>
            </li>
          </ul>
        </article>

        <article class="panel-core flex min-h-64 flex-col p-5 lg:col-span-3">
          <p class="text-xs font-medium text-muted">Taxa de sucesso</p>
          <section class="my-auto flex items-center justify-center">
            <span class="metric-ring flex size-32 items-center justify-center rounded-full" :style="{ '--success-rate': successAngle }" role="img" :aria-label="`${metrics.summary.successRate}% de sucesso`">
              <span class="flex size-24 flex-col items-center justify-center rounded-full bg-default"><strong class="font-mono text-2xl">{{ metrics.summary.successRate }}%</strong><small class="text-[10px] text-muted">HTTP 2xx</small></span>
            </span>
          </section>
          <footer class="flex justify-between gap-4 text-xs">
            <span class="text-muted"><i class="mr-2 inline-block size-2 rounded-sm bg-primary" />{{ metrics.summary.success }} entregues</span>
            <span class="text-muted"><i class="mr-2 inline-block size-2 rounded-sm bg-error" />{{ metrics.summary.failed }} falhas</span>
          </footer>
        </article>

        <article class="panel-core flex min-h-64 flex-col p-5 lg:col-span-4">
          <header><p class="text-xs font-medium text-muted">Latência média</p><p class="mt-1 font-mono text-3xl font-semibold tracking-tight">{{ metrics.summary.averageLatencyMs.toLocaleString('pt-BR') }} <small class="text-sm font-normal text-muted">ms</small></p></header>
          <ul class="mt-auto flex h-28 items-end gap-2" aria-label="Latência média diária">
            <li v-for="item in metrics.daily" :key="item.date" class="flex flex-1 flex-col items-center justify-end gap-2">
              <span class="w-full min-w-3 rounded-sm bg-muted transition-[height]" :style="{ height: `${Math.max(3, item.averageLatencyMs / maxLatency * 70)}px` }" :title="`${item.averageLatencyMs} ms`" />
              <span class="font-mono text-[10px] uppercase text-muted">{{ formatDay(item.date) }}</span>
            </li>
          </ul>
        </article>
      </section>
    </section>
  </section>
</template>

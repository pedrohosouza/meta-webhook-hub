<script setup lang="ts">
const toast = useToast()
const open = ref(false)
const saving = ref(false)
const form = reactive({ name: '', appSecret: '' })
const { data: apps, status, error } = await useFetch('/api/apps')
const { data: metrics, status: metricsStatus, error: metricsError, refresh: refreshMetrics } = await useFetch('/api/metrics')
const totalEndpoints = computed(() => apps.value?.reduce((total, app) => total + app._count.endpoints, 0) || 0)
const totalDeliveries = computed(() => apps.value?.reduce((total, app) => total + app._count.deliveries, 0) || 0)
const maxVolume = computed(() => Math.max(1, ...(metrics.value?.daily.map(item => item.total) || [])))
const maxLatency = computed(() => Math.max(1, ...(metrics.value?.daily.map(item => item.averageLatencyMs) || [])))
const successAngle = computed(() => `${metrics.value?.summary.successRate || 0}%`)

function formatDay(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(value)).replace('.', '')
}

async function createApp() {
  saving.value = true
  try {
    const app = await $fetch('/api/apps', { method: 'POST', body: form })
    open.value = false
    toast.add({ title: 'App criado' })
    await navigateTo(`/apps/${app.id}`)
  } catch (error: any) {
    toast.add({ title: 'Não foi possível criar', description: error.data?.statusMessage, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-8">
    <header class="flex flex-col gap-5 border-b border-default pb-8 sm:flex-row sm:items-end sm:justify-between">
      <section>
        <p class="eyebrow mb-3">Operação em tempo real</p>
        <h1 class="page-heading">Visão geral</h1>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted">Acompanhe entregas, disponibilidade dos destinos e desempenho do fanout nos últimos sete dias.</p>
      </section>
      <UButton label="Novo app" icon="i-lucide-plus" size="lg" class="self-start whitespace-nowrap sm:self-auto" @click="open = true" />
    </header>

    <section aria-labelledby="metrics-title" class="flex flex-col gap-4">
      <header class="flex items-center justify-between">
        <h2 id="metrics-title" class="text-base font-semibold tracking-tight">Métricas de entrega</h2>
        <UButton label="Atualizar" icon="i-lucide-refresh-cw" color="neutral" variant="ghost" size="sm" :loading="metricsStatus === 'pending'" @click="() => refreshMetrics()" />
      </header>
      <UAlert v-if="metricsError" title="Não foi possível carregar as métricas" :description="metricsError.statusMessage" icon="i-lucide-triangle-alert" color="error" variant="subtle" />
      <section v-else-if="metricsStatus === 'pending'" class="grid gap-4 lg:grid-cols-3" aria-label="Carregando métricas">
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

    <header class="flex items-center justify-between border-b border-default pb-4">
      <section><h2 class="text-base font-semibold tracking-tight">Apps conectados</h2><p class="mt-1 text-xs text-muted">Entradas e destinos configurados no hub.</p></section>
    </header>

    <section class="panel-core grid sm:grid-cols-3" aria-label="Resumo da operação">
      <article class="border-b border-default p-5 sm:border-b-0 sm:border-r">
        <p class="text-xs font-medium text-muted">Apps configurados</p>
        <p class="mt-2 font-mono text-2xl font-semibold tracking-tight">{{ apps?.length || 0 }}</p>
      </article>
      <article class="border-b border-default p-5 sm:border-b-0 sm:border-r">
        <p class="text-xs font-medium text-muted">Destinos configurados</p>
        <p class="mt-2 font-mono text-2xl font-semibold tracking-tight">{{ totalEndpoints }}</p>
      </article>
      <article class="p-5">
        <p class="text-xs font-medium text-muted">Entregas registradas</p>
        <p class="mt-2 font-mono text-2xl font-semibold tracking-tight">{{ totalDeliveries.toLocaleString('pt-BR') }}</p>
      </article>
    </section>

    <section v-if="status === 'pending'" class="panel-core" aria-label="Carregando apps">
      <section v-for="item in 3" :key="item" class="flex items-center gap-4 border-b border-default p-5 last:border-b-0">
        <USkeleton class="size-11 rounded-lg" /><section class="flex-1"><USkeleton class="mb-2 h-4 w-40" /><USkeleton class="h-3 w-64" /></section>
      </section>
    </section>
    <UAlert v-else-if="error" title="Não foi possível carregar os apps" :description="error.statusMessage" icon="i-lucide-triangle-alert" color="error" variant="subtle" />
    <section v-else-if="apps?.length" class="panel-shell">
      <section class="panel-core">
      <NuxtLink v-for="app in apps" :key="app.id" :to="`/apps/${app.id}`" class="group grid min-h-20 gap-4 border-b border-default p-5 transition-colors duration-200 last:border-b-0 hover:bg-elevated/60 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6">
        <section class="flex min-w-0 items-center gap-4">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15"><UIcon name="i-lucide-webhook" class="size-5" /></span>
          <span class="min-w-0">
            <strong class="block truncate font-semibold tracking-tight text-highlighted">{{ app.name }}</strong>
            <small class="mt-1 block truncate font-mono text-[11px] text-muted">/api/ingress/{{ app.id }}</small>
          </span>
        </section>
        <section class="flex gap-6 pl-15 text-sm sm:pl-0">
          <span><strong class="font-mono text-default">{{ app._count.endpoints }}</strong> <small class="text-muted">destinos</small></span>
          <span><strong class="font-mono text-default">{{ app._count.deliveries }}</strong> <small class="text-muted">entregas</small></span>
        </section>
        <UIcon name="i-lucide-chevron-right" class="hidden size-5 text-dimmed transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
      </NuxtLink>
      </section>
    </section>
    <section v-else class="relative overflow-hidden rounded-xl border border-dashed border-default bg-default px-6 py-16 text-center">
      <div class="surface-grid absolute inset-0 opacity-35" />
      <section class="relative mx-auto max-w-md">
        <span class="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl bg-elevated text-muted ring-1 ring-default"><UIcon name="i-lucide-webhook" class="size-6" /></span>
        <h2 class="text-lg font-semibold tracking-tight">Conecte seu primeiro app</h2>
        <p class="mx-auto mb-6 mt-2 text-sm leading-relaxed text-muted">Você receberá uma URL de ingress e as credenciais prontas para configurar na Meta.</p>
        <UButton label="Criar primeiro app" icon="i-lucide-plus" @click="open = true" />
      </section>
    </section>

    <UModal v-model:open="open" title="Novo app" description="Crie uma nova entrada para receber eventos da Meta.">
      <template #body>
        <form class="flex flex-col gap-5" @submit.prevent="createApp">
          <UFormField label="Nome do app" description="Use um nome que identifique o produto ou ambiente." required><UInput v-model="form.name" size="lg" autofocus required class="w-full" placeholder="WhatsApp Produção" /></UFormField>
          <UFormField label="App Secret" description="Disponível em Configurações > Básico no painel da Meta." required><UInput v-model="form.appSecret" size="lg" type="password" icon="i-lucide-key-round" required class="w-full" /></UFormField>
          <footer class="mt-2 flex flex-col-reverse gap-2 border-t border-default pt-5 sm:flex-row sm:justify-end">
            <UButton label="Cancelar" color="neutral" variant="ghost" @click="open = false" />
            <UButton type="submit" label="Criar app" icon="i-lucide-plus" :loading="saving" />
          </footer>
        </form>
      </template>
    </UModal>
  </section>
</template>

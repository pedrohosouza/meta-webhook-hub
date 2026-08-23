<script setup lang="ts">
const route = useRoute()
const { data: log, status, error } = await useFetch(`/api/logs/${route.params.id}`)
const formattedPayload = computed(() => JSON.stringify(log.value?.eventPayload, null, 2))
const delivered = computed(() => Boolean(log.value?.statusCode && log.value.statusCode >= 200 && log.value.statusCode < 300))
</script>

<template>
  <section v-if="status === 'pending'" class="flex flex-col gap-5"><USkeleton class="h-24" /><USkeleton class="h-64" /><USkeleton class="h-80" /></section>
  <UAlert v-else-if="error" title="Entrega não encontrada" :description="error.statusMessage" icon="i-lucide-triangle-alert" color="error" variant="subtle" />
  <section v-else-if="log" class="flex flex-col gap-8">
    <header class="border-b border-default pb-8">
      <UButton to="/logs" label="Entregas" icon="i-lucide-arrow-left" color="neutral" variant="link" class="mb-3 px-0" />
      <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <section>
          <h1 class="page-heading">Detalhes da entrega</h1>
          <p class="mt-2 font-mono text-[11px] text-muted">{{ log.id }}</p>
        </section>
        <UBadge :color="delivered ? 'success' : 'error'" variant="subtle" size="lg" class="self-start sm:self-auto">{{ delivered ? 'Entregue' : 'Falha na entrega' }}</UBadge>
      </section>
    </header>

    <section class="panel-core grid sm:grid-cols-2 xl:grid-cols-5">
      <article class="border-b border-default p-5 sm:border-r xl:border-b-0"><p class="text-xs text-muted">App</p><p class="mt-2 truncate font-semibold">{{ log.app.name }}</p></article>
      <article class="border-b border-default p-5 xl:border-b-0 xl:border-r"><p class="text-xs text-muted">Status HTTP</p><p class="mt-2 font-mono text-lg font-semibold">{{ log.statusCode ?? 'Sem resposta' }}</p></article>
      <article class="border-b border-default p-5 sm:border-b-0 sm:border-r"><p class="text-xs text-muted">Tempo de execução</p><p class="mt-2 font-mono text-lg font-semibold">{{ log.executionTimeMs }} ms</p></article>
      <article class="border-b border-default p-5 sm:border-b-0 sm:border-r"><p class="text-xs text-muted">Tentativa</p><p class="mt-2 font-mono text-lg font-semibold">{{ log.attemptCount }} / 5</p></article>
      <article class="p-5"><p class="text-xs text-muted">Recebido em</p><p class="mt-2 font-mono text-xs font-medium">{{ new Date(log.createdAt).toLocaleString('pt-BR') }}</p></article>
    </section>

    <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)]">
      <section class="panel-core">
        <header class="flex items-center justify-between border-b border-default px-5 py-4 sm:px-6"><h2 class="text-sm font-semibold">Payload enviado</h2><span class="font-mono text-[10px] text-muted">JSON</span></header>
        <pre class="max-h-[620px] overflow-auto p-5 text-xs leading-relaxed text-default sm:p-6">{{ formattedPayload }}</pre>
      </section>
      <section class="flex flex-col gap-8">
        <section class="panel-core">
          <header class="border-b border-default px-5 py-4"><h2 class="text-sm font-semibold">Destino</h2></header>
          <p class="break-all p-5 font-mono text-xs leading-relaxed text-muted">{{ log.endpoint.url }}</p>
        </section>
        <section class="panel-core">
          <header class="flex items-center justify-between border-b border-default px-5 py-4"><h2 class="text-sm font-semibold">Resposta</h2><span class="font-mono text-[10px] text-muted">BODY</span></header>
          <pre class="max-h-80 overflow-auto whitespace-pre-wrap p-5 text-xs leading-relaxed text-default">{{ log.responseBody || '(corpo vazio)' }}</pre>
        </section>
      </section>
    </section>
  </section>
</template>

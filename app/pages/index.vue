<script setup lang="ts">
const toast = useToast()
const open = ref(false)
const saving = ref(false)
const form = reactive({ name: '', appSecret: '' })
const { data: apps, status, error } = await useFetch('/api/apps')
const totalEndpoints = computed(() => apps.value?.reduce((total, app) => total + app._count.endpoints, 0) || 0)
const totalDeliveries = computed(() => apps.value?.reduce((total, app) => total + app._count.deliveries, 0) || 0)

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
        <p class="eyebrow mb-3">Visão geral</p>
        <h1 class="page-heading">Apps conectados</h1>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted">Cada app recebe eventos em uma URL exclusiva e distribui o payload para os destinos ativos.</p>
      </section>
      <UButton label="Novo app" icon="i-lucide-plus" size="lg" class="self-start whitespace-nowrap sm:self-auto" @click="open = true" />
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

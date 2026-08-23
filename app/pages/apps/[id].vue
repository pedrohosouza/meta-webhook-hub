<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const toast = useToast()
const saving = ref(false)
const adding = ref(false)
const deleteModalOpen = ref(false)
const deleting = ref(false)
const testingEndpointId = ref<string | null>(null)
const endpointUrl = ref('')
const id = computed(() => route.params.id as string)
const { data: app, status, error, refresh } = await useFetch(() => `/api/apps/${id.value}`)
const endpointToRemove = ref<NonNullable<typeof app.value>['endpoints'][number] | null>(null)
const form = reactive({ name: '', appSecret: '', verifyToken: '' })
const ingressUrl = computed(() => `${config.public.baseUrl}/api/ingress/${id.value}`)
const activeEndpoints = computed(() => app.value?.endpoints.filter(endpoint => endpoint.isActive).length || 0)

if (app.value) Object.assign(form, { name: app.value.name, appSecret: '', verifyToken: app.value.verifyToken })

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/apps/${id.value}`, { method: 'PUT', body: form })
    form.appSecret = ''
    toast.add({ title: 'Configurações salvas' })
    await refresh()
  } catch (error: any) {
    toast.add({ title: 'Falha ao salvar', description: error.data?.statusMessage, color: 'error' })
  } finally { saving.value = false }
}

async function addEndpoint() {
  adding.value = true
  try {
    await $fetch(`/api/apps/${id.value}/endpoints`, { method: 'POST', body: { url: endpointUrl.value } })
    endpointUrl.value = ''
    toast.add({ title: 'Destino adicionado' })
    await refresh()
  } catch (error: any) {
    toast.add({ title: 'Falha ao adicionar', description: error.data?.statusMessage, color: 'error' })
  } finally { adding.value = false }
}

async function toggleEndpoint(endpoint: NonNullable<typeof app.value>['endpoints'][number]) {
  await $fetch(`/api/endpoints/${endpoint.id}`, { method: 'PUT', body: { isActive: !endpoint.isActive } })
  await refresh()
}

async function removeEndpoint(endpointId: string) {
  try {
    await $fetch(`/api/endpoints/${endpointId}`, { method: 'DELETE' })
    endpointToRemove.value = null
    toast.add({ title: 'Destino removido' })
    await refresh()
  } catch (error: any) {
    toast.add({ title: 'Falha ao remover destino', description: error.data?.statusMessage, color: 'error' })
  }
}

async function testEndpoint(endpointId: string) {
  testingEndpointId.value = endpointId
  try {
    const result = await $fetch(`/api/endpoints/${endpointId}/test`, { method: 'POST' })
    toast.add({
      title: result.ok ? 'Teste entregue' : 'Teste não entregue',
      description: result.statusCode
        ? `HTTP ${result.statusCode} em ${result.executionTimeMs} ms`
        : `${result.error || 'Falha de conexão'} (${result.executionTimeMs} ms)`,
      color: result.ok ? 'success' : 'error'
    })
  } catch (error: any) {
    toast.add({ title: 'Falha ao testar destino', description: error.data?.statusMessage, color: 'error' })
  } finally {
    testingEndpointId.value = null
  }
}

async function removeApp() {
  deleting.value = true
  try {
    await $fetch(`/api/apps/${id.value}`, { method: 'DELETE' })
    deleteModalOpen.value = false
    toast.add({ title: 'App excluído' })
    await navigateTo('/')
  } catch (error: any) {
    toast.add({ title: 'Falha ao excluir', description: error.data?.statusMessage, color: 'error' })
  } finally {
    deleting.value = false
  }
}

async function copy(value: string) {
  await navigator.clipboard.writeText(value)
  toast.add({ title: 'Copiado' })
}
</script>

<template>
  <section v-if="status === 'pending'" class="flex flex-col gap-5" aria-label="Carregando app">
    <USkeleton class="h-24 rounded-xl" />
    <USkeleton class="h-72 rounded-xl" />
    <USkeleton class="h-64 rounded-xl" />
  </section>
  <UAlert v-else-if="error" title="Não foi possível carregar o app" :description="error.statusMessage" icon="i-lucide-triangle-alert" color="error" variant="subtle" />
  <section v-else-if="app" class="flex flex-col gap-8">
    <header class="flex flex-col gap-5 border-b border-default pb-8 sm:flex-row sm:items-end sm:justify-between">
      <section>
        <UButton to="/" label="Apps" icon="i-lucide-arrow-left" color="neutral" variant="link" class="mb-3 px-0" />
        <h1 class="page-heading">{{ app.name }}</h1>
        <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
          <span>{{ app.id }}</span>
          <span class="text-primary">{{ activeEndpoints }} destinos ativos</span>
        </p>
      </section>
      <UButton label="Excluir app" icon="i-lucide-trash-2" color="error" variant="soft" class="self-start whitespace-nowrap sm:self-auto" @click="deleteModalOpen = true" />
    </header>

    <section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section class="flex flex-col gap-8">
        <section class="panel-core">
          <header class="flex items-start gap-4 border-b border-default px-5 py-5 sm:px-6">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UIcon name="i-lucide-badge-check" class="size-5" /></span>
            <section>
              <h2 class="font-semibold tracking-tight">Integração Meta</h2>
              <p class="mt-1 text-sm text-muted">Credenciais usadas no handshake e na validação de eventos.</p>
            </section>
          </header>
          <form class="grid gap-5 p-5 sm:grid-cols-2 sm:p-6" @submit.prevent="save">
            <UFormField label="Nome do app"><UInput v-model="form.name" size="lg" class="w-full" /></UFormField>
            <UFormField label="Verify Token" description="Deve ser igual ao token informado na Meta."><UInput v-model="form.verifyToken" size="lg" class="w-full" /></UFormField>
            <UFormField label="Trocar App Secret" description="Deixe vazio para manter o segredo atual, que não pode ser exibido.">
              <UInput v-model="form.appSecret" size="lg" type="password" icon="i-lucide-key-round" placeholder="Novo App Secret" class="w-full" autocomplete="new-password" />
            </UFormField>
            <UFormField label="URL de callback" description="Cole este endereço no painel da Meta.">
              <UInput :model-value="ingressUrl" size="lg" readonly class="w-full font-mono text-xs">
                <template #trailing><UButton icon="i-lucide-copy" size="xs" color="neutral" variant="ghost" aria-label="Copiar URL" @click="copy(ingressUrl)" /></template>
              </UInput>
            </UFormField>
            <footer class="border-t border-default pt-5 sm:col-span-2"><UButton type="submit" label="Salvar alterações" icon="i-lucide-save" :loading="saving" /></footer>
          </form>
        </section>

        <section class="panel-core">
          <header class="border-b border-default px-5 py-5 sm:px-6">
            <h2 class="font-semibold tracking-tight">Destinos de entrega</h2>
            <p class="mt-1 text-sm text-muted">Eventos válidos são enviados em paralelo para todos os destinos ativos.</p>
          </header>
          <form class="flex flex-col gap-3 border-b border-default bg-elevated/40 p-5 sm:flex-row sm:p-6" @submit.prevent="addEndpoint">
            <UInput v-model="endpointUrl" type="url" size="lg" icon="i-lucide-link" placeholder="https://servico.exemplo.com/webhooks" class="flex-1" required />
            <UButton type="submit" label="Adicionar destino" icon="i-lucide-plus" size="lg" class="whitespace-nowrap" :loading="adding" />
          </form>
          <ul v-if="app.endpoints.length">
            <li v-for="endpoint in app.endpoints" :key="endpoint.id" class="grid gap-4 border-b border-default p-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
              <section class="flex min-w-0 items-center gap-4">
                <span :class="['flex size-10 shrink-0 items-center justify-center rounded-xl', endpoint.isActive ? 'bg-primary/10 text-primary' : 'bg-elevated text-dimmed']"><UIcon name="i-lucide-send" class="size-4" /></span>
                <section class="min-w-0">
                  <p class="truncate font-mono text-xs font-medium text-default">{{ endpoint.url }}</p>
                  <p class="mt-1 text-xs text-muted">{{ endpoint.isActive ? 'Recebendo eventos' : 'Entrega pausada' }}</p>
                </section>
              </section>
              <section class="flex items-center justify-end gap-3">
                <USwitch :model-value="endpoint.isActive" :aria-label="`Alternar ${endpoint.url}`" @update:model-value="toggleEndpoint(endpoint)" />
                <UButton icon="i-lucide-play" color="primary" variant="ghost" size="sm" :loading="testingEndpointId === endpoint.id" :disabled="testingEndpointId !== null && testingEndpointId !== endpoint.id" :aria-label="`Testar ${endpoint.url}`" @click="testEndpoint(endpoint.id)" />
                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" :aria-label="`Remover ${endpoint.url}`" @click="endpointToRemove = endpoint" />
              </section>
            </li>
          </ul>
          <section v-else class="px-6 py-14 text-center">
            <span class="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-elevated text-muted"><UIcon name="i-lucide-route-off" class="size-5" /></span>
            <h3 class="text-sm font-semibold">Nenhum destino configurado</h3>
            <p class="mx-auto mt-1 max-w-sm text-sm text-muted">Adicione uma URL para começar a redistribuir os eventos recebidos.</p>
          </section>
        </section>
      </section>

      <aside class="panel-core self-start p-5 xl:sticky xl:top-10">
        <h2 class="text-sm font-semibold tracking-tight">Checklist da Meta</h2>
        <ol class="mt-5 flex flex-col gap-5">
          <li class="flex gap-3"><span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs text-primary">1</span><p class="text-sm leading-relaxed text-muted">Copie a URL de callback para a configuração do webhook.</p></li>
          <li class="flex gap-3"><span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs text-primary">2</span><p class="text-sm leading-relaxed text-muted">Informe exatamente o mesmo Verify Token.</p></li>
          <li class="flex gap-3"><span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs text-primary">3</span><p class="text-sm leading-relaxed text-muted">Assine os campos de webhook que deseja receber.</p></li>
        </ol>
        <section class="mt-6 border-t border-default pt-5">
          <p class="flex items-start gap-2 text-xs leading-relaxed text-muted"><UIcon name="i-lucide-shield-check" class="mt-0.5 size-4 shrink-0 text-primary" />O App Secret valida a assinatura HMAC antes de qualquer evento entrar na fila.</p>
        </section>
      </aside>
    </section>

    <UModal v-model:open="deleteModalOpen" title="Excluir app" description="Esta ação não pode ser desfeita.">
      <template #body>
        <section class="flex flex-col gap-5">
          <UAlert
            title="Todo o histórico será removido"
            :description="`O app ${app.name}, seus destinos e todas as entregas registradas serão excluídos permanentemente.`"
            icon="i-lucide-triangle-alert"
            color="error"
            variant="subtle"
          />
          <footer class="flex flex-col-reverse gap-2 border-t border-default pt-5 sm:flex-row sm:justify-end">
            <UButton label="Cancelar" color="neutral" variant="ghost" :disabled="deleting" @click="deleteModalOpen = false" />
            <UButton label="Excluir permanentemente" icon="i-lucide-trash-2" color="error" :loading="deleting" @click="removeApp" />
          </footer>
        </section>
      </template>
    </UModal>

    <UModal :open="Boolean(endpointToRemove)" title="Remover destino" description="A entrega de novos eventos para esta URL será interrompida." @update:open="!$event && (endpointToRemove = null)">
      <template #body>
        <section class="flex flex-col gap-5">
          <UAlert v-if="endpointToRemove" title="Confirme a remoção" :description="endpointToRemove.url" icon="i-lucide-triangle-alert" color="error" variant="subtle" />
          <footer class="flex flex-col-reverse gap-2 border-t border-default pt-5 sm:flex-row sm:justify-end">
            <UButton label="Cancelar" color="neutral" variant="ghost" @click="endpointToRemove = null" />
            <UButton v-if="endpointToRemove" label="Remover destino" icon="i-lucide-trash-2" color="error" @click="removeEndpoint(endpointToRemove.id)" />
          </footer>
        </section>
      </template>
    </UModal>
  </section>
</template>

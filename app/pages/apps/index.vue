<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const open = ref(false)
const saving = ref(false)
const form = reactive({ name: '', appSecret: '' })
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const pageSize = computed(() => Math.min(100, Math.max(10, Number(route.query.pageSize) || 10)))
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const activeSearch = computed(() => typeof route.query.search === 'string' ? route.query.search : '')
const { data: apps, status, error } = await useFetch('/api/apps', { query: { page, pageSize, search: activeSearch } })
const pageSizeOptions = [
  { label: '10 por página', value: 10 },
  { label: '25 por página', value: 25 },
  { label: '50 por página', value: 50 },
  { label: '100 por página', value: 100 }
]
type AppRow = NonNullable<typeof apps.value>['items'][number]
const columns: TableColumn<AppRow>[] = [
  { accessorKey: 'name', header: 'App' },
  { id: 'endpoints', header: 'Destinos' },
  { id: 'deliveries', header: 'Entregas' },
  { accessorKey: 'createdAt', header: 'Criado em' },
  { id: 'actions', header: '' }
]

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const term = value.trim()
    if (term === activeSearch.value) return
    router.replace({ query: { ...route.query, search: term || undefined, page: 1 } })
  }, 350)
})
watch(activeSearch, (value) => { if (!value) search.value = '' })
onBeforeUnmount(() => clearTimeout(searchTimer))

function updatePageSize(value: number) {
  router.push({ query: { ...route.query, page: 1, pageSize: value } })
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value))
}

function openApp(event: Event, row: { original: AppRow }) {
  const to = `/apps/${row.original.id}`
  if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey)) window.open(to, '_blank')
  else navigateTo(to)
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
  <section class="flex flex-col gap-6">
    <header class="border-b border-default pb-6">
      <h1 class="page-heading">Aplicativos</h1>
    </header>

    <UAlert v-if="error" title="Não foi possível carregar os apps" :description="error.statusMessage" icon="i-lucide-triangle-alert" color="error" variant="subtle" />
    <section v-else class="panel-shell">
      <section class="panel-core">
        <header class="flex flex-col gap-3 border-b border-default bg-elevated/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <UInput v-model="search" icon="i-lucide-search" placeholder="Busque por nome do app" aria-label="Buscar app" role="search" class="w-full sm:max-w-sm" />
          <UButton label="Novo app" icon="i-lucide-plus" class="self-end whitespace-nowrap sm:self-auto" @click="open = true" />
        </header>
        <section class="overflow-x-auto" tabindex="0" aria-label="Tabela de apps">
          <UTable :data="apps?.items || []" :columns="columns" :loading="status === 'pending'" :ui="{ tr: 'cursor-pointer' }" class="min-w-[640px]" @select="openApp">
            <template #name-cell="{ row }">
              <section class="flex min-w-0 items-center gap-4">
                <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15"><UIcon name="i-lucide-webhook" class="size-5" /></span>
                <span class="min-w-0">
                  <strong class="block truncate font-semibold tracking-tight text-highlighted">{{ row.original.name }}</strong>
                </span>
              </section>
            </template>
            <template #endpoints-cell="{ row }"><span class="font-mono text-sm">{{ row.original._count.endpoints }}</span></template>
            <template #deliveries-cell="{ row }"><span class="font-mono text-sm">{{ row.original._count.deliveries.toLocaleString('pt-BR') }}</span></template>
            <template #createdAt-cell="{ row }"><time :datetime="String(row.original.createdAt)" class="whitespace-nowrap font-mono text-xs text-muted">{{ formatDate(row.original.createdAt) }}</time></template>
            <template #actions-cell><UIcon name="i-lucide-chevron-right" class="size-4 text-dimmed" aria-hidden="true" /></template>
            <template #empty>
              <section class="flex flex-col items-center px-6 py-16 text-center">
                <UIcon name="i-lucide-webhook" class="mb-4 size-8 text-dimmed" aria-hidden="true" />
                <h2 class="font-semibold">{{ activeSearch ? 'Nenhum app encontrado' : 'Conecte seu primeiro app' }}</h2>
                <p v-if="!activeSearch" class="mt-1 max-w-sm text-sm text-muted">Você receberá uma URL de ingress e as credenciais prontas para configurar na Meta.</p>
              </section>
            </template>
          </UTable>
        </section>
        <footer v-if="apps" class="flex flex-col gap-3 border-t border-default p-4 sm:flex-row sm:items-center sm:justify-between">
          <section class="flex flex-wrap items-center gap-3">
            <USelect :model-value="pageSize" :items="pageSizeOptions" :content="{ bodyLock: false }" aria-label="Apps por página" @update:model-value="updatePageSize" />
            <p class="text-xs text-muted">Página {{ apps.page }} de {{ apps.pages }} · {{ apps.total.toLocaleString('pt-BR') }} apps</p>
          </section>
          <UPagination class="self-end sm:self-auto" :page="page" :total="apps.total" :items-per-page="apps.pageSize" @update:page="router.push({ query: { ...route.query, page: $event } })" />
        </footer>
      </section>
    </section>

    <UModal v-model:open="open" title="Novo app" description="Crie uma nova entrada para receber eventos da Meta.">
      <template #body>
        <form class="flex flex-col gap-5" @submit.prevent="createApp">
          <UFormField label="Nome do app" description="Use um nome único que identifique o produto ou ambiente." required><UInput v-model="form.name" size="lg" autofocus required class="w-full" placeholder="WhatsApp Produção" /></UFormField>
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

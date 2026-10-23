<script setup lang="ts">
import type { RuleDto } from './RuleEditor.vue'

interface EndpointOption { id: string, url: string, isActive: boolean, ruleId: string | null }

const props = defineProps<{ appId: string, rules: RuleDto[], endpoints: EndpointOption[] }>()
const emit = defineEmits<{ changed: [] }>()

const toast = useToast()
const editorOpen = ref(false)
const editing = ref<RuleDto | null>(null)
const ruleToRemove = ref<RuleDto | null>(null)
const removing = ref(false)

const endpointsOf = (rule: RuleDto) => props.endpoints.filter(endpoint => endpoint.ruleId === rule.id)
const shortUrl = (url: string) => url.replace(/^https?:\/\//, '')

function openEditor(rule: RuleDto | null) {
  editing.value = rule
  editorOpen.value = true
}

async function removeRule() {
  if (!ruleToRemove.value) return
  removing.value = true
  try {
    await $fetch(`/api/rules/${ruleToRemove.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Regra removida' })
    ruleToRemove.value = null
    emit('changed')
  } catch (error: any) {
    toast.add({ title: 'Falha ao remover a regra', description: error.data?.statusMessage, color: 'error' })
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <section class="panel-core">
    <header class="flex items-center gap-4 border-b border-default px-5 py-5 sm:px-6">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UIcon name="i-lucide-split" class="size-5" /></span>
      <section>
        <h2 class="font-semibold tracking-tight">Regras</h2>
        <p class="text-xs text-muted">Uma regra pode valer para vários destinos.</p>
      </section>
      <UButton class="ml-auto" label="Nova regra" icon="i-lucide-plus" @click="openEditor(null)" />
    </header>

    <ul v-if="rules.length">
      <li v-for="rule in rules" :key="rule.id" class="grid gap-3 border-b border-default p-5 last:border-b-0 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <section class="min-w-0">
          <p class="text-sm font-semibold">{{ rule.name }}</p>
          <p class="mt-1 text-xs text-muted">{{ !rule.conditions.length ? 'Sem condições: aceita todos os eventos' : rule.matchMode === 'ALL' ? 'Aceita quando todas:' : 'Aceita quando qualquer uma:' }}</p>
          <ul>
            <li v-for="(condition, index) in rule.conditions" :key="index" class="truncate font-mono text-xs text-default">{{ describeCondition(condition) }}</li>
          </ul>
          <section class="mt-2 flex flex-wrap gap-1.5">
            <UBadge v-for="endpoint in endpointsOf(rule)" :key="endpoint.id" :label="shortUrl(endpoint.url)" color="primary" variant="subtle" size="sm" icon="i-lucide-arrow-right" />
            <span v-if="!endpointsOf(rule).length" class="text-xs text-warning">Nenhum destino usa esta regra</span>
          </section>
        </section>
        <section class="flex items-center justify-end gap-1.5">
          <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" :aria-label="`Editar ${rule.name}`" @click="openEditor(rule)" />
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" :aria-label="`Remover ${rule.name}`" @click="ruleToRemove = rule" />
        </section>
      </li>
    </ul>
    <section v-else class="px-6 py-12 text-center">
      <span class="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-elevated text-muted"><UIcon name="i-lucide-git-fork" class="size-5" /></span>
      <h3 class="text-sm font-semibold">Nenhuma regra</h3>
      <p class="mx-auto mt-1 max-w-md text-sm text-muted">Todos os destinos recebem todos os eventos. Crie uma regra e ligue-a a um ou mais destinos para filtrar.</p>
    </section>

    <RuleEditor v-model:open="editorOpen" :app-id="appId" :rule="editing" :rules="rules" :endpoints="endpoints" @saved="emit('changed')" />

    <UModal :open="Boolean(ruleToRemove)" title="Remover regra" @update:open="!$event && (ruleToRemove = null)">
      <template #body>
        <section class="flex flex-col gap-5">
          <UAlert
            v-if="ruleToRemove"
            :title="ruleToRemove.name"
            :description="endpointsOf(ruleToRemove).length ? `${endpointsOf(ruleToRemove).length} destino(s) ficarão sem regra e voltarão a receber todos os eventos.` : 'Nenhum destino usa esta regra.'"
            icon="i-lucide-triangle-alert"
            :color="endpointsOf(ruleToRemove).length ? 'warning' : 'neutral'"
            variant="subtle"
          />
          <footer class="flex flex-col-reverse gap-2 border-t border-default pt-5 sm:flex-row sm:justify-end">
            <UButton label="Cancelar" color="neutral" variant="ghost" :disabled="removing" @click="ruleToRemove = null" />
            <UButton label="Remover regra" icon="i-lucide-trash-2" color="error" :loading="removing" @click="removeRule" />
          </footer>
        </section>
      </template>
    </UModal>
  </section>
</template>

<script setup lang="ts">
import type { RuleDraft, RuleDto } from './RuleEditor.vue'

interface EndpointOption { id: string, url: string, isActive: boolean, ruleId: string | null }

const props = defineProps<{
  appId: string
  endpoint: EndpointOption | null
  newUrl: string | null
  rules: RuleDto[]
  endpoints: EndpointOption[]
}>()
const emit = defineEmits<{ saved: [endpointId: string] }>()
const open = defineModel<boolean>('open', { required: true })

const toast = useToast()
const saving = ref(false)
const choice = ref('none')
const draft = ref<RuleDraft | null>(null)
const draftOpen = ref(false)

const isNew = computed(() => !props.endpoint)
const url = computed(() => props.endpoint?.url ?? props.newUrl ?? '')
const items = computed(() => [
  { value: 'none', label: 'Receber todos os eventos' },
  ...props.rules.map(rule => ({ value: rule.id, label: `Regra: ${rule.name}` })),
  ...(draft.value ? [{ value: 'new', label: `Nova regra: ${draft.value.name}` }] : [])
])
const selected = computed<RuleDraft | RuleDto | null>(() => choice.value === 'new' ? draft.value : props.rules.find(rule => rule.id === choice.value) ?? null)

function onDraft(value: RuleDraft) {
  draft.value = value
  choice.value = 'new'
}

async function save() {
  const rule = choice.value === 'none' ? { ruleId: null } : choice.value === 'new' ? { newRule: draft.value } : { ruleId: choice.value }
  saving.value = true
  try {
    const saved = props.endpoint
      ? await $fetch<{ id: string }>(`/api/endpoints/${props.endpoint.id}`, { method: 'PUT', body: rule })
      : await $fetch<{ id: string }>(`/api/apps/${props.appId}/endpoints`, { method: 'POST', body: { url: props.newUrl, ...rule } })
    open.value = false
    emit('saved', saved.id)
  } catch (error: any) {
    toast.add({ title: isNew.value ? 'Falha ao adicionar destino' : 'Falha ao salvar destino', description: error.data?.statusMessage, color: 'error' })
  } finally {
    saving.value = false
  }
}

watch(open, (isOpen) => {
  if (!isOpen) return
  draft.value = null
  choice.value = props.endpoint?.ruleId ?? 'none'
})
</script>

<template>
  <UModal v-model:open="open" :title="isNew ? 'Novo destino' : 'Regra do destino'" :description="url">
    <template #body>
      <section class="flex flex-col gap-5">
        <UFormField label="Este destino recebe" description="Sem regra, o destino recebe todos os eventos do app.">
          <USelect v-model="choice" :items="items" class="w-full" aria-label="Regra do destino" />
        </UFormField>

        <section v-if="selected" class="rounded-xl bg-elevated/40 p-3 ring-1 ring-default">
          <p class="text-xs text-muted">{{ selected.matchMode === 'ALL' ? 'Aceita quando todas' : 'Aceita quando qualquer uma' }}:</p>
          <p v-if="!selected.conditions.length" class="mt-1 text-xs text-muted">Sem condições: aceita todos os eventos.</p>
          <ul class="mt-1">
            <li v-for="(condition, index) in selected.conditions" :key="index" class="truncate font-mono text-xs text-default">{{ describeCondition(condition) }}</li>
          </ul>
        </section>

        <UButton :label="draft ? 'Refazer regra nova…' : 'Criar regra nova…'" icon="i-lucide-radio-tower" color="neutral" variant="soft" class="self-start" @click="draftOpen = true" />

        <footer class="flex flex-col-reverse gap-2 border-t border-default pt-5 sm:flex-row sm:justify-end">
          <UButton label="Cancelar" color="neutral" variant="ghost" :disabled="saving" @click="open = false" />
          <UButton :label="isNew ? 'Adicionar destino' : 'Salvar'" icon="i-lucide-check" :loading="saving" @click="save" />
        </footer>
      </section>
    </template>
  </UModal>

  <RuleEditor v-model:open="draftOpen" :app-id="appId" :rule="null" :rules="rules" :endpoints="endpoints" draft-only @draft="onDraft" />
</template>

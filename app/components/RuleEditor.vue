<script setup lang="ts">
export interface RuleDto {
  id: string
  name: string
  matchMode: MatchMode
  conditions: RuleCondition[]
}

export interface RuleDraft {
  name: string
  matchMode: MatchMode
  conditions: RuleCondition[]
}

interface EndpointOption { id: string, url: string, isActive: boolean, ruleId: string | null }
interface CapturedPayload { key: number, receivedAt: string, label: string, payload: unknown }

/** `draftOnly`: não grava a regra, devolve os campos em `draft` para quem está criando um destino gravar junto. */
const props = defineProps<{ appId: string, rule: RuleDto | null, rules: RuleDto[], endpoints: EndpointOption[], draftOnly?: boolean }>()
const emit = defineEmits<{ saved: [], draft: [draft: RuleDraft] }>()
const open = defineModel<boolean>('open', { required: true })

const toast = useToast()
const saving = ref(false)
const name = ref('')
const matchMode = ref<MatchMode>('ALL')
const conditions = ref<RuleCondition[]>([])
const endpointIds = ref<string[]>([])

const MAX_CAPTURED = 20
const captured = ref<CapturedPayload[]>([])
const selectedKey = ref<number | null>(null)
const liveConnected = ref(false)
let liveSource: EventSource | null = null
let sequence = 0

const capturedItems = computed(() => captured.value.map(item => ({
  value: item.key,
  label: `${new Intl.DateTimeFormat('pt-BR', { timeStyle: 'medium' }).format(new Date(item.receivedAt))} · ${item.label}`
})))

// Sem escolha manual, acompanha sempre o último webhook recebido.
const current = computed(() => captured.value.find(item => item.key === selectedKey.value) ?? captured.value[0] ?? null)
const payload = computed<unknown>(() => current.value?.payload ?? null)

const conditionResults = computed(() => conditions.value.map(condition => payload.value ? evaluateCondition(condition, payload.value) : null))
const accepts = computed(() => payload.value ? endpointAccepts({ matchMode: matchMode.value, conditions: conditions.value }, payload.value) : null)

function otherRuleName(endpoint: EndpointOption) {
  if (!endpoint.ruleId || endpoint.ruleId === props.rule?.id) return undefined
  const other = props.rules.find(rule => rule.id === endpoint.ruleId)
  return other ? `Hoje usa a regra “${other.name}”; será movido para esta` : undefined
}

function payloadLabel(value: unknown) {
  const [object] = resolvePath(value, 'object')
  const [field] = resolvePath(value, 'entry[*].changes[*].field')
  return [object, field].filter(item => typeof item === 'string').join(' · ') || 'evento'
}

function stopLive() {
  liveSource?.close()
  liveSource = null
  liveConnected.value = false
}

function startLive() {
  stopLive()
  captured.value = []
  selectedKey.value = null
  liveSource = new EventSource(`/api/apps/${props.appId}/webhook-test/stream?payload=1`)
  liveSource.onmessage = (event) => {
    const data = JSON.parse(event.data) as { kind: string, payload?: unknown }
    if (data.kind === 'connected') {
      liveConnected.value = true
    } else if (data.kind === 'payload' && data.payload) {
      captured.value = [{ key: sequence++, receivedAt: new Date().toISOString(), label: payloadLabel(data.payload), payload: data.payload }, ...captured.value].slice(0, MAX_CAPTURED)
    }
  }
  liveSource.onerror = () => {
    liveConnected.value = false
  }
}

function addCondition(selection?: { path: string, value: string | null }) {
  conditions.value.push(selection
    ? { path: selection.path, operator: selection.value === null ? 'exists' : 'equals', ...(selection.value === null ? {} : { value: selection.value }) }
    : { path: '', operator: 'equals', value: '' })
}

function setOperator(condition: RuleCondition, operator: RuleOperator) {
  condition.operator = operator
  if (!operatorNeedsValue(operator)) delete condition.value
  else condition.value ??= ''
}

function toggleEndpoint(id: string, checked: boolean | 'indeterminate') {
  endpointIds.value = checked === true ? [...new Set([...endpointIds.value, id])] : endpointIds.value.filter(item => item !== id)
}

async function save() {
  if (!name.value.trim()) {
    toast.add({ title: 'Informe o nome da regra', color: 'error' })
    return
  }
  const fields = { name: name.value, matchMode: matchMode.value, conditions: conditions.value }
  if (props.draftOnly) {
    open.value = false
    emit('draft', { ...fields, name: fields.name.trim() })
    return
  }

  saving.value = true
  try {
    const body = { ...fields, endpointIds: endpointIds.value }
    if (props.rule) await $fetch(`/api/rules/${props.rule.id}`, { method: 'PUT', body })
    else await $fetch(`/api/apps/${props.appId}/rules`, { method: 'POST', body })
    toast.add({ title: 'Regra salva' })
    open.value = false
    emit('saved')
  } catch (error: any) {
    toast.add({ title: 'Falha ao salvar regra', description: error.data?.statusMessage, color: 'error' })
  } finally {
    saving.value = false
  }
}

watch(open, (isOpen) => {
  if (!isOpen) {
    stopLive()
    return
  }
  name.value = props.rule?.name ?? ''
  matchMode.value = props.rule?.matchMode ?? 'ALL'
  conditions.value = props.rule ? props.rule.conditions.map(condition => ({ ...condition })) : []
  endpointIds.value = props.rule ? props.endpoints.filter(endpoint => endpoint.ruleId === props.rule!.id).map(endpoint => endpoint.id) : []
  startLive()
})

onBeforeUnmount(stopLive)
</script>

<template>
  <USlideover v-model:open="open" :title="rule ? 'Editar regra' : 'Nova regra'" description="Receba um webhook em tempo real, escolha os atributos e defina quais destinos o recebem." side="right" :ui="{ content: 'max-w-5xl' }">
    <template #body>
      <section class="grid gap-6 lg:grid-cols-2">
        <section class="flex min-w-0 flex-col gap-3" aria-label="Payload em tempo real">
          <header class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">Payload em tempo real</h3>
            <p class="flex items-center gap-2 text-xs text-muted">
              <span :class="['size-2 rounded-full', liveConnected ? 'bg-success' : 'bg-muted']" />
              {{ liveConnected ? 'Ouvindo' : 'Conectando…' }}
            </p>
          </header>
          <USelect v-if="captured.length > 1" :model-value="current?.key" :items="capturedItems" class="w-full" aria-label="Payload capturado" @update:model-value="selectedKey = $event as number" />
          <section class="max-h-[60vh] min-h-48 overflow-auto rounded-xl bg-elevated/50 p-3 ring-1 ring-default">
            <PayloadTree v-if="payload" :key="current?.key" :value="payload" @pick="addCondition" />
            <section v-else class="flex flex-col items-center gap-2 py-10 text-center text-xs text-muted">
              <UIcon name="i-lucide-radio-tower" class="size-7" aria-hidden="true" />
              <p>Aguardando o próximo webhook da Meta…</p>
              <p class="max-w-xs">Dispare um evento (ex.: envie uma mensagem de teste) e o payload aparece aqui para você escolher os atributos.</p>
            </section>
          </section>
          <p v-if="payload" class="text-xs text-muted">Clique em um atributo para adicionar uma condição.</p>
        </section>

        <section class="flex min-w-0 flex-col gap-5">
          <UFormField label="Nome da regra"><UInput v-model="name" placeholder="Ex.: Leads" class="w-full" /></UFormField>

          <section class="flex flex-col gap-3">
            <header class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-sm font-semibold">Aceita quando</h3>
              <USelect v-model="matchMode" :items="[{ value: 'ALL', label: 'Todas as condições' }, { value: 'ANY', label: 'Qualquer condição' }]" size="sm" aria-label="Combinação das condições" />
            </header>
            <p v-if="!conditions.length" class="rounded-xl bg-elevated/40 p-4 text-sm text-muted ring-1 ring-default">
              Sem condições, a regra aceita <strong class="text-default">todos</strong> os eventos. Clique em um atributo do payload para filtrar.
            </p>
            <ul class="flex flex-col gap-3">
              <li v-for="(condition, index) in conditions" :key="index" class="flex flex-col gap-2 rounded-xl bg-elevated/40 p-3 ring-1 ring-default">
                <section class="flex items-center gap-2">
                  <UInput v-model="condition.path" placeholder="entry[*].changes[*].field" size="sm" class="min-w-0 flex-1 font-mono" aria-label="Caminho do atributo" />
                  <UIcon v-if="conditionResults[index] !== null" :name="conditionResults[index] ? 'i-lucide-circle-check' : 'i-lucide-circle-x'" :class="['size-4 shrink-0', conditionResults[index] ? 'text-success' : 'text-muted']" />
                  <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="Remover condição" @click="conditions.splice(index, 1)" />
                </section>
                <section class="grid gap-2 sm:grid-cols-2">
                  <USelect :model-value="condition.operator" :items="operatorItems" size="sm" aria-label="Operador" @update:model-value="setOperator(condition, $event as RuleOperator)" />
                  <UInput v-if="operatorNeedsValue(condition.operator)" v-model="condition.value" placeholder="Valor" size="sm" aria-label="Valor" />
                </section>
              </li>
            </ul>
            <UButton label="Adicionar condição" icon="i-lucide-plus" color="neutral" variant="soft" size="sm" class="self-start" @click="addCondition()" />
            <p v-if="accepts !== null" :class="['flex items-center gap-2 text-xs font-medium', accepts ? 'text-success' : 'text-muted']">
              <UIcon :name="accepts ? 'i-lucide-circle-check' : 'i-lucide-circle-x'" class="size-4" />
              {{ accepts ? 'Esta regra aceita o payload capturado' : 'Esta regra não aceita o payload capturado' }}
            </p>
          </section>

          <section v-if="!draftOnly" class="flex flex-col gap-2">
            <h3 class="text-sm font-semibold">Destinos desta regra</h3>
            <p v-if="!endpoints.length" class="text-xs text-muted">Cadastre um destino primeiro.</p>
            <UCheckbox v-for="endpoint in endpoints" :key="endpoint.id" :model-value="endpointIds.includes(endpoint.id)" :label="endpoint.url" :description="endpointIds.includes(endpoint.id) ? otherRuleName(endpoint) : undefined" @update:model-value="toggleEndpoint(endpoint.id, $event)" />
          </section>
        </section>
      </section>
    </template>
    <template #footer>
      <section class="flex w-full justify-end gap-2">
        <UButton label="Cancelar" color="neutral" variant="ghost" :disabled="saving" @click="open = false" />
        <UButton :label="draftOnly ? 'Usar esta regra' : 'Salvar regra'" icon="i-lucide-check" :loading="saving" @click="save" />
      </section>
    </template>
  </USlideover>
</template>

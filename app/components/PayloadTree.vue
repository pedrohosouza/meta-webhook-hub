<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: unknown
  keys?: Array<string | number>
  label?: string
}>(), { keys: () => [], label: undefined })

const emit = defineEmits<{ pick: [selection: { path: string, value: string | null }] }>()

const MAX_ITEMS = 25
const open = ref(true)

const isContainer = computed(() => typeof props.value === 'object' && props.value !== null)
const entries = computed(() => {
  if (!isContainer.value) return []
  const list = Array.isArray(props.value)
    ? props.value.map((item, index) => [index, item] as const)
    : Object.entries(props.value as Record<string, unknown>)
  return list.slice(0, MAX_ITEMS)
})
const total = computed(() => isContainer.value ? Object.keys(props.value as object).length : 0)
const summary = computed(() => Array.isArray(props.value) ? `[${total.value}]` : `{${total.value}}`)
const display = computed(() => props.value === null ? 'null' : typeof props.value === 'string' ? `"${props.value}"` : String(props.value))

function pickLeaf() {
  emit('pick', { path: formatPath(props.keys), value: props.value === null ? null : String(props.value) })
}

function pickContainer() {
  emit('pick', { path: formatPath(props.keys), value: null })
}
</script>

<template>
  <section class="font-mono text-xs leading-6">
    <template v-if="isContainer">
      <section class="flex items-center gap-1">
        <button v-if="label !== undefined" type="button" class="flex size-5 items-center justify-center text-muted" :aria-label="open ? 'Recolher' : 'Expandir'" @click="open = !open">
          <UIcon :name="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="size-3.5" />
        </button>
        <button v-if="label !== undefined" type="button" class="rounded px-1 text-highlighted hover:bg-primary/10 hover:text-primary" :title="`Usar ${formatPath(keys)}`" @click="pickContainer">{{ label }}</button>
        <span class="text-muted">{{ summary }}</span>
      </section>
      <ul v-show="open || label === undefined" :class="label !== undefined ? 'ml-2.5 border-l border-default pl-3' : ''">
        <li v-for="[key, child] in entries" :key="key">
          <PayloadTree :value="child" :keys="[...keys, key]" :label="String(key)" @pick="emit('pick', $event)" />
        </li>
        <li v-if="total > MAX_ITEMS" class="text-muted">… mais {{ total - MAX_ITEMS }} itens</li>
      </ul>
    </template>
    <button v-else type="button" class="flex w-full min-w-0 items-baseline gap-2 rounded px-1 text-left hover:bg-primary/10" :title="`Usar ${formatPath(keys)}`" @click="pickLeaf">
      <span class="shrink-0 text-highlighted">{{ label }}</span>
      <span class="truncate text-primary">{{ display }}</span>
    </button>
  </section>
</template>

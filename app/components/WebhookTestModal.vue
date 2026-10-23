<script setup lang="ts">
const props = defineProps<{ appId: string, appName: string }>()

const typeLabels: Record<string, string> = {
  text: 'Texto', image: 'Imagem', audio: 'Áudio', video: 'Vídeo', document: 'Documento', sticker: 'Figurinha',
  location: 'Localização', contacts: 'Contato', reaction: 'Reação', button: 'Botão', interactive: 'Interativo',
  status: 'Status', event: 'Evento', unknown: 'Desconhecido'
}

const open = defineModel<boolean>('open', { required: true })
const { clear, connected, messages, start, stop } = useWebhookTest(() => props.appId)
const listRef = ref<HTMLElement | null>(null)

function typeLabel(type: string) {
  return typeLabels[type] ?? type
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeStyle: 'medium' }).format(new Date(value))
}

watch(() => messages.value.length, async () => {
  await nextTick()
  listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' })
})

watch(open, isOpen => (isOpen ? start() : stop()), { immediate: true })
</script>

<template>
  <UModal
    v-model:open="open"
    title="Testar webhook"
    :description="`Dispare um evento pela Meta para ${appName} e acompanhe aqui o que chega ao hub.`"
    :ui="{ content: 'max-w-lg', body: 'p-3 sm:p-3', footer: 'py-3 sm:py-3' }"
  >
    <template #body>
      <section ref="listRef" class="flex h-96 flex-col gap-2 overflow-y-auto rounded-xl bg-elevated/50 p-4 ring-1 ring-default" aria-live="polite">
        <section v-if="!messages.length" class="m-auto flex flex-col items-center gap-2 text-center text-xs font-medium text-muted">
          <UIcon name="i-lucide-radio-tower" class="size-8" aria-hidden="true" />
          <p>{{ connected ? 'Aguardando eventos…' : 'Conectando ao hub…' }}</p>
        </section>

        <article v-for="message in messages" :key="message.key" class="max-w-[88%] self-start rounded-lg rounded-tl-none bg-default px-3 py-2 shadow-sm ring-1 ring-default">
          <header class="mb-1 flex items-center gap-2">
            <UBadge :label="typeLabel(message.type)" color="neutral" variant="subtle" size="sm" />
            <span v-if="message.senderName || message.senderId" class="truncate text-xs font-medium text-highlighted">{{ message.senderName ?? message.senderId }}</span>
          </header>
          <p v-if="message.body" class="whitespace-pre-wrap break-words text-sm">{{ message.body }}</p>
          <footer class="mt-1 flex items-center justify-between gap-4 font-mono text-[11px] text-muted">
            <span>{{ message.object }}<template v-if="message.field"> · {{ message.field }}</template></span>
            <time :datetime="message.receivedAt">{{ formatTime(message.receivedAt) }}</time>
          </footer>
        </article>
      </section>
    </template>

    <template #footer>
      <section class="flex w-full items-center justify-between gap-3">
        <UBadge :label="connected ? 'Ouvindo' : 'Conectando'" :color="connected ? 'success' : 'warning'" variant="subtle" />
        <section class="flex gap-2">
          <UButton label="Limpar" color="neutral" variant="ghost" :disabled="!messages.length" @click="clear" />
          <UButton label="Fechar" color="neutral" variant="outline" @click="open = false" />
        </section>
      </section>
    </template>
  </UModal>
</template>

const MAX_EVENTS = 50

export interface WebhookTestMessage {
  key: number
  id: string
  object: string
  field: string | null
  type: string
  senderName: string | null
  senderId: string | null
  body: string | null
  receivedAt: string
}

export function useWebhookTest(appId: MaybeRefOrGetter<string>) {
  const toast = useToast()
  const connected = ref(false)
  const messages = ref<WebhookTestMessage[]>([])
  let source: EventSource | null = null
  let sequence = 0

  function stop() {
    source?.close()
    source = null
    connected.value = false
  }

  function onMessage(event: MessageEvent<string>) {
    const data = JSON.parse(event.data) as { kind: 'connected' | 'ping' | 'message' } & Partial<WebhookTestMessage>
    if (data.kind === 'connected') {
      connected.value = true
      return
    }
    if (data.kind !== 'message' || !data.id || !data.type || !data.receivedAt) return
    messages.value = [
      ...messages.value,
      {
        key: sequence++,
        id: data.id,
        object: data.object ?? 'unknown',
        field: data.field ?? null,
        type: data.type,
        senderName: data.senderName ?? null,
        senderId: data.senderId ?? null,
        body: data.body ?? null,
        receivedAt: data.receivedAt
      }
    ].slice(-MAX_EVENTS)
  }

  function onError() {
    if (source?.readyState === EventSource.CLOSED) {
      stop()
      toast.add({ title: 'Não foi possível iniciar o teste do webhook', color: 'error' })
      return
    }
    connected.value = false
  }

  function start() {
    stop()
    messages.value = []
    source = new EventSource(`/api/apps/${toValue(appId)}/webhook-test/stream`)
    source.onmessage = onMessage
    source.onerror = onError
  }

  function clear() {
    messages.value = []
  }

  onScopeDispose(stop)

  return { clear, connected, messages, start, stop }
}

const DEBOUNCE_MS = 400

/** Mantém a tela atualizada: o servidor avisa quando algo muda e `refresh` é chamado (agrupando rajadas). */
export function useLiveRefresh(refresh: () => Promise<unknown> | unknown) {
  const live = ref(false)
  let source: EventSource | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let reconnecting = false

  function schedule() {
    clearTimeout(timer)
    timer = setTimeout(() => void refresh(), DEBOUNCE_MS)
  }

  onMounted(() => {
    source = new EventSource('/api/live/stream')
    source.onmessage = (event) => {
      const { kind } = JSON.parse(event.data) as { kind: 'connected' | 'changed' | 'ping' }
      if (kind === 'connected') {
        live.value = true
        if (reconnecting) schedule()
        reconnecting = false
      } else if (kind === 'changed') {
        schedule()
      }
    }
    source.onerror = () => {
      live.value = false
      reconnecting = true
    }
  })

  onBeforeUnmount(() => {
    clearTimeout(timer)
    source?.close()
    source = null
  })

  return { live }
}

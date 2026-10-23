const HEARTBEAT_INTERVAL_MS = 25_000

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const stream = createEventStream(event)
  const send = (kind: 'connected' | 'changed' | 'ping') => void stream.push(JSON.stringify({ kind })).catch(() => {})
  const unsubscribe = subscribeHubChanges(() => send('changed'))
  const heartbeat = setInterval(() => send('ping'), HEARTBEAT_INTERVAL_MS)
  stream.onClosed(() => {
    clearInterval(heartbeat)
    unsubscribe()
  })

  void stream.push(JSON.stringify({ kind: 'connected' })).catch(() => {})
  return stream.send()
})

const HEARTBEAT_INTERVAL_MS = 25_000

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  if (!await prisma.app.findUnique({ where: { id }, select: { id: true } })) {
    throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  }

  const stream = createEventStream(event)
  const unsubscribe = subscribeWebhookTest(id, message => void stream.push(JSON.stringify({ kind: 'message', ...message })).catch(() => {}))
  const heartbeat = setInterval(() => void stream.push(JSON.stringify({ kind: 'ping' })).catch(() => {}), HEARTBEAT_INTERVAL_MS)
  stream.onClosed(() => {
    clearInterval(heartbeat)
    unsubscribe()
  })

  void stream.push(JSON.stringify({ kind: 'connected' })).catch(() => {})
  return stream.send()
})

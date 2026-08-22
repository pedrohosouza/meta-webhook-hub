export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const endpoint = await prisma.endpoint.findUnique({
    where: { id },
    select: { id: true, appId: true, url: true }
  })

  if (!endpoint) {
    throw createError({ statusCode: 404, statusMessage: 'Endpoint não encontrado' })
  }

  const payload = {
    object: 'meta_webhook_hub.test',
    test: true,
    sentAt: new Date().toISOString(),
    entry: [{ id: endpoint.appId, changes: [{ field: 'test', value: { message: 'Meta Webhook Hub test delivery' } }] }]
  }
  const startedAt = performance.now()
  let statusCode: number | null = null
  let responseBody: string | null = null

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'Meta-Webhook-Hub/1.0' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000)
    })
    statusCode = response.status
    responseBody = (await response.text()).slice(0, 50_000)
  } catch (error) {
    responseBody = error instanceof Error ? error.message : 'Falha desconhecida na entrega'
  }

  const executionTimeMs = Math.round(performance.now() - startedAt)
  await prisma.deliveryLog.create({
    data: {
      appId: endpoint.appId,
      endpointId: endpoint.id,
      eventPayload: payload,
      statusCode,
      responseBody,
      executionTimeMs
    }
  })

  return {
    ok: statusCode !== null && statusCode >= 200 && statusCode < 300,
    statusCode,
    executionTimeMs,
    error: statusCode === null ? responseBody : null
  }
})

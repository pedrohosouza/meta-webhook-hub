import { Worker } from 'bullmq'
import type { WebhookJob } from '../utils/queue'

const globalWorker = globalThis as unknown as { webhookWorker?: Worker<WebhookJob> }

function retentionDays() {
  const configured = Number(useRuntimeConfig().deliveryLogRetentionDays)
  return Number.isInteger(configured) && configured > 0 ? configured : 7
}

async function fanout(data: Extract<WebhookJob, { kind: 'fanout' }>) {
  const endpoints = await prisma.endpoint.findMany({
    where: { appId: data.appId, isActive: true },
    select: { id: true }
  })
  if (!endpoints.length) return

  await getWebhookQueue().addBulk(endpoints.map(endpoint => ({
    name: 'delivery',
    data: {
      kind: 'delivery' as const,
      appId: data.appId,
      endpointId: endpoint.id,
      payload: data.payload
    },
    opts: deliveryJobOptions
  })))
}

async function deliver(data: Extract<WebhookJob, { kind: 'delivery' }>, attemptCount: number) {
  const endpoint = await prisma.endpoint.findFirst({
    where: { id: data.endpointId, appId: data.appId, isActive: true },
    select: { url: true }
  })
  if (!endpoint) return

  const startedAt = performance.now()
  let statusCode: number | null = null
  let responseBody: string | null = null
  let retryableError: Error | null = null

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'Meta-Webhook-Hub/1.0' },
      body: JSON.stringify(data.payload),
      signal: AbortSignal.timeout(15_000)
    })
    statusCode = response.status
    responseBody = (await response.text()).slice(0, 50_000)
    if (response.status >= 500) retryableError = new Error(`Destino respondeu HTTP ${response.status}`)
  } catch (error) {
    responseBody = error instanceof Error ? error.message : 'Falha desconhecida na entrega'
    retryableError = error instanceof Error ? error : new Error(responseBody)
  }

  await prisma.deliveryLog.create({
    data: {
      appId: data.appId,
      endpointId: data.endpointId,
      eventPayload: data.payload,
      statusCode,
      responseBody,
      executionTimeMs: Math.round(performance.now() - startedAt),
      attemptCount
    }
  })

  if (retryableError) throw retryableError
}

async function removeExpiredLogs() {
  const days = retentionDays()
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const result = await prisma.deliveryLog.deleteMany({ where: { createdAt: { lt: cutoff } } })
  console.info(`[delivery-retention] ${result.count} registros removidos; retenção de ${days} dias`)
}

export default defineNitroPlugin(async (nitroApp) => {
  if (globalWorker.webhookWorker) return

  const queue = getWebhookQueue()
  await queue.upsertJobScheduler(
    'daily-delivery-log-retention',
    { pattern: '0 3 * * *' },
    { name: 'retention', data: { kind: 'retention' }, opts: { removeOnComplete: 10, removeOnFail: 50 } }
  )

  const connection = getRedisConnection().duplicate()
  globalWorker.webhookWorker = new Worker<WebhookJob>(WEBHOOK_QUEUE, async (job) => {
    if (job.data.kind === 'fanout') return fanout(job.data)
    if (job.data.kind === 'delivery') return deliver(job.data, job.attemptsMade + 1)
    return removeExpiredLogs()
  }, { connection, concurrency: 10 })

  globalWorker.webhookWorker.on('error', error => console.error('[webhook-worker]', error))
  nitroApp.hooks.hook('close', async () => {
    await globalWorker.webhookWorker?.close()
    await connection.quit()
    globalWorker.webhookWorker = undefined
  })
})

import { Worker } from 'bullmq'
import type { Prisma } from '../../generated/prisma/client'

const globalWorker = globalThis as unknown as { webhookWorker?: Worker }

export default defineNitroPlugin((nitroApp) => {
  if (globalWorker.webhookWorker) return

  const connection = getRedisConnection().duplicate()
  globalWorker.webhookWorker = new Worker<{ appId: string, payload: Prisma.InputJsonValue }>(
    WEBHOOK_QUEUE,
    async (job) => {
      const endpoints = await prisma.endpoint.findMany({ where: { appId: job.data.appId, isActive: true } })
      await Promise.all(endpoints.map(async (endpoint) => {
        const startedAt = performance.now()
        let statusCode: number | null = null
        let responseBody: string | null = null
        try {
          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'user-agent': 'Meta-Webhook-Hub/1.0' },
            body: JSON.stringify(job.data.payload),
            signal: AbortSignal.timeout(15_000)
          })
          statusCode = response.status
          responseBody = (await response.text()).slice(0, 50_000)
        } catch (error) {
          responseBody = error instanceof Error ? error.message : 'Falha desconhecida na entrega'
        }
        await prisma.deliveryLog.create({
          data: {
            appId: job.data.appId,
            endpointId: endpoint.id,
            eventPayload: job.data.payload,
            statusCode,
            responseBody,
            executionTimeMs: Math.round(performance.now() - startedAt)
          }
        })
      }))
    },
    { connection, concurrency: 10 }
  )

  globalWorker.webhookWorker.on('error', error => console.error('[webhook-worker]', error))
  nitroApp.hooks.hook('close', async () => {
    await globalWorker.webhookWorker?.close()
    globalWorker.webhookWorker = undefined
  })
})

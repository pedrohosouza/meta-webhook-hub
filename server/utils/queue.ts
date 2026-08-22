import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export const WEBHOOK_QUEUE = 'meta-webhook-deliveries'

const globalQueue = globalThis as unknown as {
  webhookQueue?: Queue
  queueConnection?: IORedis
}

export function getRedisConnection() {
  globalQueue.queueConnection ??= new IORedis(useRuntimeConfig().redisUrl, {
    maxRetriesPerRequest: null
  })
  return globalQueue.queueConnection
}

export function getWebhookQueue() {
  globalQueue.webhookQueue ??= new Queue(WEBHOOK_QUEUE, {
    connection: getRedisConnection(),
    defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 500, removeOnFail: 1000 }
  })
  return globalQueue.webhookQueue
}

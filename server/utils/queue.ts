import { Queue } from 'bullmq'
import type { Prisma } from '../../generated/prisma/client'
import IORedis from 'ioredis'

export const WEBHOOK_QUEUE = 'meta-webhook-deliveries'
export const DELIVERY_ATTEMPTS = 5
export const DELIVERY_BACKOFF_MS = 5_000

export interface MetaWebhookEnvelope {
  payload: Prisma.InputJsonValue
  rawBodyBase64: string
  signature: string
}

export type WebhookJob =
  | ({ kind: 'fanout', appId: string } & MetaWebhookEnvelope)
  | ({ kind: 'delivery', appId: string, endpointId: string } & MetaWebhookEnvelope)
  | { kind: 'retention' }

const globalQueue = globalThis as unknown as {
  webhookQueue?: Queue
  queueConnection?: IORedis
}

/** Prefixo das chaves do BullMQ no Redis; o BullMQ acrescenta o `:` e o nome da fila (ex.: `meta-webhook-hub:meta-webhook-deliveries:wait`). */
export function getQueuePrefix() {
  return useRuntimeConfig().redisPrefix.trim() || 'meta-webhook-hub'
}

export function getRedisConnection() {
  globalQueue.queueConnection ??= new IORedis(useRuntimeConfig().redisUrl, {
    maxRetriesPerRequest: null
  })
  return globalQueue.queueConnection
}

export function getWebhookQueue(): Queue<WebhookJob> {
  globalQueue.webhookQueue ??= new Queue<WebhookJob>(WEBHOOK_QUEUE, {
    connection: getRedisConnection(),
    prefix: getQueuePrefix(),
    defaultJobOptions: { removeOnComplete: 500, removeOnFail: 1000 }
  })
  return globalQueue.webhookQueue as Queue<WebhookJob>
}

export const deliveryJobOptions = {
  attempts: DELIVERY_ATTEMPTS,
  backoff: { type: 'exponential' as const, delay: DELIVERY_BACKOFF_MS },
  removeOnComplete: 500,
  removeOnFail: 1000
}

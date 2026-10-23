import { EventEmitter } from 'node:events'
import { summarizeMetaWebhook, type WebhookTestMessage } from './meta-webhook-summary'

export interface WebhookTestEvent extends WebhookTestMessage {
  receivedAt: string
}

const globalChannel = globalThis as unknown as { webhookTestChannel?: EventEmitter }

function channel() {
  globalChannel.webhookTestChannel ??= new EventEmitter().setMaxListeners(0)
  return globalChannel.webhookTestChannel
}

export function subscribeWebhookTest(appId: string, listener: (event: WebhookTestEvent) => void) {
  channel().on(appId, listener)
  return () => channel().off(appId, listener)
}

/** Publica o que chegou no ingress para quem estiver ouvindo o teste. Nunca interrompe o recebimento. */
export function publishWebhookTest(appId: string, payload: unknown) {
  try {
    if (!channel().listenerCount(appId)) return
    const receivedAt = new Date().toISOString()
    for (const message of summarizeMetaWebhook(payload)) channel().emit(appId, { ...message, receivedAt })
  } catch (error) {
    console.error('[webhook-test]', error)
  }
}

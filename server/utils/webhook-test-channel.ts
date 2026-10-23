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

const payloadChannel = (appId: string) => `${appId}:payload`

/** Entrega o payload bruto de cada webhook recebido; usado pelo editor de regras para escolher atributos. */
export function subscribeWebhookPayloads(appId: string, listener: (payload: unknown) => void) {
  channel().on(payloadChannel(appId), listener)
  return () => channel().off(payloadChannel(appId), listener)
}

export function subscribeWebhookTest(appId: string, listener: (event: WebhookTestEvent) => void) {
  channel().on(appId, listener)
  return () => channel().off(appId, listener)
}

/** Publica o que chegou no ingress para quem estiver ouvindo o teste. Nunca interrompe o recebimento. */
export function publishWebhookTest(appId: string, payload: unknown) {
  try {
    channel().emit(payloadChannel(appId), payload)
    if (!channel().listenerCount(appId)) return
    const receivedAt = new Date().toISOString()
    for (const message of summarizeMetaWebhook(payload)) channel().emit(appId, { ...message, receivedAt })
  } catch (error) {
    console.error('[webhook-test]', error)
  }
}

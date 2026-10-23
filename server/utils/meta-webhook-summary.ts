export interface WebhookTestMessage {
  id: string
  object: string
  field: string | null
  type: string
  senderName: string | null
  senderId: string | null
  body: string | null
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown) {
  return typeof value === 'string' && value ? value : null
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function pick(source: unknown, ...path: string[]) {
  let current: unknown = source
  for (const key of path) {
    if (!isRecord(current)) return null
    current = current[key]
  }
  return asString(current)
}

function whatsappBody(message: JsonRecord) {
  return pick(message, 'text', 'body')
    ?? pick(message, 'button', 'text')
    ?? pick(message, 'interactive', 'button_reply', 'title')
    ?? pick(message, 'interactive', 'list_reply', 'title')
    ?? pick(message, 'reaction', 'emoji')
    ?? ['image', 'video', 'document'].map(type => pick(message, type, 'caption')).find(Boolean)
    ?? null
}

/**
 * Resume um webhook da Meta em itens exibíveis. Sempre devolve ao menos um item,
 * para que qualquer chamada válida apareça no teste em tempo real.
 */
export function summarizeMetaWebhook(payload: unknown): WebhookTestMessage[] {
  if (!isRecord(payload)) return []
  const object = asString(payload.object) ?? 'unknown'
  const items: WebhookTestMessage[] = []
  let sequence = 0
  const nextId = (id: unknown) => asString(id) ?? `${object}-${Date.now()}-${sequence++}`

  for (const entry of records(payload.entry)) {
    for (const change of records(entry.changes)) {
      const field = asString(change.field)
      const value = isRecord(change.value) ? change.value : {}
      const contacts = records(value.contacts)

      for (const message of records(value.messages)) {
        const from = asString(message.from)
        const contact = contacts.find(item => item.wa_id === from) ?? contacts[0]
        items.push({
          id: nextId(message.id),
          object,
          field,
          type: asString(message.type) ?? 'unknown',
          senderName: pick(contact, 'profile', 'name'),
          senderId: from ?? pick(contact, 'wa_id'),
          body: whatsappBody(message)
        })
      }

      for (const status of records(value.statuses)) {
        items.push({
          id: nextId(status.id),
          object,
          field,
          type: 'status',
          senderName: null,
          senderId: asString(status.recipient_id),
          body: asString(status.status)
        })
      }
    }

    for (const messaging of records(entry.messaging)) {
      const message = isRecord(messaging.message) ? messaging.message : null
      const attachment = message ? records(message.attachments)[0] : undefined
      items.push({
        id: nextId(message?.mid),
        object,
        field: 'messaging',
        type: message ? (asString(attachment?.type) ?? 'text') : 'event',
        senderName: null,
        senderId: pick(messaging, 'sender', 'id'),
        body: message ? asString(message.text) : (pick(messaging, 'postback', 'title') ?? null)
      })
    }
  }

  if (!items.length) {
    const changeField = records(records(payload.entry)[0]?.changes)[0]?.field
    items.push({
      id: nextId(null),
      object,
      field: asString(changeField),
      type: 'event',
      senderName: null,
      senderId: null,
      body: null
    })
  }

  return items
}

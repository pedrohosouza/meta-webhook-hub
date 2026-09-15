const RFC3339_WITH_TIMEZONE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/i
const ISO_8601 = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/i

interface MetaWebhookLogger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
}

interface ProcessVerifiedMetaWebhookOptions {
  payload: unknown
  cutoff: number | null
  enqueue: () => Promise<void>
  logger?: MetaWebhookLogger
}

function isValidCalendarDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1) return false
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= daysPerMonth[month - 1]!
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseMetaEventTimestamp(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) return null
    const digits = String(value).length
    if (digits === 10) return value * 1_000
    if (digits === 13) return value
    return null
  }

  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (/^\d+$/.test(normalized)) {
    if (normalized.length === 10) return Number(normalized) * 1_000
    if (normalized.length === 13) return Number(normalized)
    return null
  }

  const isoMatch = ISO_8601.exec(normalized)
  if (!isoMatch) return null
  const [, year, month, day] = isoMatch
  if (!isValidCalendarDate(Number(year), Number(month), Number(day))) return null

  const timestamp = Date.parse(normalized)
  return Number.isFinite(timestamp) ? timestamp : null
}

function collectTimestamp(target: number[], value: unknown) {
  const timestamp = parseMetaEventTimestamp(value)
  if (timestamp !== null) target.push(timestamp)
}

export function parseMetaEventsBefore(value: unknown): number | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') {
    throw new Error('NUXT_IGNORE_META_EVENTS_BEFORE deve ser uma data RFC 3339 com timezone')
  }

  const normalized = value.trim()
  if (!normalized) return null

  const match = RFC3339_WITH_TIMEZONE.exec(normalized)
  if (!match) {
    throw new Error('NUXT_IGNORE_META_EVENTS_BEFORE deve usar o formato RFC 3339 com timezone (ex.: 2026-09-14T14:30:00-04:00)')
  }

  const [, year, month, day, hour, minute, second, timezone] = match
  const timezoneParts = timezone?.match(/^[+-](\d{2}):(\d{2})$/)
  const validTimezone = !timezoneParts || (Number(timezoneParts[1]) <= 23 && Number(timezoneParts[2]) <= 59)
  const validComponents = isValidCalendarDate(Number(year), Number(month), Number(day))
    && Number(hour) <= 23
    && Number(minute) <= 59
    && Number(second) <= 59
    && validTimezone
  const timestamp = Date.parse(normalized)

  if (!validComponents || !Number.isFinite(timestamp)) {
    throw new Error('NUXT_IGNORE_META_EVENTS_BEFORE contém uma data, horário ou timezone inválido')
  }

  return timestamp
}

export function extractMetaEventTimestamps(payload: unknown): number[] {
  if (!isRecord(payload) || !Array.isArray(payload.entry)) return []

  const timestamps: number[] = []
  for (const entry of payload.entry) {
    if (!isRecord(entry)) continue
    collectTimestamp(timestamps, entry.time)

    if (Array.isArray(entry.messaging)) {
      for (const messaging of entry.messaging) {
        if (isRecord(messaging)) collectTimestamp(timestamps, messaging.timestamp)
      }
    }

    if (!Array.isArray(entry.changes)) continue
    for (const change of entry.changes) {
      if (!isRecord(change) || !isRecord(change.value)) continue
      for (const collectionName of ['messages', 'statuses'] as const) {
        const collection = change.value[collectionName]
        if (!Array.isArray(collection)) continue
        for (const item of collection) {
          if (isRecord(item)) collectTimestamp(timestamps, item.timestamp)
        }
      }
    }
  }

  return timestamps
}

export async function processVerifiedMetaWebhook({
  payload,
  cutoff,
  enqueue,
  logger = console
}: ProcessVerifiedMetaWebhookOptions): Promise<Response | null> {
  if (cutoff === null) {
    await enqueue()
    return null
  }

  const timestamps = extractMetaEventTimestamps(payload)
  if (timestamps.length === 0) {
    logger.warn('Meta webhook recebido sem timestamp reconhecido')
    await enqueue()
    return null
  }

  if (timestamps.every(timestamp => timestamp < cutoff)) {
    logger.info({
      event: 'meta_webhook_ignored_before_cutoff',
      cutoff: new Date(cutoff).toISOString(),
      timestamps: timestamps.map(timestamp => new Date(timestamp).toISOString())
    })
    return new Response('EVENT_IGNORED', { status: 200 })
  }

  await enqueue()
  return null
}

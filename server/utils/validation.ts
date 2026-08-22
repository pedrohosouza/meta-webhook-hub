export function requiredString(value: unknown, field: string, minLength = 1) {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw createError({ statusCode: 422, statusMessage: `${field} inválido` })
  }
  return value.trim()
}

export function validUrl(value: unknown) {
  const raw = requiredString(value, 'URL')
  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
    return url.toString()
  } catch {
    throw createError({ statusCode: 422, statusMessage: 'URL HTTP(S) inválida' })
  }
}

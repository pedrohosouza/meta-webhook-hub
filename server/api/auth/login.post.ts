import { createHash, timingSafeEqual } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.authenticationApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'AUTHENTICATION_API_KEY não configurada' })
  }
  const body = await readBody(event)
  const apiKey = requiredString(body?.apiKey, 'API key')
  const provided = createHash('sha256').update(apiKey).digest()
  const expected = createHash('sha256').update(config.authenticationApiKey).digest()

  if (!timingSafeEqual(provided, expected)) {
    throw createError({ statusCode: 401, statusMessage: 'API key inválida' })
  }
  const session = await getAuthSession(event)
  await session.update({ apiKeyHash: expected.toString('hex') })
  return { authenticated: true }
})

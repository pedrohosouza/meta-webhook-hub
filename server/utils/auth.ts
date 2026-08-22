import type { H3Event } from 'h3'
import { createHash } from 'node:crypto'

const sessionOptions = {
  name: 'meta-webhook-hub',
  maxAge: 60 * 60 * 24 * 7,
  cookie: { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production' }
}

export async function getAuthSession(event: H3Event) {
  const sessionPassword = getAuthenticationApiKeyHash(event)
  if (!sessionPassword) {
    throw createError({ statusCode: 500, statusMessage: 'AUTHENTICATION_API_KEY não configurada' })
  }
  return useSession<{ apiKeyHash?: string }>(event, {
    ...sessionOptions,
    password: sessionPassword
  })
}

export async function requireAuth(event: H3Event) {
  const session = await getAuthSession(event)
  if (!isAuthSessionValid(event, session.data.apiKeyHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  }
  return true
}

export function getAuthenticationApiKeyHash(event: H3Event) {
  const apiKey = useRuntimeConfig(event).authenticationApiKey
  return apiKey ? createHash('sha256').update(apiKey).digest('hex') : null
}

export function isAuthSessionValid(event: H3Event, apiKeyHash?: string) {
  const configuredHash = getAuthenticationApiKeyHash(event)
  return Boolean(configuredHash && apiKeyHash === configuredHash)
}

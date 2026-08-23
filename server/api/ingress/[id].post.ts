import { createHmac, timingSafeEqual } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const appId = getRouterParam(event, 'id')!
  const app = await prisma.app.findUnique({ where: { id: appId }, select: { appSecret: true } })
  if (!app) throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })

  const signature = getHeader(event, 'x-hub-signature-256')
  const rawBody = await readRawBody(event, false)
  if (!signature || !rawBody) throw createError({ statusCode: 401, statusMessage: 'Assinatura ausente' })

  const expected = `sha256=${createHmac('sha256', decryptSecret(app.appSecret)).update(rawBody).digest('hex')}`
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw createError({ statusCode: 403, statusMessage: 'Assinatura inválida' })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody.toString('utf8'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Payload JSON inválido' })
  }

  await getWebhookQueue().add('fanout', { appId, payload })
  setResponseStatus(event, 200)
  return { received: true }
})

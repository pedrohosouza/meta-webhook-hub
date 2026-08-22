export default defineEventHandler(async (event) => {
  const app = await prisma.app.findUnique({ where: { id: getRouterParam(event, 'id')! }, select: { verifyToken: true } })
  if (!app) throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  const query = getQuery(event)
  if (query['hub.mode'] !== 'subscribe' || query['hub.verify_token'] !== app.verifyToken) {
    throw createError({ statusCode: 403, statusMessage: 'Verify token inválido' })
  }
  const challenge = query['hub.challenge']
  if (typeof challenge !== 'string') throw createError({ statusCode: 400, statusMessage: 'Challenge ausente' })
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return challenge
})

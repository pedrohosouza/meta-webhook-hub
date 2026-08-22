export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const log = await prisma.deliveryLog.findUnique({ where: { id }, include: { app: { select: { name: true } }, endpoint: { select: { url: true } } } })
  if (!log) throw createError({ statusCode: 404, statusMessage: 'Log não encontrado' })
  return log
})

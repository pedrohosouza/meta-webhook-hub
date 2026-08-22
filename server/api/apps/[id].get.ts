export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const app = await prisma.app.findUnique({ where: { id }, include: { endpoints: { orderBy: { createdAt: 'asc' } } } })
  if (!app) throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  return app
})

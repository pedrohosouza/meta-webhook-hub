export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const app = await prisma.app.findUnique({
    where: { id },
    select: {
      id: true, name: true, verifyToken: true, createdAt: true, updatedAt: true,
      endpoints: { orderBy: { createdAt: 'asc' } }
    }
  })
  if (!app) throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  return app
})

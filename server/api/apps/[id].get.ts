export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const app = await prisma.app.findUnique({
    where: { id },
    select: {
      id: true, name: true, verifyToken: true, appSecret: true, createdAt: true, updatedAt: true,
      endpoints: { orderBy: { createdAt: 'asc' } },
      rules: { orderBy: { createdAt: 'asc' }, select: { id: true, name: true, matchMode: true, conditions: true } }
    }
  })
  if (!app) throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  return { ...app, appSecret: decryptSecret(app.appSecret) }
})

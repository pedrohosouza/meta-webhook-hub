export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const exists = await prisma.app.findUnique({ where: { id }, select: { id: true } })
  if (!exists) throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  return prisma.app.update({
    where: { id },
    data: {
      name: requiredString(body?.name, 'Nome'),
      appSecret: requiredString(body?.appSecret, 'App Secret'),
      verifyToken: requiredString(body?.verifyToken, 'Verify Token')
    }
  })
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const exists = await prisma.app.findUnique({ where: { id }, select: { id: true } })
  if (!exists) throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  const appSecret = typeof body?.appSecret === 'string' && body.appSecret.trim()
    ? encryptSecret(body.appSecret.trim())
    : undefined
  return prisma.app.update({
    where: { id },
    data: {
      name: requiredString(body?.name, 'Nome'),
      ...(appSecret ? { appSecret } : {}),
      verifyToken: requiredString(body?.verifyToken, 'Verify Token')
    },
    select: { id: true, name: true, verifyToken: true, createdAt: true, updatedAt: true }
  })
})

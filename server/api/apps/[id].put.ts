export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const exists = await prisma.app.findUnique({ where: { id }, select: { id: true } })
  if (!exists) throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  const appSecret = typeof body?.appSecret === 'string' && body.appSecret.trim()
    ? encryptSecret(body.appSecret.trim())
    : undefined
  try {
    return await prisma.app.update({
      where: { id },
      data: {
        name: requiredString(body?.name, 'Nome'),
        ...(appSecret ? { appSecret } : {}),
        verifyToken: requiredString(body?.verifyToken, 'Verify Token')
      },
      select: { id: true, name: true, verifyToken: true, createdAt: true, updatedAt: true }
    })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Já existe um app com este nome' })
    }
    throw error
  }
})

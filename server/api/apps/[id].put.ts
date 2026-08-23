export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const exists = await prisma.app.findUnique({ where: { id }, select: { id: true } })
  if (!exists) throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  if (body && Object.prototype.hasOwnProperty.call(body, 'appSecret')) {
    throw createError({ statusCode: 400, statusMessage: 'O App Secret não pode ser alterado' })
  }
  if (body && Object.prototype.hasOwnProperty.call(body, 'verifyToken')) {
    throw createError({ statusCode: 400, statusMessage: 'O Verify Token não pode ser alterado' })
  }
  try {
    return await prisma.app.update({
      where: { id },
      data: {
        name: requiredString(body?.name, 'Nome')
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

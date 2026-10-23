export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!await prisma.endpoint.findUnique({ where: { id }, select: { id: true } })) {
    throw createError({ statusCode: 404, statusMessage: 'Endpoint não encontrado' })
  }
  try {
    return await prisma.endpoint.update({
      where: { id },
      data: {
        ...(body?.url !== undefined ? { url: validUrl(body.url) } : {}),
        ...(typeof body?.isActive === 'boolean' ? { isActive: body.isActive } : {})
      }
    })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Este destino já está cadastrado neste app' })
    }
    throw error
  }
})

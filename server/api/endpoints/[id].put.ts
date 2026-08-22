export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!await prisma.endpoint.findUnique({ where: { id }, select: { id: true } })) {
    throw createError({ statusCode: 404, statusMessage: 'Endpoint não encontrado' })
  }
  return prisma.endpoint.update({
    where: { id },
    data: {
      ...(body?.url !== undefined ? { url: validUrl(body.url) } : {}),
      ...(typeof body?.isActive === 'boolean' ? { isActive: body.isActive } : {})
    }
  })
})

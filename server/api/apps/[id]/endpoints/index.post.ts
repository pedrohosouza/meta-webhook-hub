export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const appId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!await prisma.app.findUnique({ where: { id: appId }, select: { id: true } })) {
    throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  }
  return prisma.endpoint.create({ data: { appId, url: validUrl(body?.url), isActive: body?.isActive !== false } })
})

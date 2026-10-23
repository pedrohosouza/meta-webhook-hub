export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const appId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!await prisma.app.findUnique({ where: { id: appId }, select: { id: true } })) {
    throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  }
  try {
    const url = validUrl(body?.url)
    const created = await prisma.$transaction(async tx => tx.endpoint.create({
      data: { appId, url, isActive: body?.isActive !== false, ...await resolveEndpointRule(tx, appId, body) }
    }))
    notifyHubChange()
    return created
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Este destino já está cadastrado neste app' })
    }
    throw error
  }
})

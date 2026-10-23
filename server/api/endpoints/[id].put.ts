export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const current = await prisma.endpoint.findUnique({ where: { id }, select: { appId: true } })
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Endpoint não encontrado' })
  try {
    const url = body?.url !== undefined ? validUrl(body.url) : undefined
    const updated = await prisma.$transaction(async tx => tx.endpoint.update({
      where: { id },
      data: {
        ...(url ? { url } : {}),
        ...(typeof body?.isActive === 'boolean' ? { isActive: body.isActive } : {}),
        ...await resolveEndpointRule(tx, current.appId, body)
      }
    }))
    notifyHubChange()
    return updated
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Este destino já está cadastrado neste app' })
    }
    throw error
  }
})

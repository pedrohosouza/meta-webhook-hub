export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const appId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  if (!await prisma.app.findUnique({ where: { id: appId }, select: { id: true } })) {
    throw createError({ statusCode: 404, statusMessage: 'App não encontrado' })
  }

  const fields = parseRuleFields(body, { partial: false })
  const endpointIds = await validEndpointIds(appId, body?.endpointIds ?? [])
  const created = await prisma.routingRule.create({
    data: { appId, ...fields, endpoints: { connect: endpointIds.map(id => ({ id })) } } as Parameters<typeof prisma.routingRule.create>[0]['data']
  })
  notifyHubChange()
  return created
})

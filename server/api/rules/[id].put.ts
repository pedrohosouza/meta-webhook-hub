export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const rule = await prisma.routingRule.findUnique({ where: { id }, select: { appId: true } })
  if (!rule) throw createError({ statusCode: 404, statusMessage: 'Regra não encontrada' })

  const fields = parseRuleFields(body, { partial: true })
  const endpointIds = body?.endpointIds !== undefined ? await validEndpointIds(rule.appId, body.endpointIds) : null

  // `endpointIds` define o conjunto final: quem sai da lista volta a receber tudo.
  const updated = await prisma.routingRule.update({
    where: { id },
    data: { ...fields, ...(endpointIds ? { endpoints: { set: endpointIds.map(endpointId => ({ id: endpointId })) } } : {}) } as Parameters<typeof prisma.routingRule.update>[0]['data']
  })
  notifyHubChange()
  return updated
})

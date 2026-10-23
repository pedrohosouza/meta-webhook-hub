export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  // Os destinos da regra ficam sem regra e voltam a receber todos os eventos (onDelete: SetNull).
  const result = await prisma.routingRule.deleteMany({ where: { id } })
  if (!result.count) throw createError({ statusCode: 404, statusMessage: 'Regra não encontrada' })
  notifyHubChange()
  return { ok: true }
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const result = await prisma.endpoint.deleteMany({ where: { id } })
  if (!result.count) throw createError({ statusCode: 404, statusMessage: 'Endpoint não encontrado' })
  return { ok: true }
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  return prisma.app.findMany({
    select: { id: true, name: true, verifyToken: true, createdAt: true, updatedAt: true, _count: { select: { endpoints: true, deliveries: true } } },
    orderBy: { createdAt: 'desc' }
  })
})

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10))
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 200) : ''
  const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {}
  const [items, total, totalEndpoints, totalDeliveries] = await prisma.$transaction([
    prisma.app.findMany({
      where,
      select: { id: true, name: true, verifyToken: true, createdAt: true, updatedAt: true, _count: { select: { endpoints: true, deliveries: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.app.count({ where }),
    prisma.endpoint.count(),
    prisma.deliveryLog.count()
  ])

  return {
    items,
    total,
    totalEndpoints,
    totalDeliveries,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize))
  }
})

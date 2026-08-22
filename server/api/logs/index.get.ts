export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
  const where = typeof query.appId === 'string' && query.appId ? { appId: query.appId } : {}
  const [items, total] = await prisma.$transaction([
    prisma.deliveryLog.findMany({
      where,
      include: { app: { select: { name: true } }, endpoint: { select: { url: true } } },
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize
    }),
    prisma.deliveryLog.count({ where })
  ])
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) }
})

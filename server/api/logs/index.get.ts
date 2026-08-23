export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
  const appId = typeof query.appId === 'string' ? query.appId : ''
  const status = typeof query.status === 'string' ? query.status : ''
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 200) : ''
  const attempt = Math.max(0, Number(query.attempt) || 0)
  const where = {
    ...(appId ? { appId } : {}),
    ...(status === 'success' ? { statusCode: { gte: 200, lt: 300 } } : {}),
    ...(status === 'http_error' ? { OR: [{ statusCode: { lt: 200 } }, { statusCode: { gte: 300 } }] } : {}),
    ...(status === 'connection_error' ? { statusCode: null } : {}),
    ...(search ? { endpoint: { url: { contains: search, mode: 'insensitive' as const } } } : {}),
    ...(attempt ? { attemptCount: attempt } : {})
  }
  const [items, total] = await prisma.$transaction([
    prisma.deliveryLog.findMany({
      where,
      select: {
        id: true, statusCode: true, executionTimeMs: true, attemptCount: true, createdAt: true,
        app: { select: { name: true } }, endpoint: { select: { url: true } }
      },
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize
    }),
    prisma.deliveryLog.count({ where })
  ])
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) }
})

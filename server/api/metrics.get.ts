type DailyMetric = {
  day: Date
  total: bigint
  success: bigint
  failed: bigint
  averageLatencyMs: number | null
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const [summary, daily, success] = await Promise.all([
    prisma.deliveryLog.aggregate({ _count: true, _avg: { executionTimeMs: true } }),
    prisma.$queryRaw<DailyMetric[]>`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', NOW()) - interval '6 days',
          date_trunc('day', NOW()),
          interval '1 day'
        ) AS day
      )
      SELECT
        days.day,
        COUNT(logs.id)::bigint AS total,
        COUNT(logs.id) FILTER (WHERE logs."statusCode" BETWEEN 200 AND 299)::bigint AS success,
        COUNT(logs.id) FILTER (WHERE logs."statusCode" IS NULL OR logs."statusCode" NOT BETWEEN 200 AND 299)::bigint AS failed,
        AVG(logs."executionTimeMs")::float AS "averageLatencyMs"
      FROM days
      LEFT JOIN delivery_logs logs
        ON logs."createdAt" >= days.day
       AND logs."createdAt" < days.day + interval '1 day'
      GROUP BY days.day
      ORDER BY days.day ASC
    `,
    prisma.deliveryLog.count({ where: { statusCode: { gte: 200, lt: 300 } } })
  ])

  const total = summary._count
  return {
    summary: {
      total,
      success,
      failed: total - success,
      successRate: total ? Math.round((success / total) * 10_000) / 100 : 0,
      averageLatencyMs: Math.round(summary._avg.executionTimeMs || 0)
    },
    daily: daily.map(item => ({
      date: item.day.toISOString(),
      total: Number(item.total),
      success: Number(item.success),
      failed: Number(item.failed),
      averageLatencyMs: Math.round(item.averageLatencyMs || 0)
    }))
  }
})

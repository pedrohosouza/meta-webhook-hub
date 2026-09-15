const HEALTH_CHECK_TIMEOUT_MS = 3_000

type HealthStatus = 'up' | 'down'

async function checkDependency(check: () => Promise<unknown>): Promise<HealthStatus> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      Promise.resolve().then(check).then(() => 'up' as const).catch(() => 'down' as const),
      new Promise<'down'>(resolve => {
        timeout = setTimeout(() => resolve('down'), HEALTH_CHECK_TIMEOUT_MS)
      })
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')

  const [database, redis] = await Promise.all([
    checkDependency(() => prisma.$queryRaw`SELECT 1`),
    checkDependency(() => getRedisConnection().ping())
  ])
  const status = database === 'up' && redis === 'up' ? 'ok' : 'error'

  setResponseStatus(event, status === 'ok' ? 200 : 503)
  return {
    status,
    checks: { database, redis }
  }
})

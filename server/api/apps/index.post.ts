import { randomBytes } from 'node:crypto'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const body = await readBody(event)
  return prisma.app.create({
    data: {
      name: requiredString(body?.name, 'Nome'),
      appSecret: encryptSecret(requiredString(body?.appSecret, 'App Secret')),
      verifyToken: typeof body?.verifyToken === 'string' && body.verifyToken.trim()
        ? body.verifyToken.trim()
        : randomBytes(24).toString('hex')
    },
    select: { id: true, name: true, verifyToken: true, createdAt: true }
  })
})

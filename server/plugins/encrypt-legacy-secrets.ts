export default defineNitroPlugin(async () => {
  const apps = await prisma.app.findMany({ select: { id: true, appSecret: true } })
  const legacyApps = apps.filter(app => !isEncryptedSecret(app.appSecret))
  if (!legacyApps.length) return

  await prisma.$transaction(legacyApps.map(app => prisma.app.update({
    where: { id: app.id },
    data: { appSecret: encryptSecret(app.appSecret) }
  })))
})

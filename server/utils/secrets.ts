import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const PREFIX = 'enc:v1'

function encryptionKey() {
  const secret = useRuntimeConfig().appEncryptionKey
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('NUXT_APP_ENCRYPTION_KEY deve conter pelo menos 32 caracteres')
  }
  return createHash('sha256').update(secret).digest()
}

export function isEncryptedSecret(value: string) {
  return value.startsWith(`${PREFIX}:`)
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return [PREFIX, iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join(':')
}

export function decryptSecret(value: string) {
  if (!isEncryptedSecret(value)) return value
  const [, , encodedIv, encodedTag, encodedValue] = value.split(':')
  if (!encodedIv || !encodedTag || !encodedValue) throw new Error('App Secret criptografado inválido')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(encodedIv, 'base64url'))
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encodedValue, 'base64url')), decipher.final()]).toString('utf8')
}

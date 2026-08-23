export default defineNuxtConfig({
  compatibilityDate: '2026-08-22',
  devtools: { enabled: false },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  vite: {
    server: {
      allowedHosts: ['.trycloudflare.com']
    }
  },
  icon: {
    serverBundle: {
      collections: ['lucide']
    },
    clientBundle: {
      scan: true,
      sizeLimitKb: 128
    }
  },
  runtimeConfig: {
    authenticationApiKey: process.env.AUTHENTICATION_API_KEY,
    appEncryptionKey: process.env.NUXT_APP_ENCRYPTION_KEY,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    deliveryLogRetentionDays: process.env.DELIVERY_LOG_RETENTION_DAYS || '7',
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    }
  }
})

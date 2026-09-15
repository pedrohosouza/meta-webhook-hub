export default defineNuxtConfig({
  compatibilityDate: '2026-08-22',
  devtools: { enabled: false },
  app: {
    head: {
      title: 'Meta Webhook Hub',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
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
    databaseUrl: '',
    authenticationApiKey: '',
    appEncryptionKey: '',
    redisUrl: 'redis://localhost:6379',
    deliveryLogRetentionDays: '7',
    ignoreMetaEventsBefore: '',
    public: {
      baseUrl: 'http://localhost:3000'
    }
  }
})

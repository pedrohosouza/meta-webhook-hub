<script setup lang="ts">
definePageMeta({ layout: false })
const toast = useToast()
const saving = ref(false)
const apiKey = ref('')

async function submit() {
  saving.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { apiKey: apiKey.value } })
    await navigateTo('/')
  } catch (error: any) {
    toast.add({ title: 'Não foi possível entrar', description: error.data?.statusMessage, color: 'error' })
  } finally { saving.value = false }
}
</script>

<template>
  <main class="grid min-h-[100dvh] bg-default lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
    <section class="relative hidden overflow-hidden border-r border-default bg-elevated lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div class="surface-grid absolute inset-0 opacity-40" />
      <header class="relative flex items-center gap-3">
        <span class="flex size-10 items-center justify-center rounded-xl bg-primary text-inverted"><UIcon name="i-lucide-waypoints" class="size-5" /></span>
        <strong class="text-sm tracking-tight">Meta Webhook Hub</strong>
      </header>
      <section class="relative max-w-2xl">
        <p class="mb-5 font-mono text-xs text-primary">EVENT ROUTING INFRASTRUCTURE</p>
        <h1 class="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-0.045em] xl:text-6xl">Uma entrada.<br>Toda a sua operação.</h1>
        <p class="mt-6 max-w-lg text-base leading-relaxed text-muted">Receba eventos da Meta, valide cada assinatura e distribua para todos os seus serviços em segundos.</p>
      </section>
      <footer class="relative flex items-center gap-6 font-mono text-[11px] text-muted">
        <span class="flex items-center gap-2"><UIcon name="i-lucide-shield-check" class="size-4 text-primary" /> HMAC-SHA256</span>
        <span class="flex items-center gap-2"><UIcon name="i-lucide-layers-3" class="size-4 text-primary" /> ASYNC FANOUT</span>
      </footer>
    </section>

    <section class="flex items-center justify-center p-5 sm:p-10">
      <section class="w-full max-w-md">
        <header class="mb-10">
          <span class="mb-8 flex size-11 items-center justify-center rounded-xl bg-primary text-inverted lg:hidden"><UIcon name="i-lucide-waypoints" class="size-5" /></span>
          <h2 class="text-3xl font-semibold tracking-[-0.035em]">Acesse o console</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">Use a chave definida em <code class="rounded bg-elevated px-1.5 py-1 text-xs text-default">AUTHENTICATION_API_KEY</code>.</p>
        </header>
        <form class="flex flex-col gap-5" @submit.prevent="submit">
          <UFormField label="API key" required>
            <UInput v-model="apiKey" type="password" size="xl" icon="i-lucide-key-round" class="w-full" autofocus autocomplete="current-password" placeholder="Cole sua chave de acesso" />
          </UFormField>
          <UButton type="submit" label="Entrar no console" trailing-icon="i-lucide-arrow-right" size="xl" block :loading="saving" />
        </form>
        <footer class="mt-8 flex items-center gap-2 text-xs text-muted">
          <UIcon name="i-lucide-lock-keyhole" class="size-4" />
          A chave é validada somente no servidor.
        </footer>
      </section>
    </section>
  </main>
</template>

export default defineNuxtRouteMiddleware(async (to) => {
  const requestFetch = useRequestFetch()
  const status = await requestFetch('/api/auth/status')

  if (!status.authenticated && to.path !== '/login') return navigateTo('/login')
  if (status.authenticated && to.path === '/login') return navigateTo('/')
})

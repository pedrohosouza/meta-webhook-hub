export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event)
  return { authenticated: isAuthSessionValid(event, session.data.apiKeyHash) }
})

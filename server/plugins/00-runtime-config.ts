export default defineNitroPlugin(() => {
  parseMetaEventsBefore(useRuntimeConfig().ignoreMetaEventsBefore)
})

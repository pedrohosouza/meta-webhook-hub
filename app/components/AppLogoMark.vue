<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :aria-hidden="title ? undefined : 'true'"
    :aria-label="title"
    role="img"
  >
    <path
      d="M11 16H6.5M20.25 11.25l3.2-3.2M20.25 20.75l3.2 3.2"
      stroke="currentColor"
      stroke-width="2.75"
      stroke-linecap="round"
    />
    <circle cx="15.75" cy="16" r="5" stroke="currentColor" stroke-width="2.75" />
    <circle cx="5" cy="16" r="2.5" fill="currentColor" />
    <circle cx="25" cy="6.5" r="2.5" fill="currentColor" />
    <circle cx="25" cy="25.5" r="2.5" fill="currentColor" />
    <circle cx="15.75" cy="16" r="1.75" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: 'play' | 'pause' | 'mic' | 'minus' | 'plus' | 'sun' | 'rotate' | 'home' | 'bolt' | 'pie' }>()
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path v-if="name === 'play'" d="M7 4.5v15l12-7.5z" fill="currentColor" />
    <g v-else-if="name === 'pause'" fill="currentColor" stroke="none">
      <rect x="6" y="4.5" width="4" height="15" rx="1" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" />
    </g>
    <g v-else-if="name === 'mic'">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </g>
    <path v-else-if="name === 'minus'" d="M5 12h14" />
    <path v-else-if="name === 'plus'" d="M12 5v14M5 12h14" />
    <g v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </g>
    <path v-else-if="name === 'rotate'" d="M3 12a9 9 0 1 0 2.6-6.4M3 4v5h5" />
    <path v-else-if="name === 'home'" d="M3 11l9-7 9 7v8a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z" fill="currentColor" fill-opacity="0.15" />
    <path v-else-if="name === 'bolt'" d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" fill-opacity="0.15" />
    <g v-else-if="name === 'pie'">
      <path d="M21 12a9 9 0 1 1-9-9v9z" fill="currentColor" fill-opacity="0.15" />
      <path d="M15 3.5A9 9 0 0 1 20.5 9H15z" />
    </g>
  </svg>
</template>

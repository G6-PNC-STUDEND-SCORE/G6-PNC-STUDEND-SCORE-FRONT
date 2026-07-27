<template>
  <div class="loading-state text-center py-5">
    <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem;">
      <span class="visually-hidden">{{ message }}</span>
    </div>
    <p class="mt-2 loading-text">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), { message: 'Loading...' })
</script>

<style scoped>
.loading-text { color: #6b7280; }
</style>

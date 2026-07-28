<template>
  <div class="loading-state text-center py-5">
    <div class="loading-spinner-wrap">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring spinner-ring-inner"></div>
      </div>
    </div>
    <p class="loading-text">{{ message }}</p>
    <p class="loading-subtext" v-if="subtext">{{ subtext }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
  subtext?: string
}>(), {
  message: 'Loading...',
  subtext: '',
})
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem !important;
  gap: 1rem;
}

.loading-spinner-wrap {
  position: relative;
  width: 48px;
  height: 48px;
}

.loading-spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: var(--color-primary);
  border-right-color: var(--color-primary);
  animation: spin 0.8s linear infinite;
}

.spinner-ring-inner {
  inset: 6px;
  border-width: 2px;
  border-top-color: var(--color-info);
  border-right-color: transparent;
  animation-duration: 0.6s;
  animation-direction: reverse;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin: 0;
  animation: pulse-text 1.5s ease-in-out infinite;
}

.loading-subtext {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>

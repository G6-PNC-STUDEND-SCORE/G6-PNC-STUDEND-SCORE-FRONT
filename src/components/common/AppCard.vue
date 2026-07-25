<template>
  <div :class="['app-card', { 'dark-mode': isDark }, sizeClass]">
    <div v-if="title || $slots.header" class="app-card-header">
      <slot name="header">
        <h3 class="app-card-title">{{ title }}</h3>
      </slot>
    </div>
    <div class="app-card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="app-card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const props = withDefaults(
  defineProps<{
    title?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    title: '',
    size: 'md',
  },
)

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const sizeClass = computed(() => `card-${props.size}`)
</script>

<style scoped>
.app-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.app-card.dark-mode {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.app-card-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #eef2f7;
}

.dark-mode .app-card-header {
  border-bottom-color: #334155;
}

.app-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.dark-mode .app-card-title {
  color: #f1f5f9;
}

.app-card-body {
  padding: 1rem 1.25rem;
}

.app-card-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #eef2f7;
}

.dark-mode .app-card-footer {
  border-top-color: #334155;
}

.card-sm .app-card-body {
  padding: 0.75rem;
}

.card-lg .app-card-body {
  padding: 1.5rem;
}
</style>

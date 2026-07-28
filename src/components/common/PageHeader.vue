<template>
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-header-icon" :class="iconClass">
        <component :is="icon" :size="22" />
      </div>
      <div>
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <div class="page-header-actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    icon: Component
    iconClass?: string
  }>(),
  {
    subtitle: '',
    iconClass: '',
  },
)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.page-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0.15rem 0 0;
  line-height: 1.3;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1rem;
  }
  .page-header-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
  .page-header-icon :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .page-header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>

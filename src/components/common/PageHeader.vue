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

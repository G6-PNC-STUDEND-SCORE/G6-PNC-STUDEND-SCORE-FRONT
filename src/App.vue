<template>
  <div id="app">
    <router-view />
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue'
import Toast from '@/components/Toast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()

/** Root-level theme flag so any page/component can dark-mode itself with
 * `:root[data-theme="dark"] .foo { ... }` — no per-component wiring needed. */
watchEffect(() => {
  document.documentElement.dataset.theme = theme.isDark ? 'dark' : 'light'
})
</script>

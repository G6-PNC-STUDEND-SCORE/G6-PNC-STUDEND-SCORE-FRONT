<template>
  <div id="app">
    <router-view />
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import Toast from '@/components/Toast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const theme = useThemeStore()

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

onMounted(() => {
  applyTheme(theme.isDark)
})

watch(() => theme.isDark, (val) => {
  applyTheme(val)
})
</script>

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') === 'dark')

  function applyTheme(val: boolean) {
    document.documentElement.classList.toggle('dark-mode', val)
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  // Apply on init
  applyTheme(isDark.value)

  watch(isDark, (val) => {
    localStorage.setItem('theme', val ? 'dark' : 'light')
    applyTheme(val)
  })

  return {
    isDark,
    toggle,
  }
})

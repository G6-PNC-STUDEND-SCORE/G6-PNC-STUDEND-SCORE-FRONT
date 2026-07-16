import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  const collapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')

  const SIDEBAR_WIDTH = 240
  const SIDEBAR_COLLAPSED_WIDTH = 72

  function toggle() {
    collapsed.value = !collapsed.value
  }

  function setCollapsed(val: boolean) {
    collapsed.value = val
  }

  watch(collapsed, (val) => {
    localStorage.setItem('sidebar_collapsed', String(val))
  })

  return {
    collapsed,
    SIDEBAR_WIDTH,
    SIDEBAR_COLLAPSED_WIDTH,
    toggle,
    setCollapsed,
  }
})

import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  const collapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')
  const mobileOpen = ref(false)

  const SIDEBAR_WIDTH = 240
  const SIDEBAR_COLLAPSED_WIDTH = 72
  const MOBILE_BREAKPOINT = 768

  function toggle() {
    collapsed.value = !collapsed.value
  }

  function setCollapsed(val: boolean) {
    collapsed.value = val
  }

  function openMobile() {
    mobileOpen.value = true
    document.body.style.overflow = 'hidden'
  }

  function closeMobile() {
    mobileOpen.value = false
    document.body.style.overflow = ''
  }

  function toggleMobile() {
    if (mobileOpen.value) {
      closeMobile()
    } else {
      openMobile()
    }
  }

  watch(collapsed, (val) => {
    localStorage.setItem('sidebar_collapsed', String(val))
  })

  return {
    collapsed,
    mobileOpen,
    SIDEBAR_WIDTH,
    SIDEBAR_COLLAPSED_WIDTH,
    MOBILE_BREAKPOINT,
    toggle,
    setCollapsed,
    openMobile,
    closeMobile,
    toggleMobile,
  }
})

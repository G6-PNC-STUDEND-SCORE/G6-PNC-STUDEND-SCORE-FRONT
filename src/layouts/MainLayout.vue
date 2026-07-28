<template>
  <div class="app-layout">
    <Navigation />
    <div
      class="content-wrapper with-sidebar"
      :style="{ marginLeft: sidebarMargin }"
    >
      <Header />
      <main class="main-content" :class="{ 'no-scroll': (SELF_MANAGED_SCROLL_PAGES as readonly string[]).includes(String(route.name)) }">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import { SELF_MANAGED_SCROLL_PAGES } from '@/constants'
import Navigation from '@/components/Navigation.vue'
import Header from '@/layouts/Header.vue'

const route = useRoute()
const sidebar = useSidebarStore()

const isMobile = ref(window.innerWidth < 768)

const sidebarMargin = computed(() => {
  if (isMobile.value) return '0px'
  return sidebar.collapsed ? sidebar.SIDEBAR_COLLAPSED_WIDTH + 'px' : sidebar.SIDEBAR_WIDTH + 'px'
})

function handleResize() {
  isMobile.value = window.innerWidth < 768

  // Close mobile sidebar on resize to desktop
  if (window.innerWidth >= 768 && sidebar.mobileOpen) {
    sidebar.closeMobile()
  }
}

onMounted(() => {
  // Ensure sidebar shows full labels on desktop (992px+)
  // Handles leftover collapsed state in localStorage from previous sessions
  if (window.innerWidth >= 992 && sidebar.collapsed) {
    sidebar.setCollapsed(false)
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
